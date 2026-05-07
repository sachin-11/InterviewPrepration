import { getConfig, clientSafeError, isProduction } from '../../../lib/config.js';
import { checkRateLimit, getClientKey } from '../../../lib/rateLimit.js';
import { parsePreviewBody } from '../../../lib/validateRequest.js';
import { requireAuth } from '../../../lib/authGuard.js';
import { generateEmailBody } from '../../../lib/llm.js';
import { logError } from '../../../lib/logger.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const auth = await requireAuth(req, res);
    if (!auth.ok) return;

    let config;
    try {
      config = getConfig();
    } catch (e) {
      console.error('Config error:', e);
      return res.status(500).json({
        success: false,
        error: isProduction() ? 'Server misconfiguration' : e.message
      });
    }

    const rate = checkRateLimit(
      `preview:${getClientKey(req)}`,
      config.RATE_LIMIT_MAX,
      config.RATE_LIMIT_WINDOW_MS
    );
    if (!rate.ok) {
      res.setHeader(
        'Retry-After',
        String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000)))
      );
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Try again later.'
      });
    }

    const parsed = parsePreviewBody(req.body ?? {});
    if (!parsed.success) {
      const msg =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
        'Invalid request';
      return res.status(400).json({ success: false, error: msg });
    }

    try {
      const body = await generateEmailBody(parsed.data.prompt, config);
      return res.status(200).json({ success: true, body });
    } catch (err) {
      logError('preview.llm', err);
      return res.status(502).json({
        success: false,
        error: clientSafeError(err, 'Failed to generate preview')
      });
    }
  } catch (err) {
    logError('preview.unhandled', err);
    return res.status(500).json({
      success: false,
      error: isProduction() ? 'Preview failed' : err.message || 'Preview failed'
    });
  }
}

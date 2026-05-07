import { getConfig, clientSafeError, isProduction } from '../../../lib/config.js';
import { checkRateLimit, getClientKey } from '../../../lib/rateLimit.js';
import {
  coerceSendPayload,
  parseSendJson
} from '../../../lib/validateRequest.js';
import { requireAuth } from '../../../lib/authGuard.js';
import { parseMultipartRequest } from '../../../lib/parseMultipart.js';
import { runSendFlow } from '../../../lib/emailPipeline.js';
import { logError } from '../../../lib/logger.js';

export const config = {
  api: {
    bodyParser: false
  }
};

function readJsonBody(req, limit = 2_097_152) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const str = Buffer.concat(chunks).toString('utf8');
        resolve(str ? JSON.parse(str) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth.ok) return;

  let cfg;
  try {
    cfg = getConfig();
  } catch (e) {
    console.error('Config error:', e);
    return res.status(500).json({
      success: false,
      error: isProduction() ? 'Server misconfiguration' : e.message
    });
  }

  const rate = checkRateLimit(
    `send:${getClientKey(req)}`,
    cfg.RATE_LIMIT_MAX,
    cfg.RATE_LIMIT_WINDOW_MS
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

  const ct = req.headers['content-type'] || '';
  let rawPayload;
  let attachments = [];

  try {
    if (ct.includes('multipart/form-data')) {
      const parsed = await parseMultipartRequest(req);
      attachments = parsed.attachments;
      const f = parsed.fields;
      rawPayload = coerceSendPayload({
        to: f.to,
        cc: f.cc,
        bcc: f.bcc,
        subject: f.subject,
        prompt: f.prompt,
        body: f.body,
        templateId: f.templateId ? Number(f.templateId) : undefined,
        scheduleAt: f.scheduleAt
      });
    } else {
      const json = await readJsonBody(req);
      rawPayload = coerceSendPayload(json);
    }
  } catch (e) {
    logError('send.parse', e);
    return res.status(400).json({
      success: false,
      error: isProduction() ? 'Invalid request body' : e.message
    });
  }

  const parsed = parseSendJson(rawPayload);
  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
      parsed.error.flatten().formErrors[0] ||
      'Invalid request';
    return res.status(400).json({ success: false, error: msg });
  }

  try {
    const result = await runSendFlow({
      config: cfg,
      data: parsed.data,
      attachments
    });
    return res.status(200).json(result);
  } catch (err) {
    logError('send.flow', err);
    return res.status(502).json({
      success: false,
      error: clientSafeError(err, 'Failed to send email')
    });
  }
}

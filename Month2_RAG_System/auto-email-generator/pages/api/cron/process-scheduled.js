import { getConfig, isProduction } from '../../../lib/config';
import { processDueScheduledEmails } from '../../../lib/scheduledWorker';
import { logInfo } from '../../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return res.status(503).json({
      success: false,
      error: 'CRON_SECRET not configured'
    });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== secret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

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

  try {
    const result = await processDueScheduledEmails(config);
    logInfo('cron.scheduled', result);
    return res.status(200).json({ success: true, ...result });
  } catch (e) {
    console.error('Cron error:', e);
    return res.status(500).json({
      success: false,
      error: isProduction() ? 'Cron failed' : e.message
    });
  }
}

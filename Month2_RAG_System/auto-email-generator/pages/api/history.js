import { Op } from 'sequelize';
import { EmailHistory, initDb, isDbConfigured } from '../../lib/db';
import { getConfig, isProduction } from '../../lib/config';
import { requireUserOrApiKey } from '../../lib/access';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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

  const gate = await requireUserOrApiKey(req, res, config);
  if (!gate.ok) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'History storage is not configured'
    });
  }

  const { q, dateFrom, dateTo, limit } = req.query;
  const where = {};

  if (typeof q === 'string' && q.trim()) {
    const term = `%${q.trim()}%`;
    where[Op.or] = [
      { recipients: { [Op.iLike]: term } },
      { cc: { [Op.iLike]: term } },
      { bcc: { [Op.iLike]: term } },
      { subject: { [Op.iLike]: term } },
      { body: { [Op.iLike]: term } }
    ];
  }

  if (typeof dateFrom === 'string' && dateFrom) {
    where.sent_at = where.sent_at || {};
    where.sent_at[Op.gte] = new Date(dateFrom);
  }
  if (typeof dateTo === 'string' && dateTo) {
    where.sent_at = where.sent_at || {};
    where.sent_at[Op.lte] = new Date(dateTo);
  }

  const take = Math.min(Number(limit) || 100, 200);

  try {
    await initDb();
    const history = await EmailHistory.findAll({
      where,
      order: [['sent_at', 'DESC']],
      limit: take
    });

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: isProduction() ? 'Failed to load history' : error.message
    });
  }
}

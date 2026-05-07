import { fn, col } from 'sequelize';
import {
  EmailHistory,
  EmailTemplate,
  initDb,
  isDbConfigured
} from '../../lib/db';
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
      error: 'Database not configured'
    });
  }

  try {
    await initDb();
    const total = await EmailHistory.count();
    const sent = await EmailHistory.count({ where: { status: 'sent' } });
    const failed = await EmailHistory.count({ where: { status: 'failed' } });

    const grouped = await EmailHistory.findAll({
      attributes: ['template_id', [fn('COUNT', col('id')), 'count']],
      group: ['template_id'],
      raw: true
    });

    const templateIds = grouped
      .map((g) => g.template_id)
      .filter((id) => id != null);
    const templates =
      templateIds.length > 0
        ? await EmailTemplate.findAll({
            where: { id: templateIds },
            attributes: ['id', 'name', 'slug']
          })
        : [];
    const idToName = Object.fromEntries(
      templates.map((t) => [t.id, t.name || t.slug])
    );

    const templateUsage = grouped.map((row) => ({
      templateId: row.template_id,
      name: row.template_id ? idToName[row.template_id] || 'Unknown' : 'Custom / none',
      count: Number(row.count)
    }));

    res.status(200).json({
      success: true,
      summary: { total, sent, failed },
      templateUsage
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: isProduction() ? 'Failed to load analytics' : error.message
    });
  }
}

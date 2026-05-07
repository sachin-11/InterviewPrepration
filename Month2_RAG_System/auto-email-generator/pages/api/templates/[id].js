import { z } from 'zod';
import { EmailTemplate, initDb, isDbConfigured } from '../../../lib/db';
import { getConfig, isProduction } from '../../../lib/config';
import { requireUserOrApiKey } from '../../../lib/access';

const updateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  name: z.string().min(1).max(128).optional(),
  category: z.string().min(1).max(64).optional(),
  prompt_template: z.string().min(1).max(20000).optional(),
  description: z.string().max(2000).nullable().optional()
});

export default async function handler(req, res) {
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

  await initDb();

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  const row = await EmailTemplate.findByPk(id);
  if (!row) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, template: row });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const parsed = updateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const msg =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
        'Invalid body';
      return res.status(400).json({ success: false, error: msg });
    }
    try {
      await row.update(parsed.data);
      return res.status(200).json({ success: true, template: row });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        return res
          .status(409)
          .json({ success: false, error: 'Slug already exists' });
      }
      console.error(e);
      return res.status(500).json({
        success: false,
        error: isProduction() ? 'Could not update' : e.message
      });
    }
  }

  if (req.method === 'DELETE') {
    await row.destroy();
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

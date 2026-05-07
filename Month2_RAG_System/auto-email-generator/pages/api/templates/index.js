import { z } from 'zod';
import { EmailTemplate, initDb, isDbConfigured } from '../../../lib/db';
import { getConfig, isProduction } from '../../../lib/config';
import { requireUserOrApiKey } from '../../../lib/access';

const createSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  name: z.string().min(1).max(128),
  category: z.string().min(1).max(64),
  prompt_template: z.string().min(1).max(20000),
  description: z.string().max(2000).optional()
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

  try {
    await initDb();
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }

  if (req.method === 'GET') {
    const rows = await EmailTemplate.findAll({ order: [['name', 'ASC']] });
    return res.status(200).json({ success: true, templates: rows });
  }

  if (req.method === 'POST') {
    const parsed = createSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const msg =
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
        'Invalid body';
      return res.status(400).json({ success: false, error: msg });
    }
    try {
      const row = await EmailTemplate.create(parsed.data);
      return res.status(201).json({ success: true, template: row });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        return res
          .status(409)
          .json({ success: false, error: 'Slug already exists' });
      }
      console.error(e);
      return res.status(500).json({
        success: false,
        error: isProduction() ? 'Could not save template' : e.message
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

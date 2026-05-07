import { requireAuth } from './authGuard.js';

export async function requireUserOrApiKey(req, res, config) {
  if (
    config.INTERNAL_API_KEY &&
    req.headers['x-api-key'] === config.INTERNAL_API_KEY
  ) {
    return { ok: true };
  }
  return requireAuth(req, res);
}

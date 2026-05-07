import { getSession } from './session.js';

/**
 * If APP_PASSWORD is set, require iron-session login.
 * If not set, allow all requests (local / internal tooling).
 */
export async function requireAuth(req, res) {
  if (!process.env.APP_PASSWORD?.trim()) {
    return { ok: true, openMode: true };
  }

  try {
    const session = await getSession(req, res);
    if (!session.user) {
      res.status(401).json({ success: false, error: 'Login required' });
      return { ok: false };
    }
    return { ok: true, openMode: false, session };
  } catch (e) {
    console.error('Session error:', e);
    res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === 'production'
          ? 'Session misconfiguration'
          : e.message || 'Session error'
    });
    return { ok: false };
  }
}

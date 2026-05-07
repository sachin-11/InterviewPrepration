import { getSession } from '../../../lib/session.js';
import { AppUser, initDb } from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let hasUsers = false;
  if (AppUser) {
    try {
      await initDb();
      hasUsers = (await AppUser.count()) > 0;
    } catch (e) {
      console.error('auth me db error:', e);
    }
  }

  const hasPasswordMode = Boolean(process.env.APP_PASSWORD?.trim());

  if (!hasUsers && !hasPasswordMode) {
    return res.status(200).json({
      success: true,
      loggedIn: true,
      openMode: true,
      supportsRegistration: Boolean(AppUser),
      authMode: 'open'
    });
  }

  const session = await getSession(req, res);
  return res.status(200).json({
    success: true,
    loggedIn: Boolean(session.user),
    openMode: false,
    supportsRegistration: Boolean(AppUser),
    authMode: hasUsers ? 'users' : 'password',
    user: session.user || null
  });
}

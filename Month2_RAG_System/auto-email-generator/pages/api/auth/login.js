import { getSession } from '../../../lib/session.js';
import { AppUser, initDb } from '../../../lib/db.js';
import { verifyPassword } from '../../../lib/passwords.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();

  if (!password || String(password).trim().length < 1) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }

  try {
    if (AppUser) {
      await initDb();
      const user = normalizedEmail
        ? await AppUser.findOne({ where: { email: normalizedEmail } })
        : null;

      if (user) {
        if (!verifyPassword(password, user.password_hash)) {
          return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const session = await getSession(req, res);
        session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          at: Date.now()
        };
        await session.save();
        return res.status(200).json({
          success: true,
          user: { id: user.id, name: user.name, email: user.email }
        });
      }
    }
  } catch (e) {
    console.error('login db error:', e);
    return res.status(500).json({ success: false, error: 'Could not verify login' });
  }

  const appPassword = process.env.APP_PASSWORD?.trim();
  if (!appPassword) {
    return res.status(401).json({
      success: false,
      error: 'No account found. Please register first.'
    });
  }

  if (password !== appPassword) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  try {
    const session = await getSession(req, res);
    session.user = {
      id: null,
      name: 'Admin',
      email: normalizedEmail || null,
      at: Date.now()
    };
    await session.save();
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('login session error:', e);
    return res.status(500).json({ success: false, error: 'Could not create session' });
  }
}

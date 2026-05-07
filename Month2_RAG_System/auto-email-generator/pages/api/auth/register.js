import { AppUser, initDb } from '../../../lib/db.js';
import { hashPassword } from '../../../lib/passwords.js';
import { getSession } from '../../../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!AppUser) {
    return res.status(503).json({
      success: false,
      error: 'Registration requires DATABASE_URL to be configured'
    });
  }

  const { name, email, password } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '')
    .trim()
    .toLowerCase();
  const cleanPassword = String(password || '');

  if (cleanName.length < 2) {
    return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ success: false, error: 'Enter a valid email address' });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }

  try {
    await initDb();

    const existingUser = await AppUser.findOne({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email is already registered' });
    }

    const user = await AppUser.create({
      name: cleanName,
      email: cleanEmail,
      password_hash: hashPassword(cleanPassword)
    });

    const session = await getSession(req, res);
    session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      at: Date.now()
    };
    await session.save();

    return res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (e) {
    console.error('register error:', e);
    return res.status(500).json({ success: false, error: 'Could not register user' });
  }
}

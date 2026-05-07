import { getIronSession } from 'iron-session';

export function getSessionOptions() {
  const password =
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? null
      : process.env.DEV_SESSION_SECRET || null);

  if (!password || password.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set and at least 32 characters (required when using login)'
    );
  }

  return {
    password,
    cookieName: 'email_gen_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    }
  };
}

export async function getSession(req, res) {
  return getIronSession(req, res, getSessionOptions());
}

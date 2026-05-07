import crypto from 'crypto';

const SCRYPT_KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto
    .scryptSync(password, salt, SCRYPT_KEYLEN)
    .toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;

  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;

  const derivedKey = crypto
    .scryptSync(password, salt, SCRYPT_KEYLEN)
    .toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(originalHash, 'hex'),
    Buffer.from(derivedKey, 'hex')
  );
}

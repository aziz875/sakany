import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';

const BCRYPT_ROUNDS = 10;

export function isBcryptHash(hash: string) {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string) {
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }

  const legacyHash = createHash('sha256').update(password).digest('hex');
  return legacyHash === storedHash;
}

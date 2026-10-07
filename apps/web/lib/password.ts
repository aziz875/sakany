import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string) {
  return bcrypt.compare(password, storedHash);
}

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Set a strong test JWT secret before importing auth-helpers (it validates at module load).
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-that-is-at-least-32-characters-long!';

// Mock prisma before importing auth-helpers, since auth-helpers imports prisma at module level
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

const { signAccessToken, verifyToken } = await import('../auth-helpers');

describe('signAccessToken / verifyToken', () => {
  it('should sign and verify a valid payload round-trip', () => {
    const payload = { sub: 'user-123', email: 'test@esprit.tn', role: 'STUDENT' };
    const token = signAccessToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts

    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('should throw when verifying an invalid token', () => {
    expect(() => verifyToken('not.a.valid.jwt')).toThrow();
  });

  it('should throw when verifying a tampered token', () => {
    const payload = { sub: 'user-456', email: 'admin@esprit.tn', role: 'LANDLORD' };
    const token = signAccessToken(payload);
    const [header, , signature] = token.split('.');
    // Tamper with the payload segment
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'attacker', role: 'ADMIN' })).toString('base64url');
    const tamperedToken = `${header}.${fakePayload}.${signature}`;
    expect(() => verifyToken(tamperedToken)).toThrow();
  });
});

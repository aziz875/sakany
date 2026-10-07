import { NextRequest, type NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, generateRefreshToken, success, unauthorized, forbidden, setRefreshTokenCookie } from '@/lib/auth-helpers';
import { hashPassword, verifyPassword } from '@/lib/password';
import { withApiHandler } from '@/lib/api-handler';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { loginSchema } from '@sakany/shared';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function handler(request: NextRequest): Promise<NextResponse> {
  // Rate limit: 10 login attempts / minute per IP.
  const rl = rateLimit(request);
  if (rl.limited) return rateLimitResponse(rl.retryAfterSeconds);

  const body = await request.json();
  const parsed = loginSchema.parse(body);

  const email = parsed.email.toLowerCase().trim();
  const { password, rememberMe } = parsed;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return unauthorized('Email ou mot de passe incorrect.');
  }

  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    const remainingMs = new Date(user.lockoutUntil).getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return forbidden(`Trop de tentatives. Réessaie dans ${remainingMin} min.`);
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    const newAttempts = user.failedLoginAttempts + 1;
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts, lockoutUntil },
      });
      return forbidden(`Trop de tentatives. Réessaie dans ${LOCKOUT_MINUTES} min.`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: newAttempts },
    });
    return unauthorized('Email ou mot de passe incorrect.');
  }

  if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = await generateRefreshToken(user.id, rememberMe);

  const response = success(
    {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        schoolVerified: user.schoolVerified,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt.toISOString(),
      },
    },
    200,
  );

  return setRefreshTokenCookie(response, refreshToken, rememberMe);
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);

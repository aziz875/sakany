import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, generateRefreshToken, success, conflict, badRequest } from '@/lib/auth-helpers';
import { hashPassword } from '@/lib/password';
import { randomUUID, randomBytes } from 'node:crypto';
import { withApiHandler } from '@/lib/api-handler';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { registerSchema } from '@sakany/shared';
import type { NextResponse } from 'next/server';

async function handler(request: NextRequest): Promise<NextResponse> {
  // Rate limit: 5 registrations / minute per IP.
  const rl = rateLimit(request, 5);
  if (rl.limited) return rateLimitResponse(rl.retryAfterSeconds);

  const body = await request.json();
  const parsed = registerSchema.parse(body);

  const { fullName, password, phone, role } = parsed;
  const email = parsed.email.toLowerCase().trim();
  const phoneClean = phone.replace(/\s/g, '');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return conflict('Un compte existe déjà avec cet email.');
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  const verificationToken = randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const isEspritEmail = email.endsWith('@esprit.tn');

  const createdUser = await prisma.user.create({
    data: {
      id,
      fullName,
      email,
      passwordHash,
      phone: phoneClean,
      role,
      schoolVerified: role === 'STUDENT' && isEspritEmail,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
    },
  });

  // Send the verification email (falls back to console.log in dev without RESEND_API_KEY).
  await sendVerificationEmail(email, verificationToken);

  const accessToken = signAccessToken({ sub: createdUser.id, email, role });
  const refreshToken = await generateRefreshToken(createdUser.id);

  return success(
    {
      accessToken,
      refreshToken,
      user: {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        schoolVerified: createdUser.schoolVerified,
        isEmailVerified: createdUser.isEmailVerified,
        createdAt: createdUser.createdAt.toISOString(),
      },
    },
    201,
  );
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);

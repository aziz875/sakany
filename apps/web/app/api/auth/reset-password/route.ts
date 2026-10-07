import { NextRequest, type NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { signAccessToken, generateRefreshToken, success, badRequest, setRefreshTokenCookie } from '@/lib/auth-helpers';
import { hashPassword } from '@/lib/password';
import { withApiHandler } from '@/lib/api-handler';
import { resetPasswordSchema } from '@sakany/shared';

async function handler(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const parsed = resetPasswordSchema.parse(body);

  // Hash the token to match the hashed value stored in the DB
  const tokenHash = createHash('sha256').update(parsed.token).digest('hex');

  const user = await prisma.user.findFirst({
    where: { resetToken: tokenHash, resetTokenExpiresAt: { gt: new Date() } },
  });

  if (!user) {
    return badRequest('Le lien de réinitialisation est invalide ou a expiré.');
  }

  const passwordHash = await hashPassword(parsed.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = await generateRefreshToken(user.id);

  const response = success({
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
  });

  return setRefreshTokenCookie(response, refreshToken);
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);

import { NextRequest, type NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { signAccessToken, generateRefreshToken, success, unauthorized, getRefreshTokenFromRequest, setRefreshTokenCookie } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';

async function handler(request: NextRequest): Promise<NextResponse> {
  const refreshToken = getRefreshTokenFromRequest(request);
  if (!refreshToken) return unauthorized('Token de rafraîchissement requis.');

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return unauthorized('CSRF interdit.');
  }

  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
  });

  if (!stored) return unauthorized('Token de rafraîchissement invalide ou expiré.');

  // Delete old token (rotation)
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  // Opportunistic cleanup: delete expired refresh tokens (avoids needing a cron)
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  }).catch(() => {});

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) return unauthorized('Utilisateur introuvable.');

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const newRefreshToken = await generateRefreshToken(user.id);

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

  return setRefreshTokenCookie(response, newRefreshToken);
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);
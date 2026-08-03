import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { signAccessToken, generateRefreshToken, success, unauthorized } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) return unauthorized('Token de rafraîchissement requis.');

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });

    if (!stored) return unauthorized('Token de rafraîchissement invalide ou expiré.');

    // Delete old token
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return unauthorized('Utilisateur introuvable.');

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const newRefreshToken = await generateRefreshToken(user.id);

    return success({
      accessToken,
      refreshToken: newRefreshToken,
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
  } catch {
    return unauthorized('Token de rafraîchissement invalide.');
  }
}
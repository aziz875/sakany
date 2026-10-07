import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { success, unauthorized, getRefreshTokenFromRequest, clearRefreshTokenCookieResponse } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromRequest(request);
    if (refreshToken) {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
    const response = success({ message: 'Déconnexion réussie.' });
    return clearRefreshTokenCookieResponse(response);
  } catch {
    return unauthorized('Erreur lors de la déconnexion.');
  }
}
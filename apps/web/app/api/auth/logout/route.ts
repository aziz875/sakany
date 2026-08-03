import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { success, unauthorized } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (refreshToken) {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
    return success({ message: 'Déconnexion réussie.' });
  } catch {
    return unauthorized('Erreur lors de la déconnexion.');
  }
}
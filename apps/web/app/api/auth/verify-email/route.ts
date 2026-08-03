import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, badRequest } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) return badRequest('Token requis.');

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return badRequest('Le lien de vérification est invalide ou a expiré.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    return success({ message: 'Email vérifié avec succès.' });
  } catch {
    return badRequest('Erreur de vérification.');
  }
}
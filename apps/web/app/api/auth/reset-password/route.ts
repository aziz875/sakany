import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, generateRefreshToken, success, badRequest } from '@/lib/auth-helpers';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return badRequest('Token et mot de passe requis.');
    if (password.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return badRequest('Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.');
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiresAt: { gt: new Date() } },
    });

    if (!user) {
      return badRequest('Le lien de réinitialisation est invalide ou a expiré.');
    }

    const passwordHash = await hashPassword(password);

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

    return success({
      accessToken,
      refreshToken,
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
    return badRequest('Erreur lors de la réinitialisation.');
  }
}

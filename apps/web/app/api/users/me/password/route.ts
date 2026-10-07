import { NextRequest, type NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser, success, badRequest } from '@/lib/auth-helpers';
import { hashPassword, verifyPassword } from '@/lib/password';
import { withApiHandler } from '@/lib/api-handler';
import { changePasswordSchema } from '@sakany/shared';

async function handler(request: NextRequest): Promise<NextResponse> {
  const user = await requireAuthUser(request);
  const body = await request.json();
  const parsed = changePasswordSchema.parse(body);

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!fullUser) {
    return badRequest('Utilisateur introuvable.');
  }

  const valid = await verifyPassword(parsed.currentPassword, fullUser.passwordHash);
  if (!valid) {
    return badRequest('Le mot de passe actuel est incorrect.');
  }

  const newHash = await hashPassword(parsed.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return success({ message: 'Mot de passe modifié avec succès.' });
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);

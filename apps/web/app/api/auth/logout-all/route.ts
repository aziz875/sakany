import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, unauthorized } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  return success({ message: 'Déconnecté de tous les appareils.' });
}
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, badRequest, unauthorized, notFound, getAuthUser } from '@/lib/auth-helpers';
import { updateRoommateProfileSchema } from '@sakany/shared';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/colocataires/[id] — get a single roommate profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const profile = await prisma.roommateProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true } },
    },
  });

  if (!profile) return notFound('Profil introuvable.');

  return success(profile);
}

// PUT /api/colocataires/[id] — update own roommate profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const profile = await prisma.roommateProfile.findUnique({ where: { id } });
  if (!profile) return notFound('Profil introuvable.');
  if (profile.userId !== user.id) return unauthorized('Tu ne peux modifier que ton propre profil.');

  const body = await request.json();
  const parsed = updateRoommateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? 'Données invalides.');
  }

  const updated = await prisma.roommateProfile.update({
    where: { id },
    data: {
      ...parsed.data,
      moveInDate: parsed.data.moveInDate ? new Date(parsed.data.moveInDate) : undefined,
    },
    include: {
      user: { select: { id: true, fullName: true } },
    },
  });

  return success(updated);
}

// DELETE /api/colocataires/[id] — deactivate own roommate profile
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const profile = await prisma.roommateProfile.findUnique({ where: { id } });
  if (!profile) return notFound('Profil introuvable.');
  if (profile.userId !== user.id) return unauthorized('Tu ne peux supprimer que ton propre profil.');

  await prisma.roommateProfile.update({
    where: { id },
    data: { active: false },
  });

  return success({ message: 'Profil désactivé.' });
}

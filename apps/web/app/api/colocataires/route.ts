import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, badRequest, unauthorized, getAuthUser } from '@/lib/auth-helpers';
import { createRoommateProfileSchema } from '@sakany/shared';

// GET /api/colocataires — list roommate profiles with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const city = searchParams.get('city');
  const budgetMin = searchParams.get('budgetMin');
  const budgetMax = searchParams.get('budgetMax');
  const university = searchParams.get('university');
  const gender = searchParams.get('gender');
  const smokingPolicy = searchParams.get('smokingPolicy');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);

  const where: Record<string, unknown> = { active: true };

  if (city) {
    where.targetCity = { contains: city, mode: 'insensitive' };
  }
  if (budgetMin) {
    where.budgetMax = { gte: parseInt(budgetMin, 10) };
  }
  if (budgetMax) {
    where.budgetMin = { lte: parseInt(budgetMax, 10) };
  }
  if (university) {
    where.university = { contains: university, mode: 'insensitive' };
  }
  if (gender && gender !== 'no_preference') {
    where.OR = [{ gender }, { gender: 'no_preference' }];
  }
  if (smokingPolicy) {
    where.smokingPolicy = smokingPolicy;
  }

  const [profiles, total] = await Promise.all([
    prisma.roommateProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, fullName: true } },
      },
    }),
    prisma.roommateProfile.count({ where }),
  ]);

  return success({
    profiles,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  });
}

// POST /api/colocataires — create own roommate profile
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Check if profile already exists
  const existing = await prisma.roommateProfile.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return badRequest('Tu as déjà un profil colocataire. Modifie-le plutôt.');
  }

  const body = await request.json();
  const parsed = createRoommateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? 'Données invalides.');
  }

  const profile = await prisma.roommateProfile.create({
    data: {
      userId: user.id,
      ...parsed.data,
      moveInDate: parsed.data.moveInDate ? new Date(parsed.data.moveInDate) : null,
    },
    include: {
      user: { select: { id: true, fullName: true } },
    },
  });

  return success(profile, 201);
}

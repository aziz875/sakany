import { NextRequest, type NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser, success } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { updateProfileSchema } from '@sakany/shared';

async function getHandler(request: NextRequest): Promise<NextResponse> {
  const user = await requireAuthUser(request);
  return success(user);
}

async function patchHandler(request: NextRequest): Promise<NextResponse> {
  const user = await requireAuthUser(request);
  const body = await request.json();
  const parsed = updateProfileSchema.parse(body);

  const updateData: Record<string, string> = {};
  if (parsed.fullName) updateData.fullName = parsed.fullName.trim();
  if (parsed.phone) updateData.phone = parsed.phone.replace(/\s/g, '');

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      schoolVerified: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  return success(updatedUser);
}

export const GET = withApiHandler(getHandler as Parameters<typeof withApiHandler>[0]);
export const PATCH = withApiHandler(patchHandler as Parameters<typeof withApiHandler>[0]);
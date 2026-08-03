import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { updateApplicationSchema } from '@sakany/shared';
import type { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/applications/:id
async function updateApplication(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id: applicationId } = await (context as RouteParams)['params'];

  const user = await getAuthUser(request);
  if (!user || user.role !== 'LANDLORD') {
    return forbidden('Accès réservé aux propriétaires.');
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { listing: true },
  });

  if (!application) {
    return notFound('Candidature introuvable.');
  }

  if (application.listing.landlordId !== user.id) {
    return forbidden('Vous ne pouvez modifier que les candidatures de vos annonces.');
  }

  const body = await request.json();
  const parsed = updateApplicationSchema.parse(body);

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status: parsed.status },
    include: {
      student: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      listing: {
        select: { id: true, title: true, pricePerMonth: true, roomType: true },
      },
    },
  });

  return success(updatedApplication);
}

export const PATCH = withApiHandler(updateApplication as Parameters<typeof withApiHandler>[0]);

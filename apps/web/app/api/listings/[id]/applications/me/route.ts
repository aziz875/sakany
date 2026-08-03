import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import type { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/listings/:id/applications/me
async function getMyApplication(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id: listingId } = await (context as RouteParams)['params'];

  const user = await getAuthUser(request);
  if (!user || user.role !== 'STUDENT') {
    return forbidden('Seuls les étudiants peuvent voir leurs candidatures.');
  }

  // Verify listing exists
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) return notFound('Annonce introuvable.');

  const application = await prisma.application.findFirst({
    where: { studentId: user.id, listingId },
  });

  return success(application || null);
}

export const GET = withApiHandler(getMyApplication as Parameters<typeof withApiHandler>[0]);

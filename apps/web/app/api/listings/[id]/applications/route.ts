import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, badRequest, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { applySchema } from '@sakany/shared';
import type { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/listings/:id/applications
async function applyToListing(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id: listingId } = await (context as RouteParams)['params'];

  const user = await getAuthUser(request);
  if (!user) return forbidden('Tu dois te connecter pour postuler.');
  if (user.role !== 'STUDENT') return forbidden('Seuls les étudiants peuvent postuler.');

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return notFound('Annonce introuvable.');

  const existing = await prisma.application.findFirst({
    where: { studentId: user.id, listingId },
  });
  if (existing) {
    return badRequest('Tu as déjà postulé à cette annonce.');
  }

  const body = await request.json();
  const parsed = applySchema.parse(body);

  const application = await prisma.application.create({
    data: {
      id: randomUUID(),
      studentId: user.id,
      listingId,
      message: parsed.message?.trim() || null,
      status: 'PENDING',
    },
  });

  return success(application, 201);
}

export const POST = withApiHandler(applyToListing as Parameters<typeof withApiHandler>[0]);

import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { createReviewSchema } from '@sakany/shared';
import type { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/listings/:id/reviews
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: listingId } = await params;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return notFound('Annonce introuvable.');

  const reviews = await prisma.review.findMany({
    where: { listingId },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, fullName: true } } },
  });

  return success(reviews);
}

// POST /api/listings/:id/reviews
async function createReview(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id: listingId } = await (context as RouteParams)['params'];

  const user = await getAuthUser(request);
  if (!user || user.role !== 'STUDENT') return forbidden('Seuls les étudiants peuvent laisser un avis.');

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return notFound('Annonce introuvable.');

  // Enforce: student must have an accepted application on this listing
  const application = await prisma.application.findFirst({
    where: { studentId: user.id, listingId, status: 'ACCEPTED' },
  });

  if (!application) {
    return forbidden('Tu dois avoir loué ce logement (candidature acceptée) pour laisser un avis.');
  }

  const body = await request.json();
  const parsed = createReviewSchema.parse(body);

  const review = await prisma.review.create({
    data: {
      id: randomUUID(),
      authorId: user.id,
      listingId,
      rating: parsed.rating,
      comment: parsed.comment,
    },
    include: { author: { select: { id: true, fullName: true } } },
  });

  return success(review, 201);
}

export const POST = withApiHandler(createReview as Parameters<typeof withApiHandler>[0]);

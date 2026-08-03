import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { updateListingSchema } from '@sakany/shared';
import type { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/listings/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      landlord: { select: { id: true, fullName: true, phone: true } },
      photos: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, fullName: true } } },
      },
    },
  });

  if (!listing) return notFound('Annonce introuvable.');

  const reviewCount = listing.reviews.length;
  const averageRating =
    reviewCount > 0 ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : undefined;

  return success({
    id: listing.id,
    landlordId: listing.landlordId,
    title: listing.title,
    description: listing.description,
    lat: listing.lat,
    lng: listing.lng,
    distanceToCampus: listing.distanceToCampus,
    pricePerMonth: listing.pricePerMonth,
    roomType: listing.roomType,
    furnished: listing.furnished,
    verified: listing.verified,
    featured: listing.featured,
    createdAt: listing.createdAt.toISOString(),
    photos: listing.photos,
    landlord: { id: listing.landlord.id, fullName: listing.landlord.fullName },
    reviewCount,
    averageRating,
    reviews: listing.reviews.map((r) => ({
      id: r.id,
      authorId: r.authorId,
      listingId: r.listingId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
    })),
  });
}

// PATCH /api/listings/:id
async function updateListing(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id } = await (context as RouteParams)['params'];

  const user = await getAuthUser(request);
  if (!user || user.role !== 'LANDLORD') return forbidden();

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return notFound('Annonce introuvable.');
  if (listing.landlordId !== user.id) return forbidden('Accès refusé.');

  const body = await request.json();
  const parsed = updateListingSchema.parse(body);

  const updateData: Record<string, unknown> = { ...parsed };

  // Recompute distance if coordinates changed
  if (parsed.lat !== undefined || parsed.lng !== undefined) {
    const lat = parsed.lat ?? listing.lat;
    const lng = parsed.lng ?? listing.lng;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat - 36.8981);
    const dLng = toRad(lng - 10.1872);
    const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(36.8981)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    updateData.distanceToCampus = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  await prisma.listing.update({ where: { id }, data: updateData });

  const updated = await prisma.listing.findUnique({
    where: { id },
    include: {
      landlord: { select: { id: true, fullName: true } },
      photos: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { reviews: true } },
    },
  });

  return success(updated);
}

// POST /api/listings/:id/reveal-phone
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Require authentication before revealing landlord contact info — prevents scraping.
  const user = await getAuthUser(request);
  if (!user) return forbidden('Connecte-toi pour afficher le numéro.');

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { landlord: { select: { phone: true, fullName: true } } },
  });

  if (!listing) return notFound('Annonce introuvable.');

  return success({ phone: listing.landlord.phone, landlordName: listing.landlord.fullName });
}

export const PATCH = withApiHandler(updateListing as Parameters<typeof withApiHandler>[0]);
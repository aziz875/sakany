import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { createListingSchema } from '@sakany/shared';
import type { NextResponse } from 'next/server';

const ESPRIT_CAMPUS = { lat: 36.8981, lng: 10.1872 };

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/listings — search listings
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const roomType = searchParams.get('roomType');
  const furnished = searchParams.get('furnished');
  const verifiedOnly = searchParams.get('verifiedOnly');
  const maxDistanceKm = searchParams.get('maxDistanceKm');
  const mine = searchParams.get('mine');

  const where: Record<string, unknown> = {};

  if (mine === 'true') {
    const user = await getAuthUser(request);
    if (!user) return forbidden();
    where.landlordId = user.id;
  }

  if (minPrice) where.pricePerMonth = { ...(where.pricePerMonth as object), gte: parseInt(minPrice) };
  if (maxPrice) where.pricePerMonth = { ...(where.pricePerMonth as object), lte: parseInt(maxPrice) };
  if (roomType) where.roomType = roomType;
  if (furnished === 'true') where.furnished = true;
  if (furnished === 'false') where.furnished = false;
  if (verifiedOnly === 'true') where.verified = true;
  if (maxDistanceKm) where.distanceToCampus = { lte: parseFloat(maxDistanceKm) };

  const listings = await prisma.listing.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    include: {
      landlord: { select: { id: true, fullName: true } },
      photos: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { reviews: true } },
    },
  });

  const enriched = listings.map((listing) => ({
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
    landlord: listing.landlord,
    reviewCount: listing._count.reviews,
  }));

  return success(enriched);
}

// POST /api/listings — create listing
async function createListing(request: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(request);
  if (!user) return forbidden('Seuls les propriétaires peuvent publier une annonce.');
  if (user.role !== 'LANDLORD') return forbidden('Seuls les propriétaires peuvent publier une annonce.');

  const body = await request.json();
  const parsed = createListingSchema.parse(body);

  const { title, description, lat, lng, pricePerMonth, roomType, furnished } = parsed;
  const distance = Math.round(haversineDistanceKm(lat, lng, ESPRIT_CAMPUS.lat, ESPRIT_CAMPUS.lng) * 10) / 10;

  const listing = await prisma.listing.create({
    data: {
      landlordId: user.id,
      title,
      description,
      lat,
      lng,
      distanceToCampus: distance,
      pricePerMonth,
      roomType,
      furnished: furnished ?? false,
    },
    include: {
      landlord: { select: { id: true, fullName: true } },
      photos: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { reviews: true } },
    },
  });

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
    landlord: listing.landlord,
    reviewCount: listing._count.reviews,
  }, 201);
}

export const POST = withApiHandler(createListing as Parameters<typeof withApiHandler>[0]);
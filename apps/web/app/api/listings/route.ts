import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole, success, forbidden, notFound } from '@/lib/auth-helpers';
import { getListings } from '@/lib/server-queries';
import { withApiHandler } from '@/lib/api-handler';
import { createListingSchema } from '@sakany/shared';
import type { NextResponse } from 'next/server';

const MAX_UNIVERSITY_DISTANCE_KM = 15;

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/listings — search listings with optional viewport bounds + university filter
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  
  const minPrice = searchParams.get('minPrice') ?? undefined;
  const maxPrice = searchParams.get('maxPrice') ?? undefined;
  const roomType = searchParams.get('roomType') ?? undefined;
  const furnished = searchParams.get('furnished') ?? undefined;
  const verifiedOnly = searchParams.get('verifiedOnly') ?? undefined;
  const maxDistanceKm = searchParams.get('maxDistanceKm') ?? undefined;
  const query = searchParams.get('query') ?? undefined;

  // Viewport bounds
  const north = searchParams.get('north') ?? undefined;
  const south = searchParams.get('south') ?? undefined;
  const east = searchParams.get('east') ?? undefined;
  const west = searchParams.get('west') ?? undefined;

  // University filter
  const universityId = searchParams.get('universityId') ?? undefined;
  
  const mine = searchParams.get('mine');
  const view = searchParams.get('view');
  const ownerView = mine === 'true' || view === 'owner';
  const user = ownerView ? await getAuthUser(request) : null;
  if (ownerView && !user) return forbidden();

  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const pageSize = Math.min(pageSizeParam ? parseInt(pageSizeParam, 10) : 20, 50);

  const result = await getListings({
    minPrice,
    maxPrice,
    roomType,
    furnished,
    verifiedOnly,
    maxDistanceKm,
    query,
    north,
    south,
    east,
    west,
    universityId,
    landlordId: ownerView && user ? user.id : undefined,
    page: isNaN(page) ? 1 : page,
    pageSize: isNaN(pageSize) ? 20 : pageSize,
  });
  
  return success(result);
}

// POST /api/listings — create listing, compute distances to all nearby universities
async function createListing(request: NextRequest): Promise<NextResponse> {
  const user = await requireRole(request, 'LANDLORD');

  const body = await request.json();
  const parsed = createListingSchema.parse(body);

  const { title, description, lat, lng, pricePerMonth, roomType, furnished } = parsed;

  // Get all universities to compute distances
  const universities = await prisma.university.findMany({
    select: { id: true, lat: true, lng: true },
  });

  // Compute distances and keep only those within MAX_UNIVERSITY_DISTANCE_KM
  const nearbyUniversities = universities
    .map((uni) => ({
      universityId: uni.id,
      distanceKm: Math.round(haversineDistanceKm(lat, lng, uni.lat, uni.lng) * 10) / 10,
    }))
    .filter((nu) => nu.distanceKm <= MAX_UNIVERSITY_DISTANCE_KM);

  // Use closest university distance as distanceToCampus (backward compat)
  const closestDistance = nearbyUniversities.length > 0
    ? Math.min(...nearbyUniversities.map((nu) => nu.distanceKm))
    : Math.round(haversineDistanceKm(lat, lng, 36.8981, 10.1872) * 10) / 10; // fallback to ESPRIT

  const listing = await prisma.listing.create({
    data: {
      landlordId: user.id,
      title,
      description,
      lat,
      lng,
      distanceToCampus: closestDistance,
      pricePerMonth,
      roomType,
      furnished: furnished ?? false,
      nearbyUniversities: {
        create: nearbyUniversities,
      },
    },
    include: {
      landlord: { select: { id: true, fullName: true } },
      photos: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { reviews: true } },
      nearbyUniversities: {
        orderBy: { distanceKm: 'asc' },
        include: { university: { select: { id: true, name: true, shortName: true } } },
        take: 3,
      },
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
    nearbyUniversities: listing.nearbyUniversities.map((nu) => ({
      universityId: nu.universityId,
      universityName: nu.university?.shortName || nu.university?.name || '',
      distanceKm: nu.distanceKm,
    })),
  }, 201);
}

export const POST = withApiHandler(createListing as Parameters<typeof withApiHandler>[0]);

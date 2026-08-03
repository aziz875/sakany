import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, notFound } from '@/lib/auth-helpers';

// GET /api/listings/:id/similar — fetch similar listings
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { roomType: true, lat: true, lng: true, pricePerMonth: true },
  });

  if (!listing) return notFound('Annonce introuvable.');

  const similar = await prisma.listing.findMany({
    where: {
      id: { not: id },
      roomType: listing.roomType,
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 6,
    include: {
      landlord: { select: { id: true, fullName: true } },
      photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
      _count: { select: { reviews: true } },
    },
  });

  const enriched = similar.map((s) => ({
    id: s.id,
    landlordId: s.landlordId,
    title: s.title,
    description: s.description,
    lat: s.lat,
    lng: s.lng,
    distanceToCampus: s.distanceToCampus,
    pricePerMonth: s.pricePerMonth,
    roomType: s.roomType,
    furnished: s.furnished,
    verified: s.verified,
    featured: s.featured,
    createdAt: s.createdAt.toISOString(),
    photos: s.photos,
    landlord: s.landlord,
    reviewCount: s._count.reviews,
  }));

  return success(enriched);
}
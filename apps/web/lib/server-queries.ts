import { prisma } from './prisma';
import { Listing, Photo, Review, RoomType } from '@sakany/shared';

export type ListingRoomType = RoomType;

export interface ListingSummary {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  distanceToCampus: number;
  pricePerMonth: number;
  roomType: RoomType;
  furnished: boolean;
  verified: boolean;
  featured: boolean;
  createdAt: string;
  photos: Photo[];
  landlord: { id: string; fullName: string };
  reviewCount: number;
  averageRating?: number;
}

export interface ListingDetail extends ListingSummary {
  reviews: (Review & { author?: { id: string; fullName: string } })[];
  landlord: { id: string; fullName: string; phone: string };
}

export async function getListings(params: {
  minPrice?: string;
  maxPrice?: string;
  roomType?: string;
  furnished?: string;
  verifiedOnly?: string;
  maxDistanceKm?: string;
  landlordId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ listings: ListingSummary[]; total: number; hasMore: boolean }> {
  const {
    minPrice,
    maxPrice,
    roomType,
    furnished,
    verifiedOnly,
    maxDistanceKm,
    landlordId,
    page = 1,
    pageSize = 12,
  } = params;

  const where: Record<string, unknown> = {};

  if (landlordId) where.landlordId = landlordId;
  if (minPrice) where.pricePerMonth = { ...(where.pricePerMonth as object), gte: parseInt(minPrice, 10) };
  if (maxPrice) where.pricePerMonth = { ...(where.pricePerMonth as object), lte: parseInt(maxPrice, 10) };
  if (roomType) where.roomType = roomType;
  if (furnished === 'true') where.furnished = true;
  if (furnished === 'false') where.furnished = false;
  if (verifiedOnly === 'true') where.verified = true;
  if (maxDistanceKm) where.distanceToCampus = { lte: parseFloat(maxDistanceKm) };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        landlord: { select: { id: true, fullName: true } },
        photos: { orderBy: { sortOrder: 'asc' }, take: 5 },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const listings: ListingSummary[] = items.map((listing) => ({
    id: listing.id,
    landlordId: listing.landlordId,
    title: listing.title,
    description: listing.description,
    lat: listing.lat,
    lng: listing.lng,
    distanceToCampus: listing.distanceToCampus,
    pricePerMonth: listing.pricePerMonth,
    roomType: listing.roomType as RoomType,
    furnished: listing.furnished,
    verified: listing.verified,
    featured: listing.featured,
    createdAt: listing.createdAt.toISOString(),
    photos: listing.photos,
    landlord: listing.landlord,
    reviewCount: listing._count.reviews,
  }));

  return {
    listings,
    total,
    hasMore: page * pageSize < total,
  };
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
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

  if (!listing) return null;

  const reviewCount = listing.reviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round((listing.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : undefined;

  return {
    id: listing.id,
    landlordId: listing.landlordId,
    title: listing.title,
    description: listing.description,
    lat: listing.lat,
    lng: listing.lng,
    distanceToCampus: listing.distanceToCampus,
    pricePerMonth: listing.pricePerMonth,
    roomType: listing.roomType as RoomType,
    furnished: listing.furnished,
    verified: listing.verified,
    featured: listing.featured,
    createdAt: listing.createdAt.toISOString(),
    photos: listing.photos,
    landlord: { id: listing.landlord.id, fullName: listing.landlord.fullName, phone: listing.landlord.phone },
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
  };
}

export async function getSimilarListings(id: string, roomType: RoomType, take = 6): Promise<ListingSummary[]> {
  const similar = await prisma.listing.findMany({
    where: {
      id: { not: id },
      roomType,
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take,
    include: {
      landlord: { select: { id: true, fullName: true } },
      photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
      _count: { select: { reviews: true } },
    },
  });

  return similar.map((s) => ({
    id: s.id,
    landlordId: s.landlordId,
    title: s.title,
    description: s.description,
    lat: s.lat,
    lng: s.lng,
    distanceToCampus: s.distanceToCampus,
    pricePerMonth: s.pricePerMonth,
    roomType: s.roomType as RoomType,
    furnished: s.furnished,
    verified: s.verified,
    featured: s.featured,
    createdAt: s.createdAt.toISOString(),
    photos: s.photos,
    landlord: s.landlord,
    reviewCount: s._count.reviews,
  }));
}
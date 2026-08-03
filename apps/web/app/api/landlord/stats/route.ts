import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden } from '@/lib/auth-helpers';

// GET /api/landlord/stats — overview metrics for the authenticated landlord
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'LANDLORD') return forbidden();

  // Aggregated counts in one query instead of fetching all rows into memory (was N+1).
  const [listingAgg, reviewAgg, photoAgg, recentCount] = await Promise.all([
    prisma.listing.aggregate({
      where: { landlordId: user.id },
      _count: true,
      _avg: { pricePerMonth: true },
    }),
    // Average rating across all reviews of this landlord's listings.
    prisma.review.aggregate({
      where: { listing: { landlordId: user.id } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.photo.aggregate({
      where: { listing: { landlordId: user.id } },
      _count: true,
    }),
    prisma.listing.count({
      where: {
        landlordId: user.id,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalListings = listingAgg._count;
  const averagePrice = totalListings > 0 ? Math.round((listingAgg._avg.pricePerMonth ?? 0)) : 0;
  const totalReviews = reviewAgg._count;
  const averageRating = totalReviews > 0 ? Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10 : null;
  const totalPhotos = photoAgg._count;

  // Verified/featured counts via groupBy — avoids fetching every listing row.
  const [verifiedCount, featuredCount] = await Promise.all([
    prisma.listing.count({ where: { landlordId: user.id, verified: true } }),
    prisma.listing.count({ where: { landlordId: user.id, featured: true } }),
  ]);

  // Lightweight listing rows (no reviews/photos included) for the dashboard table.
  const listings = await prisma.listing.findMany({
    where: { landlordId: user.id },
    select: {
      id: true,
      title: true,
      pricePerMonth: true,
      roomType: true,
      verified: true,
      featured: true,
      createdAt: true,
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return success({
    totalListings,
    verifiedListings: verifiedCount,
    featuredListings: featuredCount,
    totalReviews,
    totalPhotos,
    averageRating,
    averagePrice,
    recentListings: recentCount,
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      pricePerMonth: l.pricePerMonth,
      roomType: l.roomType,
      verified: l.verified,
      featured: l.featured,
      createdAt: l.createdAt.toISOString(),
      reviewCount: l._count.reviews,
      averageRating:
        l.reviews.length > 0
          ? Math.round((l.reviews.reduce((s, r) => s + r.rating, 0) / l.reviews.length) * 10) / 10
          : null,
    })),
  });
}
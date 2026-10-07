import { prisma } from './prisma';
import { time } from './perf';
import { Listing, Photo, Review, RoomType } from '@sakany/shared';
import { UNIVERSITY_SEED_DATA } from './constants';

export type ListingRoomType = RoomType;

// ---- In-memory cache ----
const CACHE_TTL_MS = 60_000; // 60 seconds default
const cache = new Map<string, { value: unknown; expiresAt: number }>();

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function cacheSet<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): T {
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, e] of cache) {
      if (e.expiresAt < now) cache.delete(k);
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (i < retries && (err?.code === 'ETIMEDOUT' || err?.message?.includes('ETIMEDOUT') || err?.code === 'P1001')) {
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

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
  nearbyUniversities?: { universityId: string; universityName: string; distanceKm: number }[];
}

export interface ListingDetail extends ListingSummary {
  reviews: (Review & { author?: { id: string; fullName: string } })[];
  landlord: { id: string; fullName: string; phone: string; createdAt: string; listingCount: number };
}

type ListingCoreResult = Omit<ListingDetail, 'reviews'>;

export async function getListingCore(id: string): Promise<ListingCoreResult | null> {
  if (!id) return null;
  const cacheKey = `listing-core:${id}`;
  const cached = cacheGet<ListingCoreResult | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const listing = await withRetry(() =>
      time('getListingCore.findUnique', () =>
        prisma.listing.findUnique({
          where: { id },
          include: {
            landlord: { select: { id: true, fullName: true, phone: true, createdAt: true, _count: { select: { listings: true } } } },
            photos: { orderBy: { sortOrder: 'asc' } },
          },
        }),
      )
    );

    if (!listing) return null;

    const result: ListingCoreResult = {
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
      landlord: {
        id: listing.landlord.id,
        fullName: listing.landlord.fullName,
        phone: listing.landlord.phone,
        createdAt: listing.landlord.createdAt.toISOString(),
        listingCount: listing.landlord._count.listings
      },
      reviewCount: 0,
    };

    return cacheSet(cacheKey, result);
  } catch (error: any) {
    console.warn(`[getListingCore] Transient DB error for id "${id}":`, error?.code || error?.message);
    return null;
  }
}

export async function getListingReviews(id: string) {
  if (!id) return [];
  const cacheKey = `listing-reviews:${id}`;
  const cached = cacheGet<ListingDetail['reviews']>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const reviews = await withRetry(() =>
      time('getListingReviews.findMany', () =>
        prisma.review.findMany({
          where: { listingId: id },
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, fullName: true } } },
        }),
      )
    );

    const result = reviews.map((r) => ({
      id: r.id,
      authorId: r.authorId,
      listingId: r.listingId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
    }));

    return cacheSet(cacheKey, result);
  } catch (error: any) {
    console.warn(`[getListingReviews] Transient DB error for id "${id}":`, error?.code || error?.message);
    return [];
  }
}

export async function getListings(params: {
  minPrice?: string;
  maxPrice?: string;
  roomType?: string;
  furnished?: string;
  verifiedOnly?: string;
  maxDistanceKm?: string;
  landlordId?: string;
  query?: string;
  north?: string;
  south?: string;
  east?: string;
  west?: string;
  universityId?: string;
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
    query,
    north,
    south,
    east,
    west,
    universityId,
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

  // Geographic viewport bounds filtering — done at DB level
  if (north && south && east && west) {
    const n = parseFloat(north);
    const s = parseFloat(south);
    const e = parseFloat(east);
    const w = parseFloat(west);
    if (!isNaN(n) && !isNaN(s) && !isNaN(e) && !isNaN(w)) {
      where.lat = { gte: s, lte: n };
      where.lng = { gte: w, lte: e };
    }
  }

  // University proximity filtering via junction table
  if (universityId) {
    where.nearbyUniversities = { some: { universityId } };
  }

  if (query) {
    const cleanQuery = query.trim();
    const subTerms = cleanQuery
      .split(/[/(),]/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);

    const conditions: Array<Record<string, unknown>> = [
      { title: { contains: cleanQuery, mode: 'insensitive' } },
      { description: { contains: cleanQuery, mode: 'insensitive' } },
    ];

    for (const term of subTerms) {
      if (term.toLowerCase() !== cleanQuery.toLowerCase()) {
        conditions.push(
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        );
      }
    }

    where.OR = conditions;
  }

  const cacheKey = `listings:${JSON.stringify(params)}`;
  const cached = cacheGet<{ listings: ListingSummary[]; total: number; hasMore: boolean }>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const includeUniversities = !!universityId;

    const [items, total] = await withRetry(() =>
      Promise.all([
        time('getListings.findMany', () =>
          prisma.listing.findMany({
            where,
            orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
              landlord: { select: { id: true, fullName: true } },
              photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
              ...(includeUniversities
                ? {
                    nearbyUniversities: {
                      where: { universityId },
                      include: { university: { select: { id: true, name: true, shortName: true } } },
                      take: 1,
                    },
                  }
                : {
                    nearbyUniversities: {
                      orderBy: { distanceKm: 'asc' as const },
                      include: { university: { select: { id: true, name: true, shortName: true } } },
                      take: 3,
                    },
                  }),
            },
          }),
        ),
        time('getListings.count', () => prisma.listing.count({ where })),
      ])
    );

    const listings: ListingSummary[] = items.map((listing: any) => ({
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
      reviewCount: 0,
      nearbyUniversities: (listing.nearbyUniversities || []).map((nu: any) => ({
        universityId: nu.universityId,
        universityName: nu.university?.shortName || nu.university?.name || '',
        distanceKm: nu.distanceKm,
      })),
    }));

    const result = {
      listings,
      total,
      hasMore: page * pageSize < total,
    };

    return cacheSet(cacheKey, result);
  } catch (error: any) {
    console.warn('[getListings] Transient DB error:', error?.code || error?.message);
    return { listings: [], total: 0, hasMore: false };
  }
}

export async function getUniversities(): Promise<{ id: string; name: string; shortName: string | null; lat: number; lng: number }[]> {
  const cacheKey = 'universities:all';
  const cached = cacheGet<{ id: string; name: string; shortName: string | null; lat: number; lng: number }[]>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const universities = await withRetry(
      () =>
        prisma.university.findMany({
          orderBy: { name: 'asc' },
          select: { id: true, name: true, shortName: true, lat: true, lng: true },
        }),
      1,
      200
    );

    if (universities && universities.length > 0) {
      return cacheSet(cacheKey, universities, 3_600_000); // Cache for 1 hour
    }
  } catch (error: any) {
    console.warn('[getUniversities] DB query error, using static fallback:', error?.code || error?.message);
  }

  // Instant 0ms fallback to pre-compiled seed data
  const fallback = UNIVERSITY_SEED_DATA.map((u, idx) => ({
    id: `uni-${idx}`,
    name: u.name,
    shortName: u.shortName || null,
    lat: u.lat,
    lng: u.lng,
  }));

  return cacheSet(cacheKey, fallback, 3_600_000);
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const core = await getListingCore(id);
  if (!core) return null;
  const reviews = await getListingReviews(id);
  return { ...core, reviews };
}

export async function getSimilarListings(id: string, roomType: RoomType, take = 4): Promise<ListingSummary[]> {
  const cacheKey = `similar:${id}:${roomType}`;
  const cached = cacheGet<ListingSummary[]>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const similar = await withRetry(() =>
      time('getSimilarListings.findMany', () =>
        prisma.listing.findMany({
          where: {
            id: { not: id },
            roomType,
          },
          orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
          take,
          include: {
            landlord: { select: { id: true, fullName: true } },
            photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        }),
      )
    );

    const result = similar.map((s) => ({
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
      reviewCount: 0,
    }));

    return cacheSet(cacheKey, result);
  } catch (error: any) {
    console.warn(`[getSimilarListings] Transient DB error for id "${id}":`, error?.code || error?.message);
    return [];
  }
}

export interface RoommateProfileSummary {
  id: string;
  userId: string;
  bio: string;
  budgetMin: number;
  budgetMax: number;
  targetCity: string;
  university: string | null;
  moveInDate: string | null;
  sleepSchedule: string | null;
  cleanlinessLevel: string | null;
  smokingPolicy: string | null;
  guestsPolicy: string | null;
  gender: string | null;
  age: number | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    phone?: string;
  };
}

export interface RoommateQueryParams {
  city?: string;
  budgetMin?: string | number;
  budgetMax?: string | number;
  university?: string;
  gender?: string;
  smokingPolicy?: string;
  cleanlinessLevel?: string;
  sleepSchedule?: string;
  page?: number;
  pageSize?: number;
}

export async function getRoommateProfiles(params: RoommateQueryParams = {}): Promise<{ profiles: RoommateProfileSummary[]; total: number }> {
  const cacheKey = `roommates:${JSON.stringify(params)}`;
  const cached = cacheGet<{ profiles: RoommateProfileSummary[]; total: number }>(cacheKey);
  if (cached !== undefined) return cached;

  const { city, budgetMin, budgetMax, university, gender, smokingPolicy, cleanlinessLevel, sleepSchedule, page = 1, pageSize = 24 } = params;

  const where: any = { active: true };

  if (city && city.trim() !== '') {
    where.targetCity = { contains: city.trim(), mode: 'insensitive' };
  }
  if (budgetMin !== undefined && budgetMin !== '') {
    const minVal = typeof budgetMin === 'number' ? budgetMin : parseInt(budgetMin, 10);
    if (!isNaN(minVal)) {
      where.budgetMax = { gte: minVal };
    }
  }
  if (budgetMax !== undefined && budgetMax !== '') {
    const maxVal = typeof budgetMax === 'number' ? budgetMax : parseInt(budgetMax, 10);
    if (!isNaN(maxVal)) {
      where.budgetMin = { lte: maxVal };
    }
  }
  if (university && university.trim() !== '') {
    where.university = { contains: university.trim(), mode: 'insensitive' };
  }
  if (gender && gender !== 'no_preference') {
    where.OR = [{ gender }, { gender: 'no_preference' }, { gender: null }];
  }
  if (smokingPolicy) {
    where.smokingPolicy = smokingPolicy;
  }
  if (cleanlinessLevel) {
    where.cleanlinessLevel = cleanlinessLevel;
  }
  if (sleepSchedule) {
    where.sleepSchedule = sleepSchedule;
  }

  try {
    const [profiles, total] = await withRetry(() =>
      time('getRoommateProfiles.findMany', () =>
        Promise.all([
          (prisma as any).roommateProfile.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
              user: { select: { id: true, fullName: true, phone: true } },
            },
          }),
          (prisma as any).roommateProfile.count({ where }),
        ]),
      ),
    );

    const formatted: RoommateProfileSummary[] = (profiles || []).map((p: any) => ({
      id: p.id,
      userId: p.userId,
      bio: p.bio,
      budgetMin: p.budgetMin,
      budgetMax: p.budgetMax,
      targetCity: p.targetCity,
      university: p.university ?? null,
      moveInDate: p.moveInDate ? p.moveInDate.toISOString() : null,
      sleepSchedule: p.sleepSchedule ?? null,
      cleanlinessLevel: p.cleanlinessLevel ?? null,
      smokingPolicy: p.smokingPolicy ?? null,
      guestsPolicy: p.guestsPolicy ?? null,
      gender: p.gender ?? null,
      age: p.age ?? null,
      avatarUrl: p.avatarUrl ?? null,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
    }));

    return cacheSet(cacheKey, { profiles: formatted, total });
  } catch (error: any) {
    console.warn('[getRoommateProfiles] Transient DB error:', error?.code || error?.message);
    return { profiles: [], total: 0 };
  }
}

export async function getRoommateProfile(id: string): Promise<RoommateProfileSummary | null> {
  if (!id) return null;
  const cacheKey = `roommate:${id}`;
  const cached = cacheGet<RoommateProfileSummary | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const p: any = await withRetry(() =>
      time('getRoommateProfile.findUnique', () =>
        (prisma as any).roommateProfile.findUnique({
          where: { id },
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
          },
        }),
      ),
    );

    if (!p) return null;

    const result: RoommateProfileSummary = {
      id: p.id,
      userId: p.userId,
      bio: p.bio,
      budgetMin: p.budgetMin,
      budgetMax: p.budgetMax,
      targetCity: p.targetCity,
      university: p.university ?? null,
      moveInDate: p.moveInDate ? p.moveInDate.toISOString() : null,
      sleepSchedule: p.sleepSchedule ?? null,
      cleanlinessLevel: p.cleanlinessLevel ?? null,
      smokingPolicy: p.smokingPolicy ?? null,
      guestsPolicy: p.guestsPolicy ?? null,
      gender: p.gender ?? null,
      age: p.age ?? null,
      avatarUrl: p.avatarUrl ?? null,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
    };

    return cacheSet(cacheKey, result);
  } catch (error: any) {
    console.warn(`[getRoommateProfile] Transient DB error for id "${id}":`, error?.code || error?.message);
    return null;
  }
}
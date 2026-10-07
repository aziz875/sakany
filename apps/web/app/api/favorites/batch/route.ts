import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { listingIds = [] } = body;
    if (!Array.isArray(listingIds)) {
      return NextResponse.json({ error: 'listingIds must be an array' }, { status: 400 });
    }

    // Filter only existing listings in database to prevent Foreign Key constraint failure
    if (listingIds.length > 0) {
      const existingListings = await prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: { id: true },
      });
      const validListingIds = existingListings.map((l) => l.id);

      if (validListingIds.length > 0) {
        await prisma.favorite.createMany({
          data: validListingIds.map((listingId) => ({ userId: user.id, listingId })),
          skipDuplicates: true,
        });
      }
    }

    const updatedFavorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: { listingId: true },
    });

    return NextResponse.json(updatedFavorites.map((f) => f.listingId));
  } catch (err: any) {
    console.error('Error in /api/favorites/batch:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

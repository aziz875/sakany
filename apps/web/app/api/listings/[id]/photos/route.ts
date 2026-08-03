import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, badRequest, forbidden, notFound } from '@/lib/auth-helpers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return forbidden();

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return notFound('Annonce introuvable.');
  if (listing.landlordId !== user.id) return forbidden('Accès refusé.');

  try {
    const body = await request.json();
    const { photos } = body;

    if (!photos || !Array.isArray(photos)) {
      return badRequest('Photos requises.');
    }

    for (const photo of photos) {
      await prisma.photo.create({
        data: {
          id: randomUUID(),
          listingId: id,
          url: photo.url,
          sortOrder: photo.sortOrder ?? 0,
        },
      });
    }

    const updated = await prisma.listing.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        landlord: { select: { id: true, fullName: true } },
        _count: { select: { reviews: true } },
      },
    });

    return success(updated);
  } catch {
    return badRequest('Erreur lors de l\'ajout des photos.');
  }
}
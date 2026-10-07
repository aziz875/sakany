import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, badRequest, forbidden, notFound } from '@/lib/auth-helpers';
import { uploadListingPhoto } from '@/lib/storage';
import { withApiHandler } from '@/lib/api-handler';
import type { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_COUNT = 10;

async function handler(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const user = await getAuthUser(request);
  if (!user) return forbidden();

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return notFound('Annonce introuvable.');
  if (listing.landlordId !== user.id) return forbidden('Accès refusé.');

  const formData = await request.formData();
  const files = formData.getAll('file') as File[];
  let sortOffset = parseInt(formData.get('sortOffset') as string || '0', 10);

  // Validate file count
  if (files.length === 0) return badRequest('Aucun fichier fourni.');
  if (files.length > MAX_FILE_COUNT) return badRequest(`Maximum ${MAX_FILE_COUNT} photos par envoi.`);

  // Validate each file
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest(`Type de fichier non autorisé : ${file.type}. Formats acceptés : JPG, PNG, WEBP.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      return badRequest(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 5 Mo.`);
    }
  }

  const uploadedPhotos = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = Buffer.from(await file.arrayBuffer());

    const publicUrl = await uploadListingPhoto(buffer, file.type, id, i + sortOffset);

    const photo = await prisma.photo.create({
      data: {
        id: randomUUID(),
        listingId: id,
        url: publicUrl,
        sortOrder: i + sortOffset,
      },
    });
    uploadedPhotos.push(photo);
  }

  return success(uploadedPhotos, 201);
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);

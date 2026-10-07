import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, badRequest, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { applySchema } from '@sakany/shared';
import { createUserNotification } from '@/lib/notifications';
import type { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/listings/:id/applications
async function applyToListing(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id: listingId } = await (context as RouteParams)['params'];

  const user = await getAuthUser(request);
  if (!user) return forbidden('Tu dois te connecter pour postuler.');
  if (user.role !== 'STUDENT') return forbidden('Seuls les étudiants peuvent postuler.');

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { landlord: { select: { id: true, fullName: true } } },
  });
  if (!listing) return notFound('Annonce introuvable.');

  const existing = await prisma.application.findFirst({
    where: { studentId: user.id, listingId },
  });
  if (existing) {
    return badRequest('Tu as déjà postulé à cette annonce.');
  }

  const body = await request.json().catch(() => ({}));
  const parsed = applySchema.parse(body);

  const application = await prisma.application.create({
    data: {
      id: randomUUID(),
      studentId: user.id,
      listingId,
      message: parsed.message?.trim() || null,
      status: 'PENDING',
    },
  });

  // 1. Notify landlord about the new application
  await createUserNotification({
    userId: listing.landlordId,
    type: 'NEW_APPLICATION',
    title: 'Nouvelle candidature reçue ! 🏠',
    message: `${user.fullName} a déposé une candidature pour votre logement "${listing.title}".`,
    link: '/landlord/applications',
  });

  // 2. Automatically link / create a conversation between student and landlord
  try {
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: listing.landlordId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: user.id, lastReadAt: new Date() },
              { userId: listing.landlordId },
            ],
          },
        },
      });
    }

    const applicationMsgContent = parsed.message?.trim()
      ? `📋 Candidature envoyée pour le logement "${listing.title}".\n\n"${parsed.message.trim()}"`
      : `📋 Bonjour, je viens de déposer ma candidature pour votre logement "${listing.title}".`;

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: applicationMsgContent,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  } catch (chatErr) {
    console.warn('Auto conversation create warning:', chatErr);
  }

  return success(application, 201);
}

export const POST = withApiHandler(applyToListing as Parameters<typeof withApiHandler>[0]);

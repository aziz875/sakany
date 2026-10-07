import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden, notFound } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { updateApplicationSchema } from '@sakany/shared';
import { createUserNotification } from '@/lib/notifications';
import type { NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/applications/:id
async function updateApplication(request: NextRequest, context?: unknown): Promise<NextResponse> {
  const { id: applicationId } = await (context as RouteParams)['params'];

  const user = await getAuthUser(request);
  if (!user || user.role !== 'LANDLORD') {
    return forbidden('Accès réservé aux propriétaires.');
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { listing: true, student: true },
  });

  if (!application) {
    return notFound('Candidature introuvable.');
  }

  if (application.listing.landlordId !== user.id) {
    return forbidden('Vous ne pouvez modifier que les candidatures de vos annonces.');
  }

  const body = await request.json();
  const parsed = updateApplicationSchema.parse(body);

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status: parsed.status },
    include: {
      student: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      listing: {
        select: { id: true, title: true, pricePerMonth: true, roomType: true },
      },
    },
  });

  // Notify student about application decision
  const isAccepted = parsed.status === 'ACCEPTED';
  await createUserNotification({
    userId: application.studentId,
    type: isAccepted ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
    title: isAccepted ? 'Candidature acceptée ! 🎉' : 'Mise à jour de votre candidature',
    message: isAccepted
      ? `Félicitations ! Le propriétaire a accepté votre candidature pour "${application.listing.title}".`
      : `Le propriétaire n'a pas retenu votre candidature pour "${application.listing.title}".`,
    link: `/messages`,
  });

  // Post update message in conversation if exists
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: application.studentId } } },
        ],
      },
    });

    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: isAccepted
            ? `✅ J'ai accepté votre candidature pour le logement "${application.listing.title}". N'hésitez pas à me poser vos questions ici !`
            : `Statut de candidature mis à jour : non retenue pour "${application.listing.title}".`,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }
  } catch (err) {
    console.warn('Could not post status update message to chat:', err);
  }

  return success(updatedApplication);
}

export const PATCH = withApiHandler(updateApplication as Parameters<typeof withApiHandler>[0]);

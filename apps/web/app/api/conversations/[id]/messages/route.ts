import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, badRequest, unauthorized, forbidden, getAuthUser } from '@/lib/auth-helpers';
import { sendMessageSchema } from '@sakany/shared';
import { createUserNotification } from '@/lib/notifications';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/conversations/[id]/messages — paginated messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Verify user is part of this conversation
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: user.id },
    },
  });
  if (!participant) return forbidden('Tu ne fais pas partie de cette conversation.');

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get('cursor');
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'desc' },
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  const hasMore = messages.length > pageSize;
  const result = hasMore ? messages.slice(0, pageSize) : messages;

  // Update lastReadAt for current user
  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  return success({
    messages: result.reverse(), // Return in chronological order
    hasMore,
    nextCursor: hasMore ? result[result.length - 1]?.id : null,
  });
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Verify user is part of this conversation
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId: id, userId: user.id },
    },
  });
  if (!participant) return forbidden('Tu ne fais pas partie de cette conversation.');

  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? 'Données invalides.');
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: user.id,
      content: parsed.data.content,
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  // Update conversation timestamp & sender lastReadAt
  await Promise.all([
    prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
    prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    }),
  ]);

  // Find other participant and send notification
  const otherParticipant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: id,
      userId: { not: user.id },
    },
  });

  if (otherParticipant) {
    await createUserNotification({
      userId: otherParticipant.userId,
      type: 'NEW_MESSAGE',
      title: `Nouveau message de ${user.fullName}`,
      message: parsed.data.content.length > 90 ? `${parsed.data.content.slice(0, 87)}...` : parsed.data.content,
      link: `/messages?conversationId=${id}`,
    });
  }

  return success(message, 201);
}

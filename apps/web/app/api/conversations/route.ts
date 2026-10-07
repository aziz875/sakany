import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, badRequest, unauthorized, getAuthUser } from '@/lib/auth-helpers';
import { startConversationSchema } from '@sakany/shared';
import { createUserNotification } from '@/lib/notifications';

// GET /api/conversations — list user's conversations
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: user.id } },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: {
        include: {
          user: { select: { id: true, fullName: true, role: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  // Single query to get all unread counts instead of N+1
  const convIds = conversations.map((c) => c.id);
  const unreadCounts = convIds.length > 0
    ? await prisma.$queryRawUnsafe<{ conversationId: string; count: bigint }[]>(
        `SELECT "conversationId", count(*) as count FROM "Message"
         WHERE "conversationId" = ANY($1::text[])
         AND "senderId" != $2
         AND "createdAt" > COALESCE(
           (SELECT "lastReadAt" FROM "ConversationParticipant"
            WHERE "conversationId" = "Message"."conversationId" AND "userId" = $2),
           '1970-01-01'::timestamp
         )
         GROUP BY "conversationId"`,
        convIds,
        user.id,
      ).catch(() => [] as { conversationId: string; count: bigint }[])
    : [];

  const unreadMap = new Map(unreadCounts.map((r) => [r.conversationId, Number(r.count)]));

  const result = conversations.map((conv) => {
    const otherParticipant = conv.participants.find((p) => p.userId !== user.id);
    const lastMessage = conv.messages[0] ?? null;

    return {
      id: conv.id,
      otherUser: otherParticipant?.user ?? { id: '', fullName: 'Utilisateur supprimé', role: 'STUDENT' },
      lastMessage: lastMessage
        ? { content: lastMessage.content, createdAt: lastMessage.createdAt.toISOString(), senderId: lastMessage.senderId }
        : null,
      unreadCount: unreadMap.get(conv.id) ?? 0,
      updatedAt: conv.updatedAt.toISOString(),
    };
  });

  return success(result);
}

// POST /api/conversations — create or find existing conversation
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? 'Données invalides.');
  }

  const { recipientId, content } = parsed.data;

  if (recipientId === user.id) {
    return badRequest('Tu ne peux pas te parler à toi-même.');
  }

  // Check if recipient exists
  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) return badRequest('Destinataire introuvable.');

  // Find existing conversation between these two users
  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: recipientId } } },
      ],
    },
  });

  if (!conversation) {
    // Create new conversation
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: user.id, lastReadAt: new Date() },
            { userId: recipientId },
          ],
        },
      },
    });
  }

  // Send the message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content,
    },
    include: {
      sender: { select: { id: true, fullName: true } },
    },
  });

  // Update conversation timestamp & sender lastReadAt
  await Promise.all([
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
    prisma.conversationParticipant.updateMany({
      where: { conversationId: conversation.id, userId: user.id },
      data: { lastReadAt: new Date() },
    }),
  ]);

  // Create notification for recipient
  await createUserNotification({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    title: `Nouveau message de ${user.fullName}`,
    message: content.length > 90 ? `${content.slice(0, 87)}...` : content,
    link: `/messages?conversationId=${conversation.id}`,
  });

  return success({ conversationId: conversation.id, message }, 201);
}

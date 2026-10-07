import { randomUUID } from 'node:crypto';
import { prisma } from './prisma';

export type NotificationInput = {
  userId: string;
  type: 'NEW_MESSAGE' | 'NEW_APPLICATION' | 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED' | 'GENERAL';
  title: string;
  message: string;
  link?: string;
};

/**
 * Creates an in-app notification for a user.
 * Supports both Prisma delegate and raw SQL fallback for instant reliability.
 */
export async function createUserNotification(input: NotificationInput) {
  try {
    if ((prisma as any).notification?.create) {
      return await (prisma as any).notification.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link || null,
          read: false,
        },
      });
    }

    // Direct SQL fallback
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Notification" ("id", "userId", "type", "title", "message", "link", "read", "createdAt")
       VALUES ($1, $2, $3::"NotificationType", $4, $5, $6, false, NOW())`,
      id,
      input.userId,
      input.type,
      input.title,
      input.message,
      input.link || null
    );

    return { id, userId: input.userId, type: input.type, title: input.title, message: input.message, link: input.link, read: false };
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

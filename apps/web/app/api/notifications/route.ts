import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, badRequest, unauthorized, getAuthUser } from '@/lib/auth-helpers';

// GET /api/notifications — list recent notifications + unread count
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    if ((prisma as any).notification?.findMany) {
      const [notifications, unreadCount] = await Promise.all([
        (prisma as any).notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        (prisma as any).notification.count({
          where: { userId: user.id, read: false },
        }),
      ]);

      return success({
        notifications: notifications.map((n: any) => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
        })),
        unreadCount,
      });
    }

    // Direct SQL fallback
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "id", "userId", "type", "title", "message", "link", "read", "createdAt"
         FROM "Notification"
         WHERE "userId" = $1
         ORDER BY "createdAt" DESC
         LIMIT 30`,
        user.id
      ),
      prisma.$queryRawUnsafe<{ count: string | number | bigint }[]>(
        `SELECT count(*) as count FROM "Notification" WHERE "userId" = $1 AND "read" = false`,
        user.id
      ),
    ]);

    const unreadCount = Number(countRows[0]?.count || 0);

    return success({
      notifications: (rows || []).map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
      })),
      unreadCount,
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return success({ notifications: [], unreadCount: 0 });
  }
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if ((prisma as any).notification?.updateMany) {
      if (markAll) {
        await (prisma as any).notification.updateMany({
          where: { userId: user.id, read: false },
          data: { read: true },
        });
        return success({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
      }

      if (notificationId) {
        await (prisma as any).notification.updateMany({
          where: { id: notificationId, userId: user.id },
          data: { read: true },
        });
        return success({ success: true, message: 'Notification marquée comme lue.' });
      }
    } else {
      // Direct SQL fallback
      if (markAll) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Notification" SET "read" = true WHERE "userId" = $1 AND "read" = false`,
          user.id
        );
        return success({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
      }

      if (notificationId) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Notification" SET "read" = true WHERE "id" = $1 AND "userId" = $2`,
          notificationId,
          user.id
        );
        return success({ success: true, message: 'Notification marquée comme lue.' });
      }
    }

    return badRequest('Paramètre notificationId ou markAll requis.');
  } catch (err: any) {
    console.error('Error updating notifications:', err);
    return badRequest(err?.message || 'Erreur lors de la mise à jour des notifications.');
  }
}

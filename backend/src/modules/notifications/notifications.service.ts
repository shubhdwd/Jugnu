import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { Prisma } from '@prisma/client';

export async function getByUser(userId: string, unreadOnly = false) {
  const where: Prisma.NotificationWhereInput = { userId };
  if (unreadOnly) where.read = false;

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new NotFoundError('Notification not found');
  return notification;
}

export async function create(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
}) {
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw new NotFoundError('User not found');

  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      metadata: data.metadata as any,
    },
  });
}

export async function markRead(id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new NotFoundError('Notification not found');

  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { message: 'All notifications marked as read' };
}

export async function remove(id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new NotFoundError('Notification not found');

  await prisma.notification.delete({ where: { id } });
  return { message: 'Notification deleted successfully' };
}

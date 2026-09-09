import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export async function getAll(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip, take: limit,
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { users, total, page, limit };
}

export async function getById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}
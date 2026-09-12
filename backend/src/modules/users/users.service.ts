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

export async function update(id: string, data: Record<string, any>) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('User not found');
  
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.pin !== undefined) updateData.pin = data.pin;
  if (data.callsPatient !== undefined) updateData.callsPatient = data.callsPatient;
  if (data.canSeeTrends !== undefined) updateData.canSeeTrends = data.canSeeTrends;
  if (data.visibleMemoryIds !== undefined) updateData.visibleMemoryIds = data.visibleMemoryIds;
  if (data.portraitTone !== undefined) updateData.portraitTone = data.portraitTone;
  if (data.layer !== undefined) updateData.layer = data.layer;

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, phone: true, email: true, role: true, pin: true, layer: true, portraitTone: true, callsPatient: true, canSeeTrends: true, createdAt: true, updatedAt: true },
  });
}
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { Prisma } from '@prisma/client';

export async function getByPatient(patientId: string, status?: string) {
  const where: Prisma.MemoryWhereInput = { patientId };
  if (status) {
    where.status = status as any;
  }
  return prisma.memory.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getById(id: string) {
  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory) throw new NotFoundError('Memory not found');
  return memory;
}

export async function create(data: {
  patientId: string;
  personId?: string;
  title: string;
  description: string;
  photoUrl?: string;
  usableInActivities?: boolean;
}, userId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  return prisma.memory.create({
    data: {
      patientId: data.patientId,
      personId: data.personId || null,
      title: data.title,
      description: data.description,
      photoUrl: data.photoUrl || null,
      createdByUserId: userId,
      usableInActivities: data.usableInActivities ?? false,
    },
  });
}

export async function update(id: string, data: Prisma.MemoryUpdateInput) {
  const existing = await prisma.memory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Memory not found');
  return prisma.memory.update({ where: { id }, data });
}

export async function remove(id: string) {
  const existing = await prisma.memory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Memory not found');
  await prisma.memory.delete({ where: { id } });
  return { message: 'Memory deleted successfully' };
}

export async function approve(id: string) {
  const existing = await prisma.memory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Memory not found');
  return prisma.memory.update({ where: { id }, data: { status: 'APPROVED' } });
}

export async function decline(id: string) {
  const existing = await prisma.memory.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Memory not found');
  return prisma.memory.update({ where: { id }, data: { status: 'DECLINED' } });
}

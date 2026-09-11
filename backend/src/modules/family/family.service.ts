import { prisma } from '../../config/database';
import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors';
import { AccessLevel } from '@prisma/client';

export async function invite(data: {
  patientId: string; userId: string; relationship: string; accessLevel?: AccessLevel;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw new NotFoundError('User not found');

  const existing = await prisma.familyMember.findUnique({
    where: { patientId_userId: { patientId: data.patientId, userId: data.userId } },
  });
  if (existing) throw new ConflictError('Family member already linked');

  return prisma.familyMember.create({
    data: {
      patientId: data.patientId, userId: data.userId,
      relationship: data.relationship,
      accessLevel: data.accessLevel || 'VIEW_ONLY',
    },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      patient: { select: { id: true, name: true } },
    },
  });
}

export async function getByPatient(patientId: string) {
  return prisma.familyMember.findMany({
    where: { patientId },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
}

export async function remove(id: string) {
  const existing = await prisma.familyMember.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Family member link not found');
  await prisma.familyMember.delete({ where: { id } });
  return { message: 'Family member removed successfully' };
}

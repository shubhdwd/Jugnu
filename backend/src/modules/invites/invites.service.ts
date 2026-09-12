import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export async function getByPatient(patientId: string) {
  return prisma.invite.findMany({
    where: { patientId },
    orderBy: { sentAt: 'desc' },
  });
}

export async function create(data: {
  patientId: string;
  name: string;
  contact: string;
  layer: number;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  return prisma.invite.create({
    data: {
      patientId: data.patientId,
      name: data.name,
      contact: data.contact,
      layer: data.layer,
    },
  });
}

export async function updateStatus(id: string, status: string) {
  const existing = await prisma.invite.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Invite not found');
  return prisma.invite.update({
    where: { id },
    data: { status },
  });
}

export async function remove(id: string) {
  const existing = await prisma.invite.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Invite not found');
  await prisma.invite.delete({ where: { id } });
  return { message: 'Invite deleted successfully' };
}

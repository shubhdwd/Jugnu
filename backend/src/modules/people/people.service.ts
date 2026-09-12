import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export async function getByPatient(patientId: string) {
  return prisma.person.findMany({
    where: { patientId },
    include: { voiceNotes: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(data: {
  patientId: string;
  name: string;
  relationship: string;
  photoUrl?: string;
  portraitTone?: string;
  isPatient?: boolean;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  return prisma.person.create({
    data: {
      patientId: data.patientId,
      name: data.name,
      relationship: data.relationship,
      photoUrl: data.photoUrl,
      portraitTone: (data.portraitTone as any) || 'SAGE',
      isPatient: data.isPatient ?? false,
    },
    include: { voiceNotes: true },
  });
}

export async function update(id: string, data: Record<string, any>) {
  const existing = await prisma.person.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Person not found');

  return prisma.person.update({
    where: { id },
    data,
    include: { voiceNotes: true },
  });
}

export async function remove(id: string) {
  const existing = await prisma.person.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Person not found');
  await prisma.person.delete({ where: { id } });
  return { message: 'Person deleted successfully' };
}

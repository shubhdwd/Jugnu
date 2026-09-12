import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export async function getByPatient(patientId: string) {
  return prisma.moodEntry.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
  });
}

export async function getByPatientAndUser(patientId: string, userId: string) {
  return prisma.moodEntry.findMany({
    where: { patientId, userId },
    orderBy: { date: 'desc' },
  });
}

export async function create(data: {
  patientId: string;
  mood: string;
  note?: string;
  date?: string;
}, userId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  return prisma.moodEntry.create({
    data: {
      patientId: data.patientId,
      userId,
      mood: data.mood,
      note: data.note,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
}

export async function remove(id: string) {
  const existing = await prisma.moodEntry.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Mood entry not found');
  await prisma.moodEntry.delete({ where: { id } });
  return { message: 'Mood entry deleted successfully' };
}

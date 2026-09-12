import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export async function getByPerson(personId: string) {
  return prisma.voiceNote.findMany({
    where: { personId },
    orderBy: { recordedAt: 'desc' },
  });
}

export async function getByMemory(memoryId: string) {
  return prisma.voiceNote.findMany({
    where: { memoryId },
    orderBy: { recordedAt: 'desc' },
  });
}

export async function create(data: {
  personId?: string;
  memoryId?: string;
  audioUrl?: string;
  transcript?: string;
  seconds: number;
}, recordedBy: string) {
  return prisma.voiceNote.create({
    data: {
      personId: data.personId || undefined,
      memoryId: data.memoryId || undefined,
      audioUrl: data.audioUrl,
      transcript: data.transcript,
      seconds: data.seconds,
      recordedBy,
    },
  });
}

export async function update(id: string, data: Record<string, any>) {
  const existing = await prisma.voiceNote.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Voice note not found');
  return prisma.voiceNote.update({ where: { id }, data });
}

export async function remove(id: string) {
  const existing = await prisma.voiceNote.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Voice note not found');
  await prisma.voiceNote.delete({ where: { id } });
  return { message: 'Voice note deleted successfully' };
}

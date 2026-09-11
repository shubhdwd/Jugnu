import { prisma } from '../../config/database';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { PersonalizationLevel, Prisma } from '@prisma/client';

export async function getByPatient(patientId: string) {
  const p = await prisma.personalization.findUnique({ where: { patientId } });
  return p || null;
}

export async function createOrUpdate(patientId: string, data: {
  level?: PersonalizationLevel;
  photosMetadata?: Record<string, unknown>;
  voiceMetadata?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  return prisma.personalization.upsert({
    where: { patientId },
    update: data as Prisma.PersonalizationUpdateInput,
    create: { patient: { connect: { id: patientId } }, ...data } as Prisma.PersonalizationCreateInput,
  });
}

export async function getGameAssets(patientId: string, gameId?: string) {
  const where: Prisma.GameAssetWhereInput = { patientId };
  if (gameId) where.gameId = gameId;
  return prisma.gameAsset.findMany({
    where,
    include: { game: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGameAssetById(id: string) {
  const asset = await prisma.gameAsset.findUnique({
    where: { id },
    include: { game: { select: { id: true, name: true, slug: true } } },
  });
  if (!asset) throw new NotFoundError('Game asset not found');
  return asset;
}

export async function createGameAsset(data: {
  patientId: string;
  gameId: string;
  contentType: string;
  label: string;
  fileUrl?: string;
  transcript?: string;
  metadata?: Record<string, unknown>;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  const game = await prisma.game.findUnique({ where: { id: data.gameId } });
  if (!game) throw new NotFoundError('Game not found');

  const existing = await prisma.gameAsset.findUnique({
    where: { patientId_gameId_label: { patientId: data.patientId, gameId: data.gameId, label: data.label } },
  });
  if (existing) throw new ConflictError('Game asset with this label already exists for this patient and game');

  return prisma.gameAsset.create({
    data: {
      patientId: data.patientId,
      gameId: data.gameId,
      contentType: data.contentType,
      label: data.label,
      fileUrl: data.fileUrl,
      transcript: data.transcript,
      metadata: data.metadata as any,
    },
    include: { game: { select: { id: true, name: true, slug: true } } },
  });
}

export async function updateGameAsset(id: string, data: {
  contentType?: string;
  label?: string;
  fileUrl?: string;
  transcript?: string;
  metadata?: Record<string, unknown>;
}) {
  const existing = await prisma.gameAsset.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Game asset not found');

  return prisma.gameAsset.update({
    where: { id },
    data: data as Prisma.GameAssetUpdateInput,
    include: { game: { select: { id: true, name: true, slug: true } } },
  });
}

export async function deleteGameAsset(id: string) {
  const existing = await prisma.gameAsset.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Game asset not found');
  await prisma.gameAsset.delete({ where: { id } });
  return { message: 'Game asset deleted successfully' };
}

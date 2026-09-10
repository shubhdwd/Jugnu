import { prisma } from '../../config/database';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { ConsentType, Prisma } from '@prisma/client';

export async function getByPatient(patientId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  return prisma.consent.findMany({
    where: { patientId },
    orderBy: { timestamp: 'desc' },
  });
}

export async function getById(id: string) {
  const consent = await prisma.consent.findUnique({
    where: { id },
    include: { patient: true, granter: true },
  });
  if (!consent) throw new NotFoundError('Consent not found');
  return consent;
}

export async function upsert(data: {
  patientId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedBy: string;
  note?: string;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  const granter = await prisma.user.findUnique({ where: { id: data.grantedBy } });
  if (!granter) throw new NotFoundError('Granter user not found');

  const existing = await prisma.consent.findUnique({
    where: { patientId_consentType: { patientId: data.patientId, consentType: data.consentType } },
  });

  if (existing) {
    return prisma.consent.update({
      where: { id: existing.id },
      data: {
        granted: data.granted,
        grantedBy: data.grantedBy,
        note: data.note,
        timestamp: new Date(),
      },
    });
  }

  return prisma.consent.create({
    data: {
      patientId: data.patientId,
      consentType: data.consentType,
      granted: data.granted,
      grantedBy: data.grantedBy,
      note: data.note,
    },
  });
}

export async function update(
  id: string,
  data: { granted?: boolean; grantedBy?: string; note?: string },
) {
  const consent = await prisma.consent.findUnique({ where: { id } });
  if (!consent) throw new NotFoundError('Consent not found');

  return prisma.consent.update({
    where: { id },
    data: {
      ...(data.granted !== undefined && { granted: data.granted }),
      ...(data.grantedBy && { grantedBy: data.grantedBy }),
      ...(data.note !== undefined && { note: data.note }),
      ...(data.granted !== undefined && { timestamp: new Date() }),
    },
  });
}

export async function remove(id: string) {
  const consent = await prisma.consent.findUnique({ where: { id } });
  if (!consent) throw new NotFoundError('Consent not found');

  await prisma.consent.delete({ where: { id } });
  return { message: 'Consent deleted successfully' };
}

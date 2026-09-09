import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { Gender, Prisma } from '@prisma/client';

export async function create(data: {
  name: string;
  age: number;
  gender: Gender;
  language?: string;
  village?: string;
  location?: string;
  roomWard?: string;
  caregiverId: string;
  profilePhotoUrl?: string;
}) {
  const caregiver = await prisma.user.findUnique({ where: { id: data.caregiverId } });
  if (!caregiver) throw new NotFoundError('Caregiver not found');

  return prisma.patient.create({
    data: {
      name: data.name,
      age: data.age,
      gender: data.gender,
      language: data.language || 'assamese',
      village: data.village,
      location: data.location,
      roomWard: data.roomWard,
      caregiverId: data.caregiverId,
      profilePhotoUrl: data.profilePhotoUrl,
    },
    include: {
      caregiver: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
}

export async function getAll(userId: string, userRole: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const where: Prisma.PatientWhereInput = {};

  if (userRole === 'FAMILY_CAREGIVER') {
    where.caregiverId = userId;
  } else if (userRole === 'CONNECTED_FAMILY') {
    where.familyMembers = { some: { userId } };
  } else if (userRole === 'HEALTH_WORKER') {
    const hw = await prisma.healthWorker.findUnique({ where: { userId } });
    if (hw) {
      where.village = hw.area;
    }
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      include: {
        caregiver: { select: { id: true, name: true } },
        _count: { select: { sessions: true, alerts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patient.count({ where }),
  ]);

  return { patients, total, page, limit };
}

export async function getById(id: string, userId: string, userRole: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      caregiver: { select: { id: true, name: true, phone: true, email: true } },
      consents: true,
      _count: { select: { sessions: true, alerts: true, reminders: true } },
    },
  });

  if (!patient) throw new NotFoundError('Patient not found');

  if (userRole === 'FAMILY_CAREGIVER' && patient.caregiverId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  if (userRole === 'CONNECTED_FAMILY') {
    const link = await prisma.familyMember.findFirst({
      where: { patientId: id, userId },
    });
    if (!link) throw new ForbiddenError('Access denied');
  }

  return patient;
}

export async function update(
  id: string,
  data: Prisma.PatientUpdateInput,
  userId: string,
  userRole: string,
) {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Patient not found');

  if (userRole === 'FAMILY_CAREGIVER' && existing.caregiverId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return prisma.patient.update({
    where: { id },
    data,
    include: {
      caregiver: { select: { id: true, name: true } },
    },
  });
}

export async function remove(id: string, userId: string, userRole: string) {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Patient not found');

  if (userRole === 'FAMILY_CAREGIVER' && existing.caregiverId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  if (userRole !== 'ADMIN' && userRole !== 'FAMILY_CAREGIVER') {
    throw new ForbiddenError('Only admin or caregiver can delete');
  }

  await prisma.patient.delete({ where: { id } });
  return { message: 'Patient deleted successfully' };
}

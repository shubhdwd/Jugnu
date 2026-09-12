import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { ReminderType, ReminderRepeat, Prisma } from '@prisma/client';

export async function getByPatient(patientId: string, activeOnly = false) {
  const where: Prisma.ReminderWhereInput = { patientId };
  if (activeOnly) where.active = true;
  return prisma.reminder.findMany({ where, orderBy: { scheduledAt: 'asc' } });
}

export async function create(data: {
  patientId: string;
  type: ReminderType;
  title: string;
  message: string;
  scheduledAt: string;
  repeatRule?: ReminderRepeat;
  customRepeatRule?: string;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  const scheduledDate = new Date(data.scheduledAt);
  const timeStr = `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`;

  return prisma.reminder.create({
    data: {
      patientId: data.patientId,
      type: data.type,
      title: data.title,
      message: data.message,
      time: timeStr,
      scheduledAt: scheduledDate,
      repeatRule: data.repeatRule || 'NONE',
      customRepeatRule: data.customRepeatRule,
    },
  });
}

export async function update(id: string, data: Prisma.ReminderUpdateInput) {
  const existing = await prisma.reminder.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Reminder not found');
  return prisma.reminder.update({ where: { id }, data });
}

export async function remove(id: string) {
  const existing = await prisma.reminder.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Reminder not found');
  await prisma.reminder.delete({ where: { id } });
  return { message: 'Reminder deleted successfully' };
}

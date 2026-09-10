import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AlertType, AlertSeverity } from '@prisma/client';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type },
    });
    logger.info(`[Notification] Created for ${userId} | Type: ${type} | Title: ${title}`);
  } catch (err) {
    logger.error(`[Notification] Failed to create for ${userId}: ${err}`);
  }
}

export async function sendReminder(reminderId: string): Promise<void> {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: { patient: true },
  });

  if (!reminder) {
    logger.warn(`Reminder not found: ${reminderId}`);
    return;
  }

  if (!reminder.active) {
    logger.info(`Reminder ${reminderId} is inactive, skipping`);
    return;
  }

  logger.info(
    `[Reminder] Sending to patient ${reminder.patient.name} (${reminder.patientId}): ` +
    `${reminder.type} - ${reminder.title}: ${reminder.message}`,
  );
}

export async function checkCaregiverMoodAlerts(patientId: string): Promise<void> {
  const recentCheckins = await prisma.caregiverMoodCheckin.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  if (recentCheckins.length < 3) return;

  const allSad = recentCheckins.every((c) => c.mood === 'SAD');

  if (allSad) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        patientId,
        type: 'CAREGIVER_SUPPORT',
        status: 'ACTIVE',
      },
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          patientId,
          type: 'CAREGIVER_SUPPORT' as AlertType,
          severity: 'MEDIUM' as AlertSeverity,
          message: 'Caregiver has reported feeling sad in the last 3 check-ins. Consider reaching out for support.',
        },
      });
      logger.warn(`Caregiver support alert created for patient ${patientId}`);
    }
  }
}

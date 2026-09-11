import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { CompletionStatus, GameDifficulty, Prisma } from '@prisma/client';
import { analyzeSession, selectDifficulty } from '../../services/ai.service';
import { checkCaregiverMoodAlerts } from '../../services/notification.service';

export async function create(data: {
  patientId: string; gameId: string;
  offlineCreated?: boolean; offlineEventId?: string;
  metadata?: Record<string, unknown>;
}) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  const game = await prisma.game.findUnique({ where: { id: data.gameId } });
  if (!game) throw new NotFoundError('Game not found');

  if (data.offlineEventId) {
    const existing = await prisma.session.findUnique({ where: { offlineEventId: data.offlineEventId } });
    if (existing) return existing;
  }

  return prisma.session.create({
    data: {
      patientId: data.patientId, gameId: data.gameId,
      offlineCreated: data.offlineCreated || false,
      offlineEventId: data.offlineEventId,
      metadata: data.metadata as any,
    },
    include: { patient: { select: { id: true, name: true } }, game: { select: { id: true, name: true, type: true } } },
  });
}

export async function addAttempt(sessionId: string, data: {
  questionId: string; correct: boolean; responseTimeMs?: number;
  difficulty: GameDifficulty; score?: number; selectedAnswer?: string;
  offlineEventId?: string; metadata?: Record<string, unknown>;
}, userId: string, userRole: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundError('Session not found');

  if (data.offlineEventId) {
    const existing = await prisma.attempt.findUnique({ where: { offlineEventId: data.offlineEventId } });
    if (existing) return existing;
  }

  return prisma.attempt.create({
    data: {
      sessionId, questionId: data.questionId, correct: data.correct,
      responseTimeMs: data.responseTimeMs, difficulty: data.difficulty,
      score: data.score, selectedAnswer: data.selectedAnswer,
      offlineEventId: data.offlineEventId, metadata: data.metadata as any,
    },
  });
}

export async function endSession(sessionId: string, completionStatus: CompletionStatus, userId: string, userRole: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { attempts: { orderBy: { timestamp: 'asc' } } },
  });
  if (!session) throw new NotFoundError('Session not found');

  const lastAttempt = session.attempts[session.attempts.length - 1];
  if (lastAttempt && !lastAttempt.correct && completionStatus === 'COMPLETED') {
    completionStatus = 'PARTIAL';
  }

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { endedAt: new Date(), completionStatus },
    include: {
      patient: { select: { id: true, name: true } },
      game: { select: { id: true, name: true } },
      attempts: true,
    },
  });

  analyzeSession(sessionId).catch(err => {
    console.error('AI analysis failed for session:', sessionId, err);
  });

  return updated;
}

export async function getById(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      patient: { select: { id: true, name: true } },
      game: { select: { id: true, name: true, type: true } },
      attempts: { orderBy: { timestamp: 'asc' } },
    },
  });
  if (!session) throw new NotFoundError('Session not found');
  return session;
}

export async function getByPatient(patientId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const where = { patientId };

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where, skip, take: limit,
      include: { game: { select: { id: true, name: true, type: true } }, _count: { select: { attempts: true } } },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.session.count({ where }),
  ]);
  return { sessions, total, page, limit };
}

export async function getMoodCheckins(patientId: string) {
  return prisma.caregiverMoodCheckin.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function addMoodCheckin(patientId: string, mood: 'HAPPY' | 'NEUTRAL' | 'SAD', notes?: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Patient not found');

  const checkin = await prisma.caregiverMoodCheckin.create({
    data: { patientId, mood, notes },
  });

  checkCaregiverMoodAlerts(patientId).catch(err => {
    console.error('Mood alert check failed:', err);
  });

  return checkin;
}

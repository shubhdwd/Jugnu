import { prisma } from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { GameDifficulty } from '@prisma/client';

const DIFFICULTY_WEIGHTS: Record<GameDifficulty, number> = {
  [GameDifficulty.EASY]: 0.2,
  [GameDifficulty.MEDIUM]: 0.5,
  [GameDifficulty.HARD]: 0.8,
  [GameDifficulty.ADAPTIVE]: 0.5,
};

export function estimateAbility(
  attempts: Array<{ correct: boolean; responseTimeMs: number | null; difficulty: GameDifficulty }>,
): number {
  if (attempts.length === 0) return 0.5;

  let ability = 0.5;
  const decayFactor = 0.85;

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const difficultyWeight = DIFFICULTY_WEIGHTS[attempt.difficulty];
    const recencyWeight = Math.pow(decayFactor, attempts.length - 1 - i);

    const correctness = attempt.correct ? 1 : 0;
    const expectedScore = ability * difficultyWeight;
    const actualScore = correctness * difficultyWeight;
    const delta = (actualScore - expectedScore) * recencyWeight * 0.3;

    ability += delta;
  }

  return Math.max(0, Math.min(1, ability));
}

export function selectDifficulty(
  abilityEstimate: number,
  recentAttempts: Array<{ correct: boolean }>,
): GameDifficulty {
  const lastTwo = recentAttempts.slice(-2);
  const bothFailed = lastTwo.length === 2 && lastTwo.every((a) => !a.correct);

  if (bothFailed) {
    return GameDifficulty.EASY;
  }

  if (abilityEstimate > 0.8) return GameDifficulty.HARD;
  if (abilityEstimate > 0.5) return GameDifficulty.MEDIUM;
  if (abilityEstimate <= 0.3) return GameDifficulty.EASY;

  return GameDifficulty.ADAPTIVE;
}

export function detectTrend(
  insights: Array<{ abilityEstimate: number; createdAt: Date }>,
): 'IMPROVING' | 'STABLE' | 'DECLINING' | null {
  if (insights.length < 3) return null;

  const sorted = [...insights].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const n = sorted.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = sorted[i].abilityEstimate;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  if (slope > 0.05) return 'IMPROVING';
  if (slope < -0.05) return 'DECLINING';
  return 'STABLE';
}

export function checkSustainedDecline(
  insights: Array<{ abilityEstimate: number; cognitiveDomain: string }>,
): boolean {
  const byDomain = new Map<string, Array<{ abilityEstimate: number }>>();

  for (const insight of insights) {
    const existing = byDomain.get(insight.cognitiveDomain) || [];
    existing.push(insight);
    byDomain.set(insight.cognitiveDomain, existing);
  }

  for (const [, domainInsights] of byDomain) {
    const sorted = [...domainInsights];
    if (sorted.length < 3) continue;

    let consecutiveDeclines = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].abilityEstimate < sorted[i - 1].abilityEstimate) {
        consecutiveDeclines++;
      } else {
        consecutiveDeclines = 0;
      }
    }

    if (consecutiveDeclines >= 3) return true;
  }

  return false;
}

export async function selectNextActivity(
  patientId: string,
  gameId: string,
): Promise<{ gameId: string; difficulty: GameDifficulty } | null> {
  const recentSessions = await prisma.session.findMany({
    where: { patientId },
    include: { attempts: { orderBy: { timestamp: 'asc' } }, game: true },
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  if (recentSessions.length === 0) return null;

  const allAttempts = recentSessions.flatMap((s) =>
    s.attempts.map((a) => ({
      correct: a.correct,
      responseTimeMs: a.responseTimeMs,
      difficulty: a.difficulty,
    })),
  );

  const ability = estimateAbility(allAttempts);
  const recentAttempts = allAttempts.slice(-10).map((a) => ({ correct: a.correct }));
  const difficulty = selectDifficulty(ability, recentAttempts);

  const nextGame = await prisma.game.findFirst({
    where: { id: gameId, active: true },
  });

  if (!nextGame) return null;

  return { gameId: nextGame.id, difficulty };
}

export async function analyzeSession(sessionId: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { attempts: { orderBy: { timestamp: 'asc' } }, patient: true, game: true },
  });

  if (!session) {
    logger.error(`Session not found: ${sessionId}`);
    return;
  }

  const ability = estimateAbility(
    session.attempts.map((a) => ({
      correct: a.correct,
      responseTimeMs: a.responseTimeMs,
      difficulty: a.difficulty,
    })),
  );

  const recentInsights = await prisma.insight.findMany({
    where: {
      patientId: session.patientId,
      cognitiveDomain: session.game.type,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const allInsightData = [
    ...recentInsights.map((i) => ({ abilityEstimate: i.abilityEstimate, createdAt: i.createdAt })),
    { abilityEstimate: ability, createdAt: new Date() },
  ];

  const trend = detectTrend(allInsightData);

  const explanation = generateExplanation(session.game.type, ability, trend);

  await prisma.insight.create({
    data: {
      patientId: session.patientId,
      cognitiveDomain: session.game.type,
      abilityEstimate: ability,
      currentValue: ability,
      trend: trend as 'IMPROVING' | 'STABLE' | 'DECLINING' | null,
      explanation,
      modelVersion: 'v1.0',
    },
  });

  const domainInsights = await prisma.insight.findMany({
    where: { patientId: session.patientId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (checkSustainedDecline(domainInsights)) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        patientId: session.patientId,
        type: 'SUGGESTED_CLINICAL_REVIEW',
        status: 'ACTIVE',
      },
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          patientId: session.patientId,
          type: 'SUGGESTED_CLINICAL_REVIEW',
          severity: 'HIGH',
          message: `Sustained decline detected in cognitive performance across multiple sessions for ${session.patient.name}. Consider a clinical review.`,
        },
      });
      logger.warn(`Sustained decline alert created for patient ${session.patientId}`);
    }
  }
}

export function generateExplanation(
  cognitiveDomain: string,
  abilityEstimate: number,
  trend: string | null,
): string {
  const domainName = cognitiveDomain
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  let trendPhrase = '';
  if (trend === 'IMPROVING') {
    trendPhrase = 'has been improving over recent sessions';
  } else if (trend === 'DECLINING') {
    trendPhrase = 'has been declining over recent sessions';
  } else if (trend === 'STABLE') {
    trendPhrase = 'has remained relatively stable';
  } else {
    trendPhrase = 'is being monitored';
  }

  const abilityPercent = Math.round(abilityEstimate * 100);

  return `${domainName} ability ${trendPhrase}. Current estimated ability: ${abilityPercent}%.`;
}

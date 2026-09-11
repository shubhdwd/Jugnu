import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { GameType, GameCategory, PersonalizationLevel, Prisma } from '@prisma/client';
import { selectDifficultyRemote } from '../../services/ai.service';

export async function getAll(
  filters: {
    type?: GameType;
    category?: GameCategory;
    personalizationLevel?: PersonalizationLevel;
    language?: string;
    active?: boolean;
  },
  page = 1,
  limit = 20,
) {
  const skip = (page - 1) * limit;
  const where: Prisma.GameWhereInput = {};
  if (filters.type) where.type = filters.type;
  if (filters.category) where.category = filters.category;
  if (filters.personalizationLevel) where.personalizationLevel = filters.personalizationLevel;
  if (filters.language) where.language = filters.language;
  if (filters.active !== undefined) where.active = filters.active;

  const [games, total] = await Promise.all([
    prisma.game.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.game.count({ where }),
  ]);
  return { games, total, page, limit };
}

export async function getById(id: string) {
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) throw new NotFoundError('Game not found');
  return game;
}

export async function getBySlug(slug: string) {
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) throw new NotFoundError('Game not found');
  return game;
}

export async function getLocalizations(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new NotFoundError('Game not found');

  const localizations = await prisma.gameLocalization.findMany({
    where: { gameId, active: true },
    orderBy: { language: 'asc' },
  });

  return {
    gameId,
    slug: game.slug,
    languages: localizations.map(l => ({
      id: l.id,
      language: l.language,
      name: l.name,
      description: l.description,
      instructions: l.instructions,
      audioPackUrl: l.audioPackUrl,
    })),
  };
}

export async function getRecommended(patientId: string, userId: string, userRole: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { personalization: true },
  });
  if (!patient) throw new NotFoundError('Patient not found');

  const personalizationLevel = patient.personalization?.level || 'GENERIC';
  const language = patient.language || 'assamese';

  const where: Prisma.GameWhereInput = {
    language,
    active: true,
  };

  if (personalizationLevel === 'GENERIC') {
    where.personalizationLevel = 'GENERIC';
  }

  const recentSessions = await prisma.session.findMany({
    where: { patientId },
    include: { attempts: true, game: true },
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  const allAttempts = recentSessions.flatMap(s => s.attempts);
  const recentAttempts = allAttempts.slice(-20);
  const accuracy = recentAttempts.length > 0
    ? recentAttempts.filter(a => a.correct).length / recentAttempts.length
    : 0.5;

  const difficulty = await selectDifficultyRemote(accuracy, recentAttempts.map(a => ({ correct: a.correct })));

  const games = await prisma.game.findMany({ where, orderBy: { createdAt: 'desc' } });

  const recentGameIds = recentSessions.map(s => s.gameId);
  const freshGames = games.filter(g => !recentGameIds.includes(g.id));
  const pool = freshGames.length > 0 ? freshGames : games;

  const recommended = pool.slice(0, 3).map(game => ({
    ...game,
    suggestedDifficulty: difficulty,
  }));

  return {
    recommended,
    currentAccuracy: accuracy,
    suggestedDifficulty: difficulty,
    personalizationLevel,
  };
}

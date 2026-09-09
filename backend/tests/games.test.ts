import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const isCI = process.env.CI === 'true';

const describeDb = isCI ? describe : describe.skip;

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describeDb('Games Module Integration', () => {
  let testGameIds: string[];

  beforeAll(async () => {
    const games = await prisma.game.findMany({ orderBy: { slug: 'asc' } });
    testGameIds = games.map(g => g.id);
  });

  describe('Game Model', () => {
    it('should have all 6 games with correct slugs', async () => {
      const games = await prisma.game.findMany({ orderBy: { slug: 'asc' } });
      expect(games).toHaveLength(6);

      const slugs = games.map(g => g.slug).sort();
      expect(slugs).toEqual([
        'my-daily-routine',
        'object-match',
        'pattern-recall',
        'remember-when',
        'routine-sequencing',
        'whos-calling',
      ]);
    });

    it('should have correct personalization levels', async () => {
      const genericGames = await prisma.game.findMany({ where: { personalizationLevel: 'GENERIC' } });
      expect(genericGames).toHaveLength(3);

      const fullGames = await prisma.game.findMany({ where: { personalizationLevel: 'FULL' } });
      expect(fullGames).toHaveLength(3);
    });

    it('should have correct categories', async () => {
      const games = await prisma.game.findMany();
      const categories = games.map(g => g.category);

      expect(categories).toContain('OBJECT_RECOGNITION');
      expect(categories).toContain('SEQUENCING');
      expect(categories).toContain('PATTERN_RECALL');
      expect(categories).toContain('REMINISCENCE');
      expect(categories).toContain('PERSONALIZED_ROUTINE');
    });

    it('should have configuration metadata', async () => {
      const objectMatch = await prisma.game.findUnique({ where: { slug: 'object-match' } });
      expect(objectMatch).not.toBeNull();
      expect(objectMatch!.configuration).toBeDefined();
      const config = objectMatch!.configuration as any;
      expect(config.maxPairs).toBe(6);
      expect(config.objectSets).toBeDefined();
      expect(Array.isArray(config.objectSets)).toBe(true);
    });

    it('should have difficulty range and target success', async () => {
      const games = await prisma.game.findMany();
      for (const game of games) {
        expect(['EASY', 'MEDIUM', 'HARD']).toContain(game.difficultyMin);
        expect(['EASY', 'MEDIUM', 'HARD']).toContain(game.difficultyMax);
        expect(game.targetSuccessMin).toBeGreaterThanOrEqual(0.5);
        expect(game.targetSuccessMax).toBeLessThanOrEqual(1.0);
        expect(game.targetSuccessMin).toBeLessThan(game.targetSuccessMax);
      }
    });

    it('should have unique slugs', async () => {
      const games = await prisma.game.findMany();
      const slugs = games.map(g => g.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe('Game Filtering', () => {
    it('should filter games by personalization level', async () => {
      const genericGames = await prisma.game.findMany({
        where: { personalizationLevel: 'GENERIC', active: true },
      });
      expect(genericGames.length).toBeGreaterThanOrEqual(3);

      for (const game of genericGames) {
        expect(game.personalizationLevel).toBe('GENERIC');
      }
    });

    it('should filter games by category', async () => {
      const reminiscenceGames = await prisma.game.findMany({
        where: { category: 'REMINISCENCE', active: true },
      });
      expect(reminiscenceGames).toHaveLength(2);

      for (const game of reminiscenceGames) {
        expect(game.category).toBe('REMINISCENCE');
      }
    });

    it('should filter games by language', async () => {
      const assameseGames = await prisma.game.findMany({
        where: { language: 'assamese', active: true },
      });
      expect(assameseGames.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Game Recommendation by Personalization Level', () => {
    it('should return GENERIC games for Level 1 patient (assamese)', async () => {
      const patient = await prisma.patient.findFirst({
        where: { language: 'assamese', personalization: { level: 'GENERIC' } },
      });
      if (!patient) return;

      const games = await prisma.game.findMany({
        where: {
          language: patient.language,
          active: true,
          personalizationLevel: 'GENERIC',
        },
      });

      expect(games.length).toBeGreaterThanOrEqual(3);
      for (const game of games) {
        expect(game.personalizationLevel).toBe('GENERIC');
      }
    });

    it('should return all assamese games for Level 2 patient', async () => {
      const patient = await prisma.patient.findFirst({
        where: { personalization: { level: 'FULL' } },
      });
      if (!patient) return;

      const games = await prisma.game.findMany({
        where: {
          language: patient.language || 'assamese',
          active: true,
        },
      });

      expect(games.length).toBe(6);
    });

    it('should default to GENERIC when no personalization exists (assamese)', async () => {
      const patient = await prisma.patient.findFirst({
        where: { personalization: null, language: 'assamese' },
      });
      if (!patient) return;

      const games = await prisma.game.findMany({
        where: {
          language: patient.language,
          active: true,
          personalizationLevel: 'GENERIC',
        },
      });

      expect(games.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Game Lookup', () => {
    it('should find game by slug', async () => {
      const game = await prisma.game.findUnique({ where: { slug: 'object-match' } });
      expect(game).not.toBeNull();
      expect(game!.name).toBe('Object Match');
      expect(game!.type).toBe('OBJECT_MATCH');
    });

    it('should find game by ID', async () => {
      const game = await prisma.game.findUnique({ where: { id: testGameIds[0] } });
      expect(game).not.toBeNull();
    });

    it('should return null for non-existent slug', async () => {
      const game = await prisma.game.findUnique({ where: { slug: 'non-existent' } });
      expect(game).toBeNull();
    });
  });
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isCI = process.env.CI === 'true';
const describeDb = isCI ? describe : describe.skip;

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describeDb('Game Localizations Integration', () => {
  it('should have active localizations for every game', async () => {
    const games = await prisma.game.findMany();
    expect(games.length).toBeGreaterThan(0);

    for (const game of games) {
      const locs = await prisma.gameLocalization.count({ where: { gameId: game.id, active: true } });
      expect(locs).toBeGreaterThanOrEqual(2);
    }
  });

  it('should cover bengali and meitei per game', async () => {
    const games = await prisma.game.findMany({ include: { localizations: true } });
    for (const game of games) {
      const langs = game.localizations.map(l => l.language);
      expect(langs).toContain('bengali');
      expect(langs).toContain('meitei');
    }
  });

  it('should expose localized name, description and instructions', async () => {
    const locs = await prisma.gameLocalization.findMany();
    expect(locs.length).toBeGreaterThan(0);

    for (const l of locs) {
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.description.length).toBeGreaterThan(0);
      expect(l.instructions).toBeDefined();
      expect(l.audioPackUrl).toMatch(/^\/assets\/audio\/[a-z]+\/.+\.mp3$/);
    }
  });

  it('should enforce unique (gameId, language)', async () => {
    const first = await prisma.gameLocalization.findFirst();
    if (!first) return;

    await expect(
      prisma.gameLocalization.create({
        data: {
          gameId: first.gameId,
          language: first.language,
          name: 'dup',
          description: 'dup',
        },
      }),
    ).rejects.toThrow();
  });
});
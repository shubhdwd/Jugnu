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

describeDb('Sessions & Attempts Integration', () => {
  let testPatientId: string;
  let testGameId: string;

  beforeAll(async () => {
    const patient = await prisma.patient.findFirst();
    if (!patient) throw new Error('No test patients found. Run seed first.');
    testPatientId = patient.id;

    const game = await prisma.game.findFirst();
    if (!game) throw new Error('No games found. Run seed first.');
    testGameId = game.id;
  });

  describe('Session Model', () => {
    it('should have sessions in the database', async () => {
      const sessions = await prisma.session.findMany();
      expect(sessions.length).toBeGreaterThanOrEqual(10);
    });

    it('should create a session with correct fields', async () => {
      const session = await prisma.session.create({
        data: {
          patientId: testPatientId,
          gameId: testGameId,
          offlineCreated: false,
        },
      });

      expect(session).not.toBeNull();
      expect(session.patientId).toBe(testPatientId);
      expect(session.gameId).toBe(testGameId);
      expect(session.startedAt).toBeDefined();
      expect(session.offlineCreated).toBe(false);

      await prisma.session.delete({ where: { id: session.id } });
    });

    it('should create offline session with offlineEventId', async () => {
      const session = await prisma.session.create({
        data: {
          patientId: testPatientId,
          gameId: testGameId,
          offlineCreated: true,
          offlineEventId: 'test-offline-event-123',
        },
      });

      expect(session.offlineCreated).toBe(true);
      expect(session.offlineEventId).toBe('test-offline-event-123');

      await prisma.session.delete({ where: { id: session.id } });
    });

    it('should link session to patient and game', async () => {
      const session = await prisma.session.findFirst({
        include: { patient: true, game: true },
      });
      if (!session) return;

      expect(session.patient).toBeDefined();
      expect(session.patient.id).toBe(session.patientId);
      expect(session.game).toBeDefined();
      expect(session.game.id).toBe(session.gameId);
    });

    it('should track session completion status', async () => {
      const sessions = await prisma.session.findMany({
        where: { completionStatus: 'COMPLETED' },
      });
      expect(sessions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Attempt Model', () => {
    it('should have attempts in the database', async () => {
      const attempts = await prisma.attempt.findMany();
      expect(attempts.length).toBeGreaterThanOrEqual(50);
    });

    it('should create attempt with all fields', async () => {
      const session = await prisma.session.findFirst();
      if (!session) return;

      const attempt = await prisma.attempt.create({
        data: {
          sessionId: session.id,
          questionId: 'test-question-1',
          correct: true,
          responseTimeMs: 2500,
          difficulty: 'MEDIUM',
          score: 0.85,
          selectedAnswer: 'correct_option',
          metadata: { questionIndex: 0 },
        },
      });

      expect(attempt).not.toBeNull();
      expect(attempt.correct).toBe(true);
      expect(attempt.responseTimeMs).toBe(2500);
      expect(attempt.difficulty).toBe('MEDIUM');
      expect(attempt.score).toBe(0.85);
      expect(attempt.selectedAnswer).toBe('correct_option');

      await prisma.attempt.delete({ where: { id: attempt.id } });
    });

    it('should store response time accurately', async () => {
      const attempts = await prisma.attempt.findMany({
        where: { responseTimeMs: { not: null } },
      });
      expect(attempts.length).toBeGreaterThanOrEqual(1);

      for (const attempt of attempts) {
        expect(attempt.responseTimeMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should store accuracy correctly', async () => {
      const correctAttempts = await prisma.attempt.findMany({ where: { correct: true } });
      const incorrectAttempts = await prisma.attempt.findMany({ where: { correct: false } });

      expect(correctAttempts.length).toBeGreaterThanOrEqual(1);
      expect(incorrectAttempts.length).toBeGreaterThanOrEqual(1);
    });

    it('should store selectedAnswer', async () => {
      const attempts = await prisma.attempt.findMany({
        where: { selectedAnswer: { not: null } },
      });
      expect(attempts.length).toBeGreaterThanOrEqual(1);
    });

    it('should track difficulty per attempt', async () => {
      const easyAttempts = await prisma.attempt.findMany({ where: { difficulty: 'EASY' } });
      const mediumAttempts = await prisma.attempt.findMany({ where: { difficulty: 'MEDIUM' } });
      const hardAttempts = await prisma.attempt.findMany({ where: { difficulty: 'HARD' } });

      expect(easyAttempts.length + mediumAttempts.length + hardAttempts.length)
        .toBe(await prisma.attempt.count());
    });

    it('should link attempts to sessions', async () => {
      const attempts = await prisma.attempt.findMany({
        include: { session: true },
      });

      for (const attempt of attempts) {
        expect(attempt.session).toBeDefined();
        expect(attempt.session.id).toBe(attempt.sessionId);
      }
    });

    it('should compute accuracy from attempts', async () => {
      const session = await prisma.session.findFirst({
        include: { attempts: true },
      });
      if (!session || session.attempts.length === 0) return;

      const correctCount = session.attempts.filter(a => a.correct).length;
      const accuracy = correctCount / session.attempts.length;

      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('Offline Sync Support', () => {
    it('should handle offline event IDs', async () => {
      const session = await prisma.session.create({
        data: {
          patientId: testPatientId,
          gameId: testGameId,
          offlineCreated: true,
          offlineEventId: `test-${Date.now()}`,
        },
      });

      expect(session.offlineEventId).not.toBeNull();

      await prisma.session.delete({ where: { id: session.id } });
    });

    it('should prevent duplicate offline event IDs', async () => {
      const eventId = `duplicate-test-${Date.now()}`;

      await prisma.session.create({
        data: {
          patientId: testPatientId,
          gameId: testGameId,
          offlineCreated: true,
          offlineEventId: eventId,
        },
      });

      await expect(
        prisma.session.create({
          data: {
            patientId: testPatientId,
            gameId: testGameId,
            offlineCreated: true,
            offlineEventId: eventId,
          },
        }),
      ).rejects.toThrow();

      await prisma.session.deleteMany({ where: { offlineEventId: eventId } });
    });
  });
});

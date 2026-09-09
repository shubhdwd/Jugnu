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

describeDb('Personalization Module Integration', () => {
  let testPatientId: string;
  let testGameId: string;

  beforeAll(async () => {
    const patient = await prisma.patient.findFirst();
    if (!patient) throw new Error('No test patients found. Run seed first.');
    testPatientId = patient.id;

    const game = await prisma.game.findFirst({ where: { personalizationLevel: 'FULL' } });
    if (!game) throw new Error('No personalized games found. Run seed first.');
    testGameId = game.id;
  });

  describe('Personalization Model', () => {
    it('should have personalization for patients', async () => {
      const personalizations = await prisma.personalization.findMany();
      expect(personalizations.length).toBeGreaterThanOrEqual(3);
    });

    it('should have correct personalization levels', async () => {
      const levels = await prisma.personalization.findMany({ select: { level: true } });
      const uniqueLevels = [...new Set(levels.map(p => p.level))];
      expect(uniqueLevels).toContain('GENERIC');
      expect(uniqueLevels).toContain('FULL');
    });

    it('should get personalization by patient ID', async () => {
      const personalization = await prisma.personalization.findUnique({
        where: { patientId: testPatientId },
      });
      expect(personalization).not.toBeNull();
      expect(['GENERIC', 'FULL']).toContain(personalization!.level);
    });

    it('should upsert personalization', async () => {
      const patient = await prisma.patient.findFirst({
        where: { personalization: { level: 'GENERIC' } },
      });
      if (!patient) return;

      const updated = await prisma.personalization.upsert({
        where: { patientId: patient.id },
        update: { level: 'FULL' },
        create: { patientId: patient.id, level: 'FULL' },
      });

      expect(updated.level).toBe('FULL');
    });
  });

  describe('GameAsset Model', () => {
    it('should have game assets for personalized games', async () => {
      const assets = await prisma.gameAsset.findMany();
      expect(assets.length).toBeGreaterThanOrEqual(10);
    });

    it('should have voice assets', async () => {
      const voiceAssets = await prisma.gameAsset.findMany({
        where: { contentType: 'voice' },
      });
      expect(voiceAssets.length).toBeGreaterThanOrEqual(5);
    });

    it('should have photo assets', async () => {
      const photoAssets = await prisma.gameAsset.findMany({
        where: { contentType: 'photo' },
      });
      expect(photoAssets.length).toBeGreaterThanOrEqual(3);
    });

    it('should have routine step assets', async () => {
      const routineAssets = await prisma.gameAsset.findMany({
        where: { contentType: 'routine_step' },
      });
      expect(routineAssets.length).toBeGreaterThanOrEqual(3);
    });

    it('should create a new game asset', async () => {
      const asset = await prisma.gameAsset.create({
        data: {
          patientId: testPatientId,
          gameId: testGameId,
          contentType: 'voice',
          label: 'test_voice_asset',
          fileUrl: '/assets/voice/test.mp3',
          transcript: 'Test transcript',
          metadata: { test: true },
        },
      });

      expect(asset).not.toBeNull();
      expect(asset.contentType).toBe('voice');
      expect(asset.label).toBe('test_voice_asset');

      await prisma.gameAsset.delete({ where: { id: asset.id } });
    });

    it('should enforce unique constraint on patientId + gameId + label', async () => {
      const asset1 = await prisma.gameAsset.create({
        data: {
          patientId: testPatientId,
          gameId: testGameId,
          contentType: 'voice',
          label: 'unique_test_label',
          fileUrl: '/assets/voice/test1.mp3',
        },
      });

      await expect(
        prisma.gameAsset.create({
          data: {
            patientId: testPatientId,
            gameId: testGameId,
            contentType: 'photo',
            label: 'unique_test_label',
            fileUrl: '/assets/photos/test1.jpg',
          },
        }),
      ).rejects.toThrow();

      await prisma.gameAsset.delete({ where: { id: asset1.id } });
    });

    it('should get assets by patient and game', async () => {
      const assets = await prisma.gameAsset.findMany({
        where: { patientId: testPatientId, gameId: testGameId },
      });
      expect(assets.length).toBeGreaterThanOrEqual(1);
    });

    it('should get all assets for a patient', async () => {
      const assets = await prisma.gameAsset.findMany({
        where: { patientId: testPatientId },
      });
      expect(assets.length).toBeGreaterThanOrEqual(1);
    });

    it('should update a game asset', async () => {
      const asset = await prisma.gameAsset.findFirst({
        where: { patientId: testPatientId },
      });
      if (!asset) return;

      const updated = await prisma.gameAsset.update({
        where: { id: asset.id },
        data: { transcript: 'Updated transcript' },
      });

      expect(updated.transcript).toBe('Updated transcript');
    });

    it('should delete a game asset', async () => {
      const asset = await prisma.gameAsset.create({
        data: {
          patientId: testPatientId,
          gameId: testGameId,
          contentType: 'text',
          label: 'delete_test',
          transcript: 'To be deleted',
        },
      });

      await prisma.gameAsset.delete({ where: { id: asset.id } });

      const found = await prisma.gameAsset.findUnique({ where: { id: asset.id } });
      expect(found).toBeNull();
    });

    it('should link assets to games correctly', async () => {
      const assets = await prisma.gameAsset.findMany({
        where: { patientId: testPatientId },
        include: { game: true },
      });

      for (const asset of assets) {
        expect(asset.game).toBeDefined();
        expect(asset.game.id).toBe(asset.gameId);
      }
    });
  });

  describe('Personalization Level + GameAsset Relationship', () => {
    it('should support Level 1 (GENERIC) without personalized assets', async () => {
      const patient = await prisma.patient.findFirst({
        where: { personalization: { level: 'GENERIC' } },
      });
      if (!patient) return;

      const assets = await prisma.gameAsset.findMany({
        where: { patientId: patient.id },
      });

      const voiceAssets = assets.filter(a => a.contentType === 'voice');
      const photoAssets = assets.filter(a => a.contentType === 'photo');

      expect(voiceAssets.length).toBe(0);
      expect(photoAssets.length).toBe(0);
    });

    it('should support Level 2 (FULL) with both voice and photos', async () => {
      const patient = await prisma.patient.findFirst({
        where: { personalization: { level: 'FULL' } },
      });
      if (!patient) return;

      const assets = await prisma.gameAsset.findMany({
        where: { patientId: patient.id },
      });

      const voiceAssets = assets.filter(a => a.contentType === 'voice');
      const photoAssets = assets.filter(a => a.contentType === 'photo');

      expect(voiceAssets.length).toBeGreaterThanOrEqual(1);
      expect(photoAssets.length).toBeGreaterThanOrEqual(1);
    });
  });
});

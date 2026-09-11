import { Router } from 'express';
import { z } from 'zod';
import * as controller from './personalization.controller';
import auth from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const upsertPersonalizationSchema = z.object({
  body: z.object({
    level: z.enum(['GENERIC', 'FULL']).optional(),
    photosMetadata: z.record(z.unknown()).optional(),
    voiceMetadata: z.record(z.unknown()).optional(),
    preferences: z.record(z.unknown()).optional(),
  }),
});

const createGameAssetSchema = z.object({
  body: z.object({
    gameId: z.string().uuid(),
    contentType: z.enum(['voice', 'photo', 'text', 'routine_step']),
    label: z.string().min(1).max(200),
    fileUrl: z.string().url().optional(),
    transcript: z.string().max(2000).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const updateGameAssetSchema = z.object({
  body: z.object({
    contentType: z.enum(['voice', 'photo', 'text', 'routine_step']).optional(),
    label: z.string().min(1).max(200).optional(),
    fileUrl: z.string().url().optional(),
    transcript: z.string().max(2000).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

router.use(auth);

router.get('/:patientId/personalization', controller.getByPatient);

router.post(
  '/:patientId/personalization',
  validate(upsertPersonalizationSchema),
  controller.upsert,
);

router.patch(
  '/:patientId/personalization',
  validate(upsertPersonalizationSchema),
  controller.upsert,
);

router.get('/:patientId/assets', controller.getGameAssets);

router.get('/:patientId/assets/:assetId', controller.getGameAssetById);

router.post(
  '/:patientId/assets',
  validate(createGameAssetSchema),
  controller.createGameAsset,
);

router.patch(
  '/:patientId/assets/:assetId',
  validate(updateGameAssetSchema),
  controller.updateGameAsset,
);

router.delete('/:patientId/assets/:assetId', controller.deleteGameAsset);

export default router;

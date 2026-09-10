import { Router } from 'express';
import { z } from 'zod';
import * as controller from './consents.controller';
import auth from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const consentTypes = ['DATA_COLLECTION', 'GAME_PLAY', 'PHOTO_USAGE', 'VOICE_RECORDING', 'FAMILY_SHARING', 'HEALTH_WORKER_ACCESS'] as const;

const createConsentSchema = z.object({
  body: z.object({
    consentType: z.enum(consentTypes),
    granted: z.boolean(),
    note: z.string().max(500).optional(),
  }),
});

const updateConsentSchema = z.object({
  body: z.object({
    granted: z.boolean().optional(),
    note: z.string().max(500).optional(),
  }),
});

const consentRouter = Router();
consentRouter.use(auth);

consentRouter.get('/:patientId/consents', controller.getByPatient);

consentRouter.post(
  '/:patientId/consents',
  validate(createConsentSchema),
  controller.upsert,
);

export { consentRouter };

const consentDetailRouter = Router();
consentDetailRouter.use(auth);

consentDetailRouter.get('/:id', controller.getById);

consentDetailRouter.patch(
  '/:id',
  validate(updateConsentSchema),
  controller.update,
);

consentDetailRouter.delete('/:id', controller.remove);

export default consentDetailRouter;

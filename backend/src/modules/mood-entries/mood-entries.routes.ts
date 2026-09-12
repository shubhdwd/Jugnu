import { Router } from 'express';
import { z } from 'zod';
import * as controller from './mood-entries.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createMoodEntrySchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    mood: z.enum(['good', 'ok', 'low']),
    note: z.string().max(500).optional(),
    date: z.string().optional(),
  }),
});

router.use(auth);

router.get('/:patientId', controller.getByPatient);
router.get('/:patientId/user/:userId', controller.getByPatientAndUser);
router.post('/', validate(createMoodEntrySchema), authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.create);
router.delete('/:id', authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.remove);

export default router;

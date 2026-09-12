import { Router } from 'express';
import { z } from 'zod';
import * as controller from './people.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createPersonSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    name: z.string().min(1).max(100),
    relationship: z.string().min(1).max(100),
    photoUrl: z.string().url().optional(),
    portraitTone: z.enum(['AMBER', 'SAGE', 'LILAC', 'CLAY', 'DUSK']).optional(),
    isPatient: z.boolean().optional(),
  }),
});

const updatePersonSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    relationship: z.string().min(1).max(100).optional(),
    photoUrl: z.string().url().nullable().optional(),
    portraitTone: z.enum(['AMBER', 'SAGE', 'LILAC', 'CLAY', 'DUSK']).optional(),
    isPatient: z.boolean().optional(),
  }),
});

router.use(auth);

router.get('/:patientId', controller.getByPatient);
router.post('/', validate(createPersonSchema), authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.create);
router.patch('/:id', validate(updatePersonSchema), authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.update);
router.delete('/:id', authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.remove);

export default router;

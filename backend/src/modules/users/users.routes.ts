import { Router } from 'express';
import { z } from 'zod';
import * as controller from './users.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    pin: z.string().min(4).max(10).optional(),
    callsPatient: z.string().max(100).optional(),
    canSeeTrends: z.boolean().optional(),
    visibleMemoryIds: z.array(z.string()).optional(),
    portraitTone: z.enum(['AMBER', 'SAGE', 'LILAC', 'CLAY', 'DUSK']).optional(),
    layer: z.number().int().min(0).max(3).optional(),
  }),
});

router.use(auth);
router.get('/', authorize('ADMIN'), controller.getAll);
router.get('/:id', controller.getById);
router.patch('/:id', authorize('FAMILY_CAREGIVER', 'ADMIN'), validate(updateUserSchema), controller.update);
export default router;
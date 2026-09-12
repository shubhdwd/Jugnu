import { Router } from 'express';
import * as controller from './family.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

const inviteSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    userId: z.string().uuid(),
    relationship: z.string().min(1).max(100),
    accessLevel: z.enum(['PRIMARY', 'VIEW_ONLY']).optional(),
  }),
});

router.post('/', auth, authorize('FAMILY_CAREGIVER', 'ADMIN'), validate(inviteSchema), controller.invite);
router.get('/members/:patientId', auth, controller.getByPatient);
router.delete('/member/:id', auth, authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.remove);

export default router;

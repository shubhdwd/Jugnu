import { Router } from 'express';
import { z } from 'zod';
import * as controller from './invites.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createInviteSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    name: z.string().min(1).max(100),
    contact: z.string().min(1).max(200),
    layer: z.number().int().min(2).max(3),
  }),
});

router.use(auth);

router.get('/:patientId', controller.getByPatient);
router.post('/', validate(createInviteSchema), authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.create);
const updateInviteStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'accepted', 'declined', 'revoked']),
  }),
});

router.patch('/:id', authorize('FAMILY_CAREGIVER', 'ADMIN'), validate(updateInviteStatusSchema), controller.updateStatus);
router.delete('/:id', authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.remove);

export default router;

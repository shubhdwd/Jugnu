import { Router } from 'express';
import { z } from 'zod';
import * as controller from './alerts.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const updateAlertSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']),
  }),
});

router.use(auth);

router.get('/:patientId/alerts', controller.getByPatient);

export default router;

export const adminAlertRouter = Router();
adminAlertRouter.use(auth);

adminAlertRouter.patch(
  '/:id',
  validate(updateAlertSchema),
  controller.update,
);

adminAlertRouter.get(
  '/',
  authorize('ADMIN', 'HEALTH_WORKER'),
  controller.getAll,
);

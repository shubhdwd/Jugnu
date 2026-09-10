import { Router } from 'express';
import { z } from 'zod';
import * as controller from './notifications.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    type: z.string().min(1).max(50),
    metadata: z.record(z.unknown()).optional(),
  }),
});

router.use(auth);

router.get('/', controller.getByUser);

router.get('/:id', controller.getById);

router.post(
  '/',
  authorize('ADMIN', 'FAMILY_CAREGIVER'),
  validate(createNotificationSchema),
  controller.create,
);

router.patch('/:id', controller.markRead);

router.patch('/read-all/mark', controller.markAllRead);

router.delete('/:id', controller.remove);

export default router;

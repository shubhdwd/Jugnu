import { Router } from 'express';
import { z } from 'zod';
import * as controller from './reminders.controller';
import auth from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createReminderSchema = z.object({
  body: z.object({
    type: z.enum(['MEDICATION', 'HYDRATION', 'ACTIVITY', 'APPOINTMENT']),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(500),
    scheduledAt: z.string().datetime(),
    repeatRule: z.enum(['NONE', 'DAILY', 'WEEKLY', 'CUSTOM']).optional(),
    customRepeatRule: z.string().max(200).optional(),
  }),
});

const updateReminderSchema = z.object({
  body: z.object({
    type: z.enum(['MEDICATION', 'HYDRATION', 'ACTIVITY', 'APPOINTMENT']).optional(),
    title: z.string().min(1).max(200).optional(),
    message: z.string().min(1).max(500).optional(),
    scheduledAt: z.string().datetime().optional(),
    repeatRule: z.enum(['NONE', 'DAILY', 'WEEKLY', 'CUSTOM']).optional(),
    customRepeatRule: z.string().max(200).optional(),
    active: z.boolean().optional(),
  }),
});

router.use(auth);

router.get('/:patientId/reminders', controller.getByPatient);

router.post(
  '/:patientId/reminders',
  validate(createReminderSchema),
  controller.create,
);

export const reminderRouter = router;

const reminderDetailRouter = Router();
reminderDetailRouter.use(auth);

reminderDetailRouter.patch(
  '/:id',
  validate(updateReminderSchema),
  controller.update,
);

reminderDetailRouter.delete('/:id', controller.remove);

export default reminderDetailRouter;

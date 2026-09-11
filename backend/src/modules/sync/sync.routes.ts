import { Router } from 'express';
import * as controller from './sync.controller';
import auth from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
router.use(auth);

const syncEventSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1),
    events: z.array(z.object({
      eventId: z.string().min(1),
      type: z.enum(['GAME_ATTEMPT', 'SESSION_START', 'SESSION_END', 'MOOD_CHECKIN', 'REMINDER_DISMISSED', 'PERSONALIZATION_UPDATE']),
      timestamp: z.string().min(1),
      payload: z.record(z.unknown()),
    })).min(1).max(100),
  }),
});

router.post('/', validate(syncEventSchema), controller.syncEvents);
router.get('/status/:deviceId', controller.syncStatus);
router.post('/retry/:deviceId', controller.retrySync);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import * as controller from './voice-notes.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createVoiceNoteSchema = z.object({
  body: z.object({
    personId: z.string().uuid().optional(),
    memoryId: z.string().uuid().optional(),
    audioUrl: z.string().url().optional(),
    transcript: z.string().optional(),
    seconds: z.number().min(1),
  }),
});

const updateVoiceNoteSchema = z.object({
  body: z.object({
    audioUrl: z.string().url().nullable().optional(),
    transcript: z.string().nullable().optional(),
    seconds: z.number().min(1).optional(),
  }),
});

router.use(auth);

router.get('/person/:personId', controller.getByPerson);
router.get('/memory/:memoryId', controller.getByMemory);
router.post('/', validate(createVoiceNoteSchema), authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.create);
router.patch('/:id', validate(updateVoiceNoteSchema), authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.update);
router.delete('/:id', authorize('FAMILY_CAREGIVER', 'ADMIN'), controller.remove);

export default router;

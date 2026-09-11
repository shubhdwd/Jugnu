import { Router } from 'express';
import { z } from 'zod';
import * as controller from './sessions.controller';
import auth from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createSessionSchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    gameId: z.string().uuid(),
    offlineCreated: z.boolean().optional(),
    offlineEventId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const addAttemptSchema = z.object({
  body: z.object({
    questionId: z.string().min(1),
    correct: z.boolean(),
    responseTimeMs: z.number().int().min(0).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    score: z.number().min(0).optional(),
    selectedAnswer: z.string().max(500).optional(),
    offlineEventId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const endSessionSchema = z.object({
  body: z.object({
    completionStatus: z.enum(['COMPLETED', 'PARTIAL', 'ABANDONED', 'TIMEOUT']),
  }),
});

const addMoodCheckinSchema = z.object({
  body: z.object({
    mood: z.enum(['HAPPY', 'NEUTRAL', 'SAD']),
    notes: z.string().max(500).optional(),
  }),
});

router.use(auth);

router.post('/', validate(createSessionSchema), controller.create);

router.post('/:id/attempts', validate(addAttemptSchema), controller.addAttempt);

router.post('/:id/end', validate(endSessionSchema), controller.endSession);

router.get('/:id', controller.getById);

router.get('/patients/:patientId/sessions', controller.getByPatient);

router.post('/patients/:patientId/mood', validate(addMoodCheckinSchema), controller.addMoodCheckin);

export default router;

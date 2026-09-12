import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';
import authMiddleware from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import {
  getByPatient,
  getById,
  create,
  update,
  remove,
  approve,
  decline,
} from './memories.controller';

const router = Router();

const createMemorySchema = z.object({
  body: z.object({
    patientId: z.string().uuid(),
    personId: z.string().uuid().optional(),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(1000),
    photoUrl: z.string().url().optional(),
    voiceNote: z.object({
      audioUrl: z.string().url().optional(),
      transcript: z.string().optional(),
      seconds: z.number().min(1),
    }).optional(),
    usableInActivities: z.boolean().optional(),
  }),
});

const updateMemorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(1000).optional(),
    photoUrl: z.string().url().nullable().optional(),
    personId: z.string().uuid().nullable().optional(),
    usableInActivities: z.boolean().optional(),
  }),
});

router.get('/:patientId', authMiddleware, getByPatient);
router.get('/detail/:id', authMiddleware, getById);
router.post('/', authMiddleware, authorize('FAMILY_CAREGIVER', 'ADMIN'), validate(createMemorySchema), create);
router.patch('/:id', authMiddleware, authorize('FAMILY_CAREGIVER', 'ADMIN'), validate(updateMemorySchema), update);
router.delete('/:id', authMiddleware, authorize('FAMILY_CAREGIVER', 'ADMIN'), remove);
router.post('/:id/approve', authMiddleware, authorize('FAMILY_CAREGIVER', 'ADMIN'), approve);
router.post('/:id/decline', authMiddleware, authorize('FAMILY_CAREGIVER', 'ADMIN'), decline);

export { router as memoriesRouter };

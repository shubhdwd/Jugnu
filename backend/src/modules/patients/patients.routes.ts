import { Router } from 'express';
import { z } from 'zod';
import * as controller from './patients.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const createPatientSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    age: z.number().int().min(0).max(150),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    language: z.string().max(50).optional(),
    village: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    roomWard: z.string().max(100).optional(),
    profilePhotoUrl: z.string().url().optional(),
  }),
});

const updatePatientSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    age: z.number().int().min(0).max(150).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    language: z.string().max(50).optional(),
    village: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    roomWard: z.string().max(100).optional(),
    profilePhotoUrl: z.string().url().optional(),
  }),
});

router.use(auth);

router.post(
  '/',
  authorize('FAMILY_CAREGIVER', 'ADMIN'),
  validate(createPatientSchema),
  controller.create,
);

router.get('/', controller.getAll);

router.get('/:id', controller.getById);

router.patch(
  '/:id',
  authorize('FAMILY_CAREGIVER', 'ADMIN'),
  validate(updatePatientSchema),
  controller.update,
);

router.delete(
  '/:id',
  authorize('FAMILY_CAREGIVER', 'ADMIN'),
  controller.remove,
);

export default router;

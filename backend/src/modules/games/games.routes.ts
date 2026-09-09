import { Router } from 'express';
import * as controller from './games.controller';
import auth from '../../middleware/auth.middleware';

const router = Router();

router.use(auth);

router.get('/', controller.getAll);

router.get('/recommended/:patientId', controller.getRecommended);

router.get('/slug/:slug', controller.getBySlug);

router.get('/:id', controller.getById);

export default router;

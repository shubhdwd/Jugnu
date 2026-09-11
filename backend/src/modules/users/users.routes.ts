import { Router } from 'express';
import * as controller from './users.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();
router.use(auth);
router.get('/', authorize('ADMIN'), controller.getAll);
router.get('/:id', controller.getById);
export default router;
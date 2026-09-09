import { Router } from 'express';
import * as controller from './health-workers.controller';
import auth from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.use(auth, authorize('HEALTH_WORKER'));

router.get('/me', controller.getMyProfile);
router.get('/patients', controller.getPatients);
router.get('/priority-list', controller.getPriorityList);
router.get('/visit-plan', controller.getVisitPlan);

export default router;

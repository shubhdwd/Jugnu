import { Router } from 'express';
import * as controller from './insights.controller';
import auth from '../../middleware/auth.middleware';

const router = Router();

router.use(auth);

router.get('/:patientId/insights', controller.getByPatient);
router.get('/:patientId/trends', controller.getTrends);
router.get('/:patientId/ability', controller.getAbility);

export default router;

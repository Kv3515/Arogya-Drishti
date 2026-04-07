import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createVitalsSchema } from '../validators';
import { listVitals, createVitals } from '../controllers/vitals.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:serviceNumber/vitals', authorize('vitals_log', 'read'), listVitals);
router.post('/:serviceNumber/vitals', authorize('vitals_log', 'create'), validate(createVitalsSchema), createVitals);

export default router;

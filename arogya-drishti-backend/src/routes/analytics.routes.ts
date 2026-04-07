import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import {
  fitnessSummary,
  diseaseTrends,
  injuryRates,
  deploymentReadiness,
  unitActivityStream,
} from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/unit/:unitId/fitness-summary', authorize('analytics', 'read'), fitnessSummary);
router.get('/unit/:unitId/disease-trends', authorize('analytics', 'read'), diseaseTrends);
router.get('/unit/:unitId/injury-rates', authorize('analytics', 'read'), injuryRates);
router.get('/unit/:unitId/deployment-readiness', authorize('analytics', 'read'), deploymentReadiness);
router.get('/unit/:unitId/activity-stream', authorize('analytics', 'read'), unitActivityStream);

export default router;

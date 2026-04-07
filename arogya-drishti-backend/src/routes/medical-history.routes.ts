import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createMedicalHistorySchema, updateMedicalHistorySchema } from '../validators';
import {
  listMedicalHistory,
  createMedicalHistory,
  updateMedicalHistory,
} from '../controllers/medical-history.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:serviceNumber/medical-history', authorize('medical_history', 'read'), listMedicalHistory);
router.post('/:serviceNumber/medical-history', authorize('medical_history', 'create'), validate(createMedicalHistorySchema), createMedicalHistory);
router.put('/:serviceNumber/medical-history/:id', authorize('medical_history', 'update'), validate(updateMedicalHistorySchema), updateMedicalHistory);

export default router;

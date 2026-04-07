import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createPrescriptionSchema } from '../validators';
import {
  listPrescriptions,
  createPrescription,
  deactivatePrescription,
} from '../controllers/prescriptions.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:serviceNumber/prescriptions', authorize('prescriptions', 'read'), listPrescriptions);
router.post('/:serviceNumber/medical-history/:historyId/prescriptions', authorize('prescriptions', 'create'), validate(createPrescriptionSchema), createPrescription);
router.put('/prescriptions/:id/deactivate', authorize('prescriptions', 'update'), deactivatePrescription);

export default router;

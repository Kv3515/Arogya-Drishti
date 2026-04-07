import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createAnnualExamSchema } from '../validators';
import { listAnnualExams, createAnnualExam } from '../controllers/annual-exam.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:serviceNumber/annual-exam', authorize('annual_medical_exam', 'read'), listAnnualExams);
router.post('/:serviceNumber/annual-exam', authorize('annual_medical_exam', 'create'), validate(createAnnualExamSchema), createAnnualExam);

export default router;

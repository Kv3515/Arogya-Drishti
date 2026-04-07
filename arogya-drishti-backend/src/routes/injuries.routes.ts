import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createInjurySchema, updateInjurySchema } from '../validators';
import { listInjuries, createInjury, updateInjury } from '../controllers/injuries.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:serviceNumber/injuries', authorize('injury_log', 'read'), listInjuries);
router.post('/:serviceNumber/injuries', authorize('injury_log', 'create'), validate(createInjurySchema), createInjury);
router.put('/:serviceNumber/injuries/:id', authorize('injury_log', 'update'), validate(updateInjurySchema), updateInjury);

export default router;

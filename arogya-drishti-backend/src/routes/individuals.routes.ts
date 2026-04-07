import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createIndividualSchema, updateIndividualSchema } from '../validators';
import {
  listIndividuals,
  getIndividual,
  createIndividual,
  updateIndividual,
  updateIndividualPhoto,
} from '../controllers/individuals.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', authorize('individuals', 'read'), listIndividuals);
router.get('/:serviceNumber', authorize('individuals', 'read'), getIndividual);
router.post('/', authorize('individuals', 'create'), validate(createIndividualSchema), createIndividual);
router.put('/:serviceNumber', authorize('individuals', 'update'), validate(updateIndividualSchema), updateIndividual);
router.patch('/:serviceNumber/photo', authorize('individuals', 'update'), updateIndividualPhoto);

export default router;

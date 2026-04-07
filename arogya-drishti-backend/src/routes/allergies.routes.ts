import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listAllergies, createAllergy, updateAllergyStatus } from '../controllers/allergies.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:serviceNumber/allergies', listAllergies);
router.post('/:serviceNumber/allergies', createAllergy);
router.patch('/:serviceNumber/allergies/:allergyId/status', updateAllergyStatus);

export default router;

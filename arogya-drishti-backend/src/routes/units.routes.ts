import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import { getRequestId } from '../utils/params';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  const units = await prisma.unit.findMany({
    orderBy: { unit_name: 'asc' },
    select: { id: true, unit_name: true, parent_unit_id: true },
  });
  res.json(successResponse(units, reqId));
});

export default router;

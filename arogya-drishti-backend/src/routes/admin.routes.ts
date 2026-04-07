import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createUserSchema } from '../validators';
import { listUsers, createUser, updateUser, listAuditLogs } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);

// User management — super_admin only
router.get('/users', authorize('users', 'read'), listUsers);
router.post('/users', authorize('users', 'create'), validate(createUserSchema), createUser);
router.put('/users/:id', authorize('users', 'update'), updateUser);

// Audit logs — super_admin only
router.get('/audit-logs', authorize('audit_logs', 'read'), listAuditLogs);

export default router;

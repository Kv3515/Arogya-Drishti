import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from './auth';
import { ResourceType, ActionType } from '../types';
import { createAuditLog } from '../services/audit.service';
import { isWithinUnitHierarchy } from '../services/unit.service';

/**
 * RBAC Permission Matrix
 *
 * Encodes the complete permission matrix from security-rbac-matrix.md.
 * Each role × resource × action is explicitly defined.
 *
 * Permission values:
 * - true: allowed (full access)
 * - 'unit': scoped to own unit + sub-units
 * - 'self': own record only
 * - 'non_sensitive': excludes is_sensitive=true records
 * - 'aggregated': aggregated data only
 * - false: denied
 */
type Permission = boolean | 'unit' | 'self' | 'non_sensitive' | 'aggregated';

const permissionMatrix: Record<UserRole, Partial<Record<ResourceType, Partial<Record<ActionType, Permission>>>>> = {
  super_admin: {
    individuals:          { create: true, read: true, update: true, delete: true },
    medical_history:      { create: true, read: true, update: true, delete: true },
    prescriptions:        { create: true, read: true, update: true, delete: true },
    vitals_log:           { create: true, read: true, update: true, delete: true },
    injury_log:           { create: true, read: true, update: true, delete: true },
    annual_medical_exam:  { create: true, read: true, update: true, delete: true },
    audit_logs:           { read: true },
    users:                { create: true, read: true, update: true, delete: true },
    units:                { create: true, read: true, update: true, delete: true },
    analytics:            { read: true },
  },

  medical_officer: {
    individuals:          { read: true, update: true },
    medical_history:      { create: true, read: true, update: true },
    prescriptions:        { create: true, read: true, update: true, delete: true },
    vitals_log:           { create: true, read: true, update: true, delete: true },
    injury_log:           { create: true, read: true, update: true, delete: true },
    annual_medical_exam:  { create: true, read: true, update: true, delete: true },
    units:                { read: true },
    analytics:            { read: true },
  },

  paramedic: {
    individuals:          { read: 'unit' },
    medical_history:      { create: true, read: 'unit' },
    prescriptions:        { read: 'unit' },
    vitals_log:           { create: true, read: 'unit' },
    injury_log:           { create: true, read: 'unit' },
    annual_medical_exam:  { read: 'unit' },
    units:                { read: true },
  },

  commander: {
    individuals:          { read: 'unit' },
    medical_history:      { read: false },  // Explicitly denied
    prescriptions:        { read: false },  // Explicitly denied
    vitals_log:           { read: 'aggregated' },
    injury_log:           { read: 'aggregated' },
    annual_medical_exam:  { read: 'aggregated' },
    units:                { read: true },
    analytics:            { read: true },
  },

  individual: {
    individuals:          { read: 'self' },
    medical_history:      { read: 'self' },
    prescriptions:        { read: 'self' },
    vitals_log:           { read: 'self' },
    injury_log:           { read: 'self' },
    annual_medical_exam:  { read: 'self' },
  },
};

/**
 * Check if a role has permission for a resource+action.
 * Returns the permission scope or false for denied.
 */
export function checkPermission(
  role: UserRole,
  resource: ResourceType,
  action: ActionType
): Permission {
  const rolePerms = permissionMatrix[role];
  if (!rolePerms) return false;

  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;

  return resourcePerms[action] ?? false;
}

/**
 * RBAC middleware factory.
 * Returns middleware that enforces the permission matrix.
 */
export function authorize(resource: ResourceType, action: ActionType) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        meta: { timestamp: new Date().toISOString(), requestId: req.headers['x-request-id'] || '' },
      });
      return;
    }

    const permission = checkPermission(user.role, resource, action);

    if (permission === false) {
      // Log permission denial for audit
      await createAuditLog({
        userId: user.sub,
        action: 'read',
        resourceType: resource,
        resourceId: undefined,
        ipAddress: req.ip || null,
        userAgent: req.get('user-agent') || null,
      }).catch(() => {}); // Don't fail the request if audit logging fails

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        details: { role: user.role, resource, action },
        meta: { timestamp: new Date().toISOString(), requestId: req.headers['x-request-id'] || '' },
      });
      return;
    }

    // Attach permission scope to request for downstream use
    (req as AuthRequest & { permissionScope?: Permission }).permissionScope = permission;

    next();
  };
}

/**
 * Checks unit-level scope: is targetUnitId within the user's unit hierarchy?
 * Replaces the synchronous isWithinUnitScope; now fully async.
 *
 * Now traverses full unit hierarchy (parent-child relationships).
 * Cache TTL: 5 minutes (in-process).
 *
 * Used by controllers to enforce unit-scoped access.
 */
export async function isWithinUnitScope(
  userUnitId: string | null,
  targetUnitId: string
): Promise<boolean> {
  return isWithinUnitHierarchy(userUnitId, targetUnitId);
}

// Re-export for convenience in controllers
export { isWithinUnitHierarchy };

export { permissionMatrix };

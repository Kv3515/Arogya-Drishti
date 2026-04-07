import { checkPermission, permissionMatrix } from '../middleware/rbac';
import { ResourceType, ActionType } from '../types';
import { UserRole } from '@prisma/client';

/**
 * Unit tests for RBAC permission matrix.
 * Tests the checkPermission function against the defined permission matrix.
 *
 * This suite validates role-based access control for all resources and actions.
 */

describe('RBAC Permission Matrix', () => {
  describe('super_admin role', () => {
    it('should have full access to all resources', () => {
      const resources: ResourceType[] = [
        'individuals',
        'medical_history',
        'prescriptions',
        'vitals_log',
        'injury_log',
        'annual_medical_exam',
        'audit_logs',
        'users',
        'units',
        'analytics',
      ];

      resources.forEach((resource) => {
        const canCreate = checkPermission('super_admin', resource, 'create');
        const canRead = checkPermission('super_admin', resource, 'read');
        const canUpdate = checkPermission('super_admin', resource, 'update');
        const canDelete = checkPermission('super_admin', resource, 'delete');

        // audit_logs: only read allowed
        if (resource === 'audit_logs') {
          expect(canRead).toBe(true);
          expect(canCreate).toBe(false);
          expect(canUpdate).toBe(false);
          expect(canDelete).toBe(false);
        } else {
          // All other resources: full CRUD
          expect(canCreate).toBe(true);
          expect(canRead).toBe(true);
          expect(canUpdate).toBe(true);
          expect(canDelete).toBe(true);
        }
      });
    });
  });

  describe('medical_officer role', () => {
    it('should be able to CRU (not D) individuals', () => {
      expect(checkPermission('medical_officer', 'individuals', 'create')).toBe(false);
      expect(checkPermission('medical_officer', 'individuals', 'read')).toBe(true);
      expect(checkPermission('medical_officer', 'individuals', 'update')).toBe(true);
      expect(checkPermission('medical_officer', 'individuals', 'delete')).toBe(false);
    });

    it('should be able to CRUD prescriptions', () => {
      expect(checkPermission('medical_officer', 'prescriptions', 'create')).toBe(true);
      expect(checkPermission('medical_officer', 'prescriptions', 'read')).toBe(true);
      expect(checkPermission('medical_officer', 'prescriptions', 'update')).toBe(true);
      expect(checkPermission('medical_officer', 'prescriptions', 'delete')).toBe(true);
    });

    it('should NOT have access to audit_logs', () => {
      expect(checkPermission('medical_officer', 'audit_logs', 'read')).toBe(false);
      expect(checkPermission('medical_officer', 'audit_logs', 'create')).toBe(false);
    });

    it('should be able to create medical history', () => {
      expect(checkPermission('medical_officer', 'medical_history', 'create')).toBe(true);
      expect(checkPermission('medical_officer', 'medical_history', 'read')).toBe(true);
      expect(checkPermission('medical_officer', 'medical_history', 'update')).toBe(true);
    });
  });

  describe('paramedic role', () => {
    it('should have unit-scoped read on individuals', () => {
      const permission = checkPermission('paramedic', 'individuals', 'read');
      expect(permission).toBe('unit');
    });

    it('should be able to create vitals', () => {
      expect(checkPermission('paramedic', 'vitals_log', 'create')).toBe(true);
      expect(checkPermission('paramedic', 'vitals_log', 'read')).toBe('unit');
    });

    it('should NOT have analytics access', () => {
      expect(checkPermission('paramedic', 'analytics', 'read')).toBe(false);
    });

    it('should NOT be able to delete users', () => {
      expect(checkPermission('paramedic', 'users', 'delete')).toBe(false);
    });

    it('should have unit-scoped read on medical history', () => {
      const permission = checkPermission('paramedic', 'medical_history', 'read');
      expect(permission).toBe('unit');
    });
  });

  describe('commander role', () => {
    it('should have unit-scoped read on individuals', () => {
      const permission = checkPermission('commander', 'individuals', 'read');
      expect(permission).toBe('unit');
    });

    it('should have aggregated read on vitals', () => {
      const permission = checkPermission('commander', 'vitals_log', 'read');
      expect(permission).toBe('aggregated');
    });

    it('should have aggregated read on injury logs', () => {
      const permission = checkPermission('commander', 'injury_log', 'read');
      expect(permission).toBe('aggregated');
    });

    it('should be EXPLICITLY DENIED access to medical_history', () => {
      expect(checkPermission('commander', 'medical_history', 'read')).toBe(false);
    });

    it('should be EXPLICITLY DENIED access to prescriptions', () => {
      expect(checkPermission('commander', 'prescriptions', 'read')).toBe(false);
    });

    it('should have read access to analytics', () => {
      expect(checkPermission('commander', 'analytics', 'read')).toBe(true);
    });

    it('should NOT be able to create or delete any resource', () => {
      expect(checkPermission('commander', 'individuals', 'create')).toBe(false);
      expect(checkPermission('commander', 'individuals', 'delete')).toBe(false);
      expect(checkPermission('commander', 'vitals_log', 'create')).toBe(false);
      expect(checkPermission('commander', 'vitals_log', 'delete')).toBe(false);
    });
  });

  describe('individual role', () => {
    it('should have self-only read on all medical resources', () => {
      const medicalResources: ResourceType[] = [
        'individuals',
        'medical_history',
        'prescriptions',
        'vitals_log',
        'injury_log',
        'annual_medical_exam',
      ];

      medicalResources.forEach((resource) => {
        const permission = checkPermission('individual', resource, 'read');
        expect(permission).toBe('self');
      });
    });

    it('should NOT be able to create, update, or delete any resource', () => {
      expect(checkPermission('individual', 'individuals', 'create')).toBe(false);
      expect(checkPermission('individual', 'individuals', 'update')).toBe(false);
      expect(checkPermission('individual', 'individuals', 'delete')).toBe(false);
      expect(checkPermission('individual', 'medical_history', 'create')).toBe(false);
      expect(checkPermission('individual', 'vitals_log', 'create')).toBe(false);
    });
  });

  describe('permission boundary tests', () => {
    it('paramedic cannot delete users', () => {
      expect(checkPermission('paramedic', 'users', 'delete')).toBe(false);
    });

    it('paramedic cannot read analytics', () => {
      expect(checkPermission('paramedic', 'analytics', 'read')).toBe(false);
    });

    it('commander cannot read medical_history', () => {
      expect(checkPermission('commander', 'medical_history', 'read')).toBe(false);
    });

    it('commander cannot read prescriptions', () => {
      expect(checkPermission('commander', 'prescriptions', 'read')).toBe(false);
    });

    it('individual cannot access audit logs', () => {
      expect(checkPermission('individual', 'audit_logs', 'read')).toBe(false);
    });

    it('individual cannot access user management', () => {
      expect(checkPermission('individual', 'users', 'read')).toBe(false);
    });
  });

  describe('undefined roles and resources', () => {
    it('should return false for undefined role', () => {
      expect(checkPermission('invalid_role' as any, 'individuals', 'read')).toBe(false);
    });

    it('should return false for undefined resource', () => {
      expect(checkPermission('super_admin', 'invalid_resource' as any, 'read')).toBe(false);
    });

    it('should return false for undefined action', () => {
      expect(checkPermission('medical_officer', 'individuals', 'invalid_action' as any)).toBe(false);
    });
  });

  describe('permission matrix structure', () => {
    it('should have all required roles in the matrix', () => {
      const requiredRoles = ['super_admin', 'medical_officer', 'paramedic', 'commander', 'individual'];
      requiredRoles.forEach((role) => {
        expect(permissionMatrix).toHaveProperty(role);
        expect(permissionMatrix[role as UserRole]).toBeDefined();
      });
    });

    it('should define permissions for all RBAC-protected resources', () => {
      const rbacResources: ResourceType[] = [
        'individuals',
        'medical_history',
        'prescriptions',
        'vitals_log',
        'injury_log',
        'annual_medical_exam',
        'audit_logs',
        'users',
        'units',
        'analytics',
      ];

      // super_admin should have entries for all resources
      rbacResources.forEach((resource) => {
        expect(permissionMatrix.super_admin).toHaveProperty(resource);
      });
    });
  });
});

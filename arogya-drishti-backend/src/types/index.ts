import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;       // user.id
  username: string;
  role: UserRole;
  unitId: string | null;
  linkedIndividualId: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    timestamp: string;
    requestId: string;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// RBAC Permission Types
export type ResourceType =
  | 'individuals'
  | 'medical_history'
  | 'prescriptions'
  | 'vitals_log'
  | 'injury_log'
  | 'annual_medical_exam'
  | 'audit_logs'
  | 'users'
  | 'units'
  | 'analytics';

export type ActionType = 'create' | 'read' | 'update' | 'delete';

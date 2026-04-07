import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Assigns a unique request ID to each incoming request.
 */
export function requestId(req: Request, _res: Response, next: NextFunction): void {
  const headerVal = req.headers['x-request-id'];
  const id = (Array.isArray(headerVal) ? headerVal[0] : headerVal) || uuidv4();
  req.headers['x-request-id'] = id;
  next();
}

/**
 * Builds a success response.
 */
export function successResponse<T>(data: T, requestId: string) {
  return {
    success: true as const,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Builds a paginated response.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  requestId: string
) {
  return {
    success: true as const,
    data: {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Builds an error response.
 */
export function errorResponse(
  error: string,
  code: string,
  requestId: string,
  details?: Record<string, unknown>
) {
  return {
    success: false as const,
    error,
    code,
    ...(details && { details }),
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Global error handler middleware.
 */
export function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[ERROR] ${err.message}`, { stack: err.stack, path: req.path });

  // Never leak internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  const headerVal = req.headers['x-request-id'];
  const reqId = Array.isArray(headerVal) ? headerVal[0] : headerVal ?? '';
  res.status(500).json(
    errorResponse(message, 'INTERNAL_ERROR', reqId)
  );
}

/**
 * Parse pagination from query params with safe defaults.
 */
export function parsePagination(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(String(query.limit || '50'), 10) || 50));
  return { page, limit, skip: (page - 1) * limit };
}

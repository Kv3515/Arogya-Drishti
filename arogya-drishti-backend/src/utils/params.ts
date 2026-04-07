import { Request } from 'express';

/**
 * Safely extract a string param from Express v5 params.
 * Express v5 types params as string | string[]; this normalizes to string.
 */
export function getParam(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val ?? '';
}

/**
 * Safely extract the request IP as a string.
 */
export function getIp(req: Request): string | null {
  const ip = req.ip;
  if (!ip) return null;
  return Array.isArray(ip) ? ip[0] : ip;
}

/**
 * Get request ID from headers.
 */
export function getRequestId(req: Request): string {
  const val = req.headers['x-request-id'];
  if (!val) return '';
  return Array.isArray(val) ? val[0] : val;
}

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// ─── In-Memory Login Failure Tracking ────────────────────────────────────────
// Tracks failed login attempts per IP:username key.
// Upgrade path: Replace with Redis for distributed systems.

interface FailureRecord {
  count: number;
  firstFailureTime: number;
}

const loginFailures = new Map<string, FailureRecord>();

const FAILURE_THRESHOLD = 5; // Lock after 5 failed attempts
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FAILURE_RESET_WINDOW_MS = 15 * 60 * 1000; // Count resets after 15 min of no failures

/**
 * Generates a unique key for login attempt tracking: `{ip}:{username}`
 */
function getLoginKey(ip: string, username: string): string {
  return `${ip}:${username}`;
}

/**
 * Checks if a user account is locked due to too many failed login attempts.
 * Returns locked status and lockout expiration time if applicable.
 */
export function checkLoginLockout(
  ip: string,
  username: string
): { locked: boolean; lockedUntil?: Date } {
  const key = getLoginKey(ip, username);
  const record = loginFailures.get(key);

  if (!record) {
    return { locked: false };
  }

  const timeSinceFirstFailure = Date.now() - record.firstFailureTime;

  // If 15 minutes have passed, reset the counter
  if (timeSinceFirstFailure > FAILURE_RESET_WINDOW_MS) {
    loginFailures.delete(key);
    return { locked: false };
  }

  // If we've hit the threshold, account is locked until 15 min after first attempt
  if (record.count >= FAILURE_THRESHOLD) {
    const lockedUntil = new Date(record.firstFailureTime + LOCKOUT_WINDOW_MS);
    return { locked: true, lockedUntil };
  }

  return { locked: false };
}

/**
 * Records a failed login attempt.
 * Increments counter and initializes firstFailureTime if this is the first attempt.
 */
export function recordLoginFailure(ip: string, username: string): void {
  const key = getLoginKey(ip, username);
  const record = loginFailures.get(key);

  if (record) {
    record.count += 1;
  } else {
    loginFailures.set(key, {
      count: 1,
      firstFailureTime: Date.now(),
    });
  }
}

/**
 * Clears the failure count for a successful login.
 */
export function clearLoginFailures(ip: string, username: string): void {
  const key = getLoginKey(ip, username);
  loginFailures.delete(key);
}

// ─── Express Rate Limiter Middleware ────────────────────────────────────────
// Applied to /api/v1/auth routes for stricter enforcement.

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 min per IP on /auth/* routes
  keyGenerator: (req: Request) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
  standardHeaders: true, // Include RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests to authentication endpoints. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: (req: Request) => {
    // Skip rate limiting for non-auth routes (belt-and-suspenders)
    return !req.path.includes('/auth');
  },
});

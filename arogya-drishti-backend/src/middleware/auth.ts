import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ── Dev bypass (Phases 1–5 only) ──────────────────────────────────────────────
// When DEV_BYPASS_AUTH=true (and NODE_ENV !== production), all JWT validation
// is skipped. A real super_admin user from the database is looked up once,
// cached, and injected into req.user for every request.
// This lets every dashboard and API route work without a login screen during
// feature development. Set DEV_BYPASS_AUTH=false to re-enable auth (Phase 6).

let _bypassUser: JwtPayload | null = null;

async function getBypassUser(): Promise<JwtPayload> {
  if (_bypassUser) return _bypassUser;

  // Lazy import to avoid circular deps at module load time
  const prisma = (await import('../config/database')).default;
  const admin = await prisma.user.findFirst({
    where: { role: 'super_admin', is_active: true },
    select: { id: true, username: true, role: true, unit_id: true, linked_individual_id: true },
  });

  if (!admin) {
    throw new Error('[DEV BYPASS] No super_admin user found in database. Run prisma db seed first.');
  }

  _bypassUser = {
    sub: admin.id,
    username: admin.username,
    role: admin.role,
    unitId: admin.unit_id,
    linkedIndividualId: admin.linked_individual_id,
  };

  console.log(`[DEV BYPASS] Authenticated as ${admin.username} (${admin.id})`);
  return _bypassUser;
}

/**
 * JWT authentication middleware.
 * Verifies the access token from the Authorization header.
 * Pins algorithm to HS256 to prevent `alg: none` attacks.
 *
 * DEV_BYPASS_AUTH=true skips JWT validation entirely and injects a real
 * super_admin user from the database. Never active in production.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  // ── Dev bypass ─────────────────────────────────────────────────────────────
  if (process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    getBypassUser()
      .then((bypassUser) => {
        req.user = bypassUser;
        next();
      })
      .catch((err) => {
        console.error('[DEV BYPASS] Failed to load bypass user:', err.message);
        res.status(500).json({ success: false, error: 'Dev bypass misconfigured — check server logs', code: 'BYPASS_ERROR' });
      });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
      meta: { timestamp: new Date().toISOString(), requestId: req.headers['x-request-id'] || '' },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'], // Pin algorithm — reject alg:none
    }) as JwtPayload;

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        meta: { timestamp: new Date().toISOString(), requestId: req.headers['x-request-id'] || '' },
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      meta: { timestamp: new Date().toISOString(), requestId: req.headers['x-request-id'] || '' },
    });
  }
}

/**
 * Generates access and refresh tokens for a user.
 */
export function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: 900, // 15 minutes
  });

  const refreshToken = jwt.sign(
    { sub: payload.sub, type: 'refresh' },
    config.jwt.refreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: 604800, // 7 days
    }
  );

  return { accessToken, refreshToken };
}

/**
 * Verifies a refresh token.
 */
export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwt.refreshSecret, {
    algorithms: ['HS256'],
  }) as { sub: string };
}

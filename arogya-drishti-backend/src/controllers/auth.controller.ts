import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config/env';
import { AuthRequest, generateTokens, verifyRefreshToken } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, errorResponse } from '../utils/response';
import { getRequestId, getIp } from '../utils/params';
import { checkLoginLockout, recordLoginFailure, clearLoginFailures } from '../middleware/rateLimiter';

/**
 * POST /auth/login
 * Authenticates user with username/password. Returns JWT access + refresh tokens.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  const reqId = getRequestId(req);
  const ip = getIp(req) ?? 'unknown';

  // Check if account is locked due to too many failed attempts
  const lockoutStatus = checkLoginLockout(ip, username);
  if (lockoutStatus.locked) {
    res.status(429).json(errorResponse(
      'Account locked due to too many failed attempts',
      'ACCOUNT_LOCKED',
      reqId,
      { lockedUntil: lockoutStatus.lockedUntil?.toISOString() }
    ));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      unit: true,
      linked_individual: { select: { service_number: true } },
    },
  });

  if (!user || !user.is_active) {
    // Constant-time comparison to prevent timing attacks
    await bcrypt.hash(password, config.bcrypt.saltRounds);
    res.status(401).json(errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', reqId));
    return;
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    // Record the failed attempt and lock if threshold is exceeded
    recordLoginFailure(ip, username);

    await createAuditLog({
      userId: user.id,
      action: 'login',
      resourceType: 'auth',
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? null,
      newValue: { success: false, reason: 'invalid_password' },
    });
    res.status(401).json(errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', reqId));
    return;
  }

  const tokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    unitId: user.unit_id,
    linkedIndividualId: user.linked_individual_id,
  };

  const { accessToken, refreshToken } = generateTokens(tokenPayload);

  // Store hashed refresh token in DB
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Clear any login failure records for this user/IP on successful login
  clearLoginFailures(ip, username);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  await createAuditLog({
    userId: user.id,
    action: 'login',
    resourceType: 'auth',
    ipAddress: ip,
    userAgent: req.get('user-agent') ?? null,
    newValue: { success: true },
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  });

  res.json(successResponse({
    accessToken,
    expiresIn: 900, // 15 minutes in seconds
    user: {
      id: user.id,
      username: user.username,
      email: null,
      role: user.role,
      unitId: user.unit_id,
      individualId: user.linked_individual_id ?? null,
      serviceNumber: user.linked_individual?.service_number ?? null,
    },
  }, reqId));
}

/**
 * POST /auth/refresh
 * Issues a new access token using the refresh token from httpOnly cookie.
 * Implements refresh token rotation — old token is revoked.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json(errorResponse('Refresh token required', 'REFRESH_REQUIRED', reqId));
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Find the stored token
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        user_id: decoded.sub,
        token_hash: tokenHash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });

    if (!storedToken) {
      res.status(401).json(errorResponse('Invalid refresh token', 'INVALID_REFRESH', reqId));
      return;
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    // Get user
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.is_active) {
      res.status(401).json(errorResponse('User not found or inactive', 'USER_INACTIVE', reqId));
      return;
    }

    // Issue new tokens
    const tokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      unitId: user.unit_id,
      linkedIndividualId: user.linked_individual_id,
    };

    const newTokens = generateTokens(tokenPayload);

    // Store new refresh token
    const newTokenHash = crypto.createHash('sha256').update(newTokens.refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: newTokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    res.json(successResponse({ accessToken: newTokens.accessToken, expiresIn: 900 }, reqId));
  } catch {
    res.status(401).json(errorResponse('Invalid refresh token', 'INVALID_REFRESH', reqId));
  }
}

/**
 * GET /auth/me
 * Returns the currently authenticated user's profile.
 * Used by the frontend to restore session state after a silent token refresh.
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);

  if (!req.user) {
    res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED', reqId));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    include: { linked_individual: { select: { service_number: true } } },
  });

  if (!user || !user.is_active) {
    res.status(401).json(errorResponse('User not found or inactive', 'USER_INACTIVE', reqId));
    return;
  }

  res.json(successResponse({
    id: user.id,
    username: user.username,
    email: null,
    role: user.role,
    unitId: user.unit_id,
    individualId: user.linked_individual_id ?? null,
    serviceNumber: user.linked_individual?.service_number ?? null,
  }, reqId));
}

/**
 * POST /auth/logout
 * Revokes the refresh token and clears the cookie.
 */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  if (req.user) {
    await createAuditLog({
      userId: req.user.sub,
      action: 'logout',
      resourceType: 'auth',
      ipAddress: getIp(req),
      userAgent: req.get('user-agent') ?? null,
    });
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.status(204).send();
}

/**
 * PATCH /auth/me/credentials
 * Lets any logged-in user update their own username and/or password.
 * Requires current password as proof of identity.
 */
export async function updateMyCredentials(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  if (!req.user) {
    res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED', reqId));
    return;
  }

  const { currentPassword, newUsername, newPassword } = req.body as {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
  };

  if (!currentPassword) {
    res.status(400).json(errorResponse('Current password is required', 'MISSING_CURRENT_PASSWORD', reqId));
    return;
  }
  if (!newUsername && !newPassword) {
    res.status(400).json(errorResponse('Provide a new username or new password', 'NOTHING_TO_UPDATE', reqId));
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) {
    res.status(404).json(errorResponse('User not found', 'NOT_FOUND', reqId));
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    res.status(401).json(errorResponse('Current password is incorrect', 'WRONG_PASSWORD', reqId));
    return;
  }

  // Check username uniqueness if changing
  if (newUsername && newUsername !== user.username) {
    const conflict = await prisma.user.findUnique({ where: { username: newUsername } });
    if (conflict) {
      res.status(409).json(errorResponse('Username already taken', 'DUPLICATE_USERNAME', reqId));
      return;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (newUsername) updateData.username = newUsername;
  if (newPassword) updateData.password_hash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, username: true, role: true },
  });

  await createAuditLog({
    userId: user.id,
    action: 'update',
    resourceType: 'auth',
    resourceId: user.id,
    oldValue: { username: user.username },
    newValue: { username: updated.username, passwordChanged: !!newPassword },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse({ id: updated.id, username: updated.username, role: updated.role }, reqId));
}

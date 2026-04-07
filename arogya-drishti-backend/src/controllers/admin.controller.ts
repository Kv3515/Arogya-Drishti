import { Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { config } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, paginatedResponse, errorResponse, parsePagination } from '../utils/response';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * GET /admin/users
 */
export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        role: true,
        unit_id: true,
        linked_individual_id: true,
        is_active: true,
        last_login: true,
        created_at: true,
      },
    }),
    prisma.user.count(),
  ]);

  res.json(paginatedResponse(users, total, page, limit, reqId));
}

/**
 * POST /admin/users
 */
export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const adminUser = req.user!;

  const existing = await prisma.user.findUnique({
    where: { username: req.body.username },
  });
  if (existing) {
    res.status(409).json(errorResponse('Username already exists', 'DUPLICATE_USERNAME', reqId));
    return;
  }

  const passwordHash = await bcrypt.hash(req.body.password, config.bcrypt.saltRounds);

  const user = await prisma.user.create({
    data: {
      username: req.body.username,
      password_hash: passwordHash,
      role: req.body.role,
      linked_individual_id: req.body.linked_individual_id,
      unit_id: req.body.unit_id,
    },
    select: {
      id: true,
      username: true,
      role: true,
      unit_id: true,
      is_active: true,
      created_at: true,
    },
  });

  await createAuditLog({
    userId: adminUser.sub,
    action: 'create',
    resourceType: 'users',
    resourceId: user.id,
    newValue: { username: user.username, role: user.role },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(201).json(successResponse(user, reqId));
}

/**
 * PUT /admin/users/:id
 */
export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const adminUser = req.user!;
  const id = getParam(req, 'id');

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(errorResponse('User not found', 'NOT_FOUND', reqId));
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (req.body.username && req.body.username !== existing.username) {
    const conflict = await prisma.user.findUnique({ where: { username: req.body.username } });
    if (conflict) {
      res.status(409).json(errorResponse('Username already taken', 'DUPLICATE_USERNAME', reqId));
      return;
    }
    updateData.username = req.body.username;
  }
  if (req.body.password) updateData.password_hash = await bcrypt.hash(req.body.password, config.bcrypt.saltRounds);
  if (req.body.role) updateData.role = req.body.role;
  if (req.body.unit_id) updateData.unit_id = req.body.unit_id;
  if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, role: true, unit_id: true, is_active: true },
  });

  await createAuditLog({
    userId: adminUser.sub,
    action: 'update',
    resourceType: 'users',
    resourceId: id,
    oldValue: { role: existing.role, is_active: existing.is_active },
    newValue: { role: updated.role, is_active: updated.is_active },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse(updated, reqId));
}

/**
 * GET /admin/audit-logs
 * super_admin only.
 */
export async function listAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { userId, action, resourceType, from, to } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (userId) where.user_id = userId;
  if (action) where.action = action;
  if (resourceType) where.resource_type = resourceType;
  if (from || to) {
    where.created_at = {};
    if (from) (where.created_at as Record<string, unknown>).gte = new Date(from);
    if (to) (where.created_at as Record<string, unknown>).lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id: true, username: true, role: true } } },
    }),
    prisma.auditLog.count({ where: where as any }),
  ]);

  res.json(paginatedResponse(logs, total, page, limit, reqId));
}

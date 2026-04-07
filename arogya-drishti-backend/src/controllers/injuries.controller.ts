import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, paginatedResponse, errorResponse, parsePagination } from '../utils/response';
import { isWithinUnitScope } from '../middleware/rbac';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * GET /individuals/:serviceNumber/injuries
 */
export async function listInjuries(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { status, from, to } = req.query as Record<string, string>;

  const individual = await prisma.individual.findUnique({
    where: { service_number: serviceNumber },
  });

  if (!individual) {
    res.status(404).json(errorResponse('Individual not found', 'NOT_FOUND', reqId));
    return;
  }

  if (user.role === 'individual' && individual.id !== user.linkedIndividualId) {
    res.status(403).json(errorResponse('Access denied', 'FORBIDDEN', reqId));
    return;
  }
  if (user.role === 'paramedic' && !await isWithinUnitScope(user.unitId, individual.unit_id)) {
    res.status(403).json(errorResponse('Access denied', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }
  if (user.role === 'commander') {
    res.status(403).json(errorResponse('Commanders can only view aggregated injuries via analytics', 'FORBIDDEN', reqId));
    return;
  }

  const where: Record<string, unknown> = { individual_id: individual.id };
  if (status) where.recovery_status = status;
  if (from || to) {
    where.injury_date = {};
    if (from) (where.injury_date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.injury_date as Record<string, unknown>).lte = new Date(to);
  }

  const [injuries, total] = await Promise.all([
    prisma.injuryLog.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { injury_date: 'desc' },
      include: { recorder: { select: { id: true, username: true } } },
    }),
    prisma.injuryLog.count({ where: where as any }),
  ]);

  res.json(paginatedResponse(injuries, total, page, limit, reqId));
}

/**
 * POST /individuals/:serviceNumber/injuries
 */
export async function createInjury(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');

  const individual = await prisma.individual.findUnique({
    where: { service_number: serviceNumber },
  });

  if (!individual) {
    res.status(404).json(errorResponse('Individual not found', 'NOT_FOUND', reqId));
    return;
  }

  if (user.role === 'paramedic' && !await isWithinUnitScope(user.unitId, individual.unit_id)) {
    res.status(403).json(errorResponse('Access denied', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }

  const injury = await prisma.injuryLog.create({
    data: {
      individual_id: individual.id,
      injury_date: new Date(req.body.injury_date),
      injury_type: req.body.injury_type,
      body_part: req.body.body_part,
      cause: req.body.cause,
      recovery_status: req.body.recovery_status,
      duty_status: req.body.duty_status,
      notes: req.body.notes,
      recorded_by: user.sub,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'create',
    resourceType: 'injury_log',
    resourceId: injury.id,
    newValue: { individual_id: individual.id, injury_type: injury.injury_type, body_part: injury.body_part },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(201).json(successResponse(injury, reqId));
}

/**
 * PUT /individuals/:serviceNumber/injuries/:id
 */
export async function updateInjury(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const id = getParam(req, 'id');

  const existing = await prisma.injuryLog.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(errorResponse('Injury record not found', 'NOT_FOUND', reqId));
    return;
  }

  const updated = await prisma.injuryLog.update({
    where: { id },
    data: {
      recovery_status: req.body.recovery_status,
      duty_status: req.body.duty_status,
      notes: req.body.notes,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'update',
    resourceType: 'injury_log',
    resourceId: id,
    oldValue: { recovery_status: existing.recovery_status, duty_status: existing.duty_status },
    newValue: { recovery_status: updated.recovery_status, duty_status: updated.duty_status },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse(updated, reqId));
}

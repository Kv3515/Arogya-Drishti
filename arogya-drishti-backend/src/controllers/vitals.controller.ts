import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { createVitalsNotifications } from '../services/notifications.service';
import { successResponse, paginatedResponse, errorResponse, parsePagination } from '../utils/response';
import { isWithinUnitScope } from '../middleware/rbac';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * GET /individuals/:serviceNumber/vitals
 * Lists vitals for an individual. Supports date range filtering.
 */
export async function listVitals(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { from, to } = req.query as Record<string, string>;

  const individual = await prisma.individual.findUnique({
    where: { service_number: serviceNumber },
  });

  if (!individual) {
    res.status(404).json(errorResponse('Individual not found', 'NOT_FOUND', reqId));
    return;
  }

  // Scope enforcement
  if (user.role === 'individual' && individual.id !== user.linkedIndividualId) {
    res.status(403).json(errorResponse('Access denied', 'FORBIDDEN', reqId));
    return;
  }
  if (user.role === 'paramedic' && !await isWithinUnitScope(user.unitId, individual.unit_id)) {
    res.status(403).json(errorResponse('Access denied', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }
  // Commanders get aggregated vitals only — deny individual-level access
  if (user.role === 'commander') {
    res.status(403).json(errorResponse('Commanders can only view aggregated vitals via analytics', 'FORBIDDEN', reqId));
    return;
  }

  const where: Record<string, unknown> = { individual_id: individual.id };
  if (from || to) {
    where.recorded_at = {};
    if (from) (where.recorded_at as Record<string, unknown>).gte = new Date(from);
    if (to) (where.recorded_at as Record<string, unknown>).lte = new Date(to);
  }

  const [vitals, total] = await Promise.all([
    prisma.vitalsLog.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { recorded_at: 'desc' },
      include: { recorder: { select: { id: true, username: true } } },
    }),
    prisma.vitalsLog.count({ where: where as any }),
  ]);

  res.json(paginatedResponse(vitals, total, page, limit, reqId));
}

/**
 * POST /individuals/:serviceNumber/vitals
 * Records a new vitals entry. Available to medical_officer, paramedic, super_admin.
 */
export async function createVitals(req: AuthRequest, res: Response): Promise<void> {
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

  const vitals = await prisma.vitalsLog.create({
    data: {
      individual_id: individual.id,
      recorded_at: new Date(req.body.recorded_at),
      blood_pressure_systolic: req.body.blood_pressure_systolic,
      blood_pressure_diastolic: req.body.blood_pressure_diastolic,
      heart_rate: req.body.heart_rate,
      temperature_celsius: req.body.temperature_celsius,
      oxygen_saturation: req.body.oxygen_saturation,
      weight_kg: req.body.weight_kg,
      height_cm: req.body.height_cm,
      respiratory_rate: req.body.respiratory_rate,
      pain_scale: req.body.pain_scale,
      recorded_by: user.sub,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'create',
    resourceType: 'vitals_log',
    resourceId: vitals.id,
    newValue: { individual_id: individual.id },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  // Fire-and-forget: create notifications for threshold breaches
  createVitalsNotifications(
    individual.id,
    individual.unit_id,
    individual.name,
    individual.service_number,
    vitals as any,
  ).catch(() => {/* non-critical — don't fail vitals save */});

  res.status(201).json(successResponse(vitals, reqId));
}

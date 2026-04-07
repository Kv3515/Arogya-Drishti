import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, paginatedResponse, errorResponse, parsePagination } from '../utils/response';
import { isWithinUnitScope } from '../middleware/rbac';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * Resolves an individual by service_number. Returns null if not found.
 * Enforces scope (self, unit).
 */
async function resolveIndividual(serviceNumber: string, user: NonNullable<AuthRequest['user']>) {
  const individual = await prisma.individual.findUnique({
    where: { service_number: serviceNumber },
  });

  if (!individual) return null;

  // Self-scope for individual role
  if (user.role === 'individual' && individual.id !== user.linkedIndividualId) {
    return 'forbidden' as const;
  }
  // Unit scope for paramedic
  if (user.role === 'paramedic' && !await isWithinUnitScope(user.unitId, individual.unit_id)) {
    return 'forbidden' as const;
  }
  // Commander: explicitly denied from medical_history
  if (user.role === 'commander') {
    return 'forbidden' as const;
  }

  return individual;
}

/**
 * GET /individuals/:serviceNumber/medical-history
 * Lists medical history for an individual. Commanders CANNOT access this.
 */
export async function listMedicalHistory(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { visitType, from, to } = req.query as Record<string, string>;

  const individual = await resolveIndividual(serviceNumber, user);
  if (!individual) {
    res.status(404).json(errorResponse('Individual not found', 'NOT_FOUND', reqId));
    return;
  }
  if (individual === 'forbidden') {
    res.status(403).json(errorResponse('Access denied', 'FORBIDDEN', reqId));
    return;
  }

  const where: Record<string, unknown> = { individual_id: individual.id };

  if (visitType) where.visit_type = visitType;
  if (from || to) {
    where.visit_date = {};
    if (from) (where.visit_date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.visit_date as Record<string, unknown>).lte = new Date(to);
  }

  const [records, total] = await Promise.all([
    prisma.medicalHistory.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { visit_date: 'desc' },
      include: {
        doctor: { select: { id: true, username: true } },
        prescriptions: true,
      },
    }),
    prisma.medicalHistory.count({ where: where as any }),
  ]);

  res.json(paginatedResponse(records, total, page, limit, reqId));
}

/**
 * POST /individuals/:serviceNumber/medical-history
 * Creates a new medical history entry.
 */
export async function createMedicalHistory(req: AuthRequest, res: Response): Promise<void> {
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

  // Paramedic scoped to unit
  if (user.role === 'paramedic' && !await isWithinUnitScope(user.unitId, individual.unit_id)) {
    res.status(403).json(errorResponse('Access denied — outside your unit', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }

  const record = await prisma.medicalHistory.create({
    data: {
      individual_id: individual.id,
      visit_date: new Date(req.body.visit_date),
      visit_type: req.body.visit_type,
      chief_complaint: req.body.chief_complaint,
      symptoms: req.body.symptoms,
      diagnosis_code: req.body.diagnosis_code,
      diagnosis_text: req.body.diagnosis_text,
      severity: req.body.severity,
      is_sensitive: req.body.is_sensitive ?? false,
      doctor_id: user.sub,
      notes: req.body.notes,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'create',
    resourceType: 'medical_history',
    resourceId: record.id,
    newValue: {
      individual_id: individual.id,
      diagnosis_code: record.diagnosis_code,
      diagnosis_text: '[ENCRYPTED]',
      severity: record.severity,
    },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(201).json(successResponse(record, reqId));
}

/**
 * PUT /individuals/:serviceNumber/medical-history/:id
 * Updates a medical history entry.
 */
export async function updateMedicalHistory(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const id = getParam(req, 'id');

  const existing = await prisma.medicalHistory.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json(errorResponse('Record not found', 'NOT_FOUND', reqId));
    return;
  }

  // Only the creating doctor or super_admin can update
  if (user.role !== 'super_admin' && existing.doctor_id !== user.sub) {
    res.status(403).json(errorResponse('Only the creating doctor can modify this record', 'FORBIDDEN', reqId));
    return;
  }

  const updated = await prisma.medicalHistory.update({
    where: { id },
    data: {
      chief_complaint: req.body.chief_complaint,
      symptoms: req.body.symptoms,
      diagnosis_code: req.body.diagnosis_code,
      diagnosis_text: req.body.diagnosis_text,
      severity: req.body.severity,
      is_sensitive: req.body.is_sensitive,
      notes: req.body.notes,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'update',
    resourceType: 'medical_history',
    resourceId: id,
    oldValue: { diagnosis_code: existing.diagnosis_code, severity: existing.severity },
    newValue: { diagnosis_code: updated.diagnosis_code, severity: updated.severity },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse(updated, reqId));
}

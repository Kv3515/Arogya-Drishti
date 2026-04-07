import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, paginatedResponse, errorResponse, parsePagination } from '../utils/response';
import { isWithinUnitScope } from '../middleware/rbac';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * GET /individuals/:serviceNumber/allergies
 */
export async function listAllergies(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

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
    res.status(403).json(errorResponse('Commanders do not have access to individual medical records', 'FORBIDDEN', reqId));
    return;
  }

  const [allergies, total] = await Promise.all([
    prisma.allergy.findMany({
      where: { individual_id: individual.id },
      skip,
      take: limit,
      orderBy: [{ severity: 'asc' }, { created_at: 'desc' }],
      include: { confirming_doctor: { select: { id: true, username: true } } },
    }),
    prisma.allergy.count({ where: { individual_id: individual.id } }),
  ]);

  res.json(paginatedResponse(allergies, total, page, limit, reqId));
}

/**
 * POST /individuals/:serviceNumber/allergies
 */
export async function createAllergy(req: AuthRequest, res: Response): Promise<void> {
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

  const { allergen, reaction_type, severity, status, notes } = req.body as {
    allergen: string;
    reaction_type: string;
    severity: string;
    status?: string;
    notes?: string;
  };

  if (!allergen?.trim()) {
    res.status(400).json(errorResponse('allergen is required', 'VALIDATION_ERROR', reqId));
    return;
  }
  if (!reaction_type) {
    res.status(400).json(errorResponse('reaction_type is required', 'VALIDATION_ERROR', reqId));
    return;
  }
  if (!severity) {
    res.status(400).json(errorResponse('severity is required', 'VALIDATION_ERROR', reqId));
    return;
  }

  const allergy = await prisma.allergy.create({
    data: {
      individual_id: individual.id,
      allergen: allergen.trim(),
      reaction_type: reaction_type as any,
      severity: severity as any,
      status: (status ?? 'active') as any,
      confirmed_by: user.sub,
      confirmed_date: new Date(),
      notes: notes ?? null,
    },
    include: { confirming_doctor: { select: { id: true, username: true } } },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'create',
    resourceType: 'medical_history', // closest available resource type
    resourceId: allergy.id,
    newValue: { individual_id: individual.id, allergen: allergy.allergen },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(201).json(successResponse(allergy, reqId));
}

/**
 * PATCH /individuals/:serviceNumber/allergies/:allergyId/status
 */
export async function updateAllergyStatus(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const allergyId = getParam(req, 'allergyId');

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

  const existing = await prisma.allergy.findFirst({
    where: { id: allergyId, individual_id: individual.id },
  });

  if (!existing) {
    res.status(404).json(errorResponse('Allergy record not found', 'NOT_FOUND', reqId));
    return;
  }

  const { status } = req.body as { status: string };
  if (!status) {
    res.status(400).json(errorResponse('status is required', 'VALIDATION_ERROR', reqId));
    return;
  }

  const updated = await prisma.allergy.update({
    where: { id: allergyId },
    data: { status: status as any },
    include: { confirming_doctor: { select: { id: true, username: true } } },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'update',
    resourceType: 'medical_history',
    resourceId: allergyId,
    oldValue: { status: existing.status },
    newValue: { status: updated.status },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse(updated, reqId));
}

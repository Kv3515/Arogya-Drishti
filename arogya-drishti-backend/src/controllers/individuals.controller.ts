import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, paginatedResponse, errorResponse, parsePagination } from '../utils/response';
import { isWithinUnitScope } from '../middleware/rbac';
import { getUnitSubtree } from '../services/unit.service';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * GET /individuals
 * Lists individuals with search, filtering, and pagination.
 * Scope enforcement: paramedics/commanders see only their unit.
 */
export async function listIndividuals(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { search, unitId, isActive } = req.query as Record<string, string>;

  // Build where clause with scope enforcement
  const where: Record<string, unknown> = {};

  // Scope by role — use full unit hierarchy (BFS) for paramedic and commander
  if (user.role === 'individual') {
    where.id = user.linkedIndividualId;
  } else if (['paramedic', 'commander'].includes(user.role) && user.unitId) {
    const subtree = await getUnitSubtree(user.unitId);
    where.unit_id = { in: [...subtree] };
  } else if (unitId) {
    where.unit_id = unitId;
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  if (search && search.length >= 3) {
    where.OR = [
      { service_number: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [individuals, total] = await Promise.all([
    prisma.individual.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        unit: { select: { id: true, unit_name: true } },
      },
    }),
    prisma.individual.count({ where: where as any }),
  ]);

  // Fetch latest fitness status for each individual (separate query to avoid include issues)
  const individualIds = individuals.map((ind) => ind.id);
  let fitnessMap: Record<string, string> = {};
  try {
    if (individualIds.length > 0) {
      const exams = await prisma.annualMedicalExam.findMany({
        where: { individual_id: { in: individualIds } },
        orderBy: { exam_date: 'desc' },
        distinct: ['individual_id'],
        select: { individual_id: true, medical_category: true },
      });
      fitnessMap = Object.fromEntries(exams.map((e) => [e.individual_id, e.medical_category]));
    }
  } catch (e) {
    console.warn('[listIndividuals] Failed to fetch fitness status:', e);
  }

  // Commanders get roster info (name, service_number, blood_group) but no medical data
  const data = individuals.map((ind) => {
    const ci = ind.contact_info as Record<string, unknown> | null;
    return {
      id: ind.id,
      service_number: ind.service_number,
      name: ind.name,
      date_of_birth: ind.date_of_birth,
      sex: ind.sex,
      blood_group: ind.blood_group,
      unit: ind.unit,
      unit_id: ind.unit_id,
      contact_info: ind.contact_info,
      photo_url: ind.photo_url ?? null,
      rank: (ci?.rank as string | null) ?? null,
      duty_status: 'active',
      fitness_status: fitnessMap[ind.id] ?? null,   // legacy key retained for API compat
      medical_category: fitnessMap[ind.id] ?? null,
      is_active: ind.is_active,
      created_at: ind.created_at,
    };
  });

  res.json(paginatedResponse(data, total, page, limit, reqId));
}

/**
 * GET /individuals/:serviceNumber
 * Get individual profile by service number (not UUID — per spec).
 */
export async function getIndividual(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');

  const individual = await prisma.individual.findUnique({
    where: { service_number: serviceNumber },
    include: {
      unit: { select: { id: true, unit_name: true } },
    },
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
  if (['paramedic', 'commander'].includes(user.role) && !await isWithinUnitScope(user.unitId, individual.unit_id)) {
    res.status(403).json(errorResponse('Access denied — outside your unit', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }

  // Fetch latest annual exam separately (avoids Prisma include edge-cases)
  let latestExam: { medical_category: string; fitness_valid_until: Date } | null = null;
  try {
    const exam = await prisma.annualMedicalExam.findFirst({
      where: { individual_id: individual.id },
      orderBy: { exam_date: 'desc' },
      select: { medical_category: true, fitness_valid_until: true },
    });
    latestExam = exam;
  } catch (e) {
    console.warn('[getIndividual] Failed to fetch annual exam:', e);
  }

  res.json(successResponse({
    id: individual.id,
    service_number: individual.service_number,
    name: individual.name,
    date_of_birth: individual.date_of_birth,
    sex: individual.sex,
    blood_group: individual.blood_group,
    unit_id: individual.unit_id,
    unit: individual.unit,
    contact_info: individual.contact_info,
    photo_url: individual.photo_url ?? null,
    fitness_status: latestExam?.medical_category ?? null,   // legacy key retained for API compat
    medical_category: latestExam?.medical_category ?? null,
    fitness_valid_until: latestExam?.fitness_valid_until ?? null,
    is_active: individual.is_active,
    created_at: individual.created_at,
    updated_at: individual.updated_at,
  }, reqId));
}

/**
 * POST /individuals
 * Creates a new individual record. super_admin only.
 */
export async function createIndividual(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;

  const existing = await prisma.individual.findUnique({
    where: { service_number: req.body.service_number },
  });
  if (existing) {
    res.status(409).json(errorResponse('Service number already exists', 'DUPLICATE_SERVICE_NUMBER', reqId));
    return;
  }

  const individual = await prisma.individual.create({
    data: {
      service_number: req.body.service_number,
      name: req.body.name,
      date_of_birth: new Date(req.body.date_of_birth),
      sex: req.body.sex,
      blood_group: req.body.blood_group,
      unit_id: req.body.unit_id,
      contact_info: req.body.contact_info,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'create',
    resourceType: 'individuals',
    resourceId: individual.id,
    newValue: { service_number: individual.service_number, unit_id: individual.unit_id },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(201).json(successResponse(individual, reqId));
}

/**
 * PUT /individuals/:serviceNumber
 * Updates an individual record.
 */
export async function updateIndividual(req: AuthRequest, res: Response): Promise<void> {
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

  const updated = await prisma.individual.update({
    where: { id: individual.id },
    data: {
      name: req.body.name,
      blood_group: req.body.blood_group,
      unit_id: req.body.unit_id,
      contact_info: req.body.contact_info,
      is_active: req.body.is_active,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'update',
    resourceType: 'individuals',
    resourceId: individual.id,
    oldValue: { name: individual.name, unit_id: individual.unit_id },
    newValue: { name: updated.name, unit_id: updated.unit_id },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse(updated, reqId));
}

/**
 * PATCH /individuals/:serviceNumber/photo
 * Saves a base64 photo URL for an individual.
 */
export async function updateIndividualPhoto(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const { photo_url } = req.body as { photo_url: string };

  if (!photo_url || typeof photo_url !== 'string') {
    res.status(400).json(errorResponse('photo_url is required', 'VALIDATION_ERROR', reqId));
    return;
  }

  const individual = await prisma.individual.findUnique({
    where: { service_number: serviceNumber },
  });

  if (!individual) {
    res.status(404).json(errorResponse('Individual not found', 'NOT_FOUND', reqId));
    return;
  }

  // Scope: individual can only update their own photo
  if (user.role === 'individual' && individual.id !== user.linkedIndividualId) {
    res.status(403).json(errorResponse('Access denied', 'FORBIDDEN', reqId));
    return;
  }

  const updated = await prisma.individual.update({
    where: { id: individual.id },
    data: { photo_url },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'update_photo',
    resourceType: 'individuals',
    resourceId: individual.id,
    newValue: { service_number: individual.service_number },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse({ photo_url: updated.photo_url }, reqId));
}

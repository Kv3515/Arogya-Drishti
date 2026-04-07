import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, errorResponse, paginatedResponse, parsePagination } from '../utils/response';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * GET /individuals/:serviceNumber/prescriptions
 * Lists prescriptions for an individual.
 */
export async function listPrescriptions(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const { active } = req.query as Record<string, string>;

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
  if (user.role === 'commander') {
    res.status(403).json(errorResponse('Commanders cannot access prescription data', 'FORBIDDEN', reqId));
    return;
  }

  const where: Record<string, unknown> = { individual_id: individual.id };
  if (active !== undefined) {
    where.is_active = active === 'true';
  }

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        medical_history: {
          select: { id: true, visit_date: true, diagnosis_code: true },
        },
      },
    }),
    prisma.prescription.count({ where: where as any }),
  ]);

  res.json(paginatedResponse(prescriptions, total, page, limit, reqId));
}

/**
 * POST /individuals/:serviceNumber/medical-history/:historyId/prescriptions
 * Creates a new prescription linked to a medical history entry.
 */
export async function createPrescription(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const serviceNumber = getParam(req, 'serviceNumber');
  const historyId = getParam(req, 'historyId');

  const individual = await prisma.individual.findUnique({
    where: { service_number: serviceNumber },
  });

  if (!individual) {
    res.status(404).json(errorResponse('Individual not found', 'NOT_FOUND', reqId));
    return;
  }

  const history = await prisma.medicalHistory.findUnique({ where: { id: historyId } });
  if (!history || history.individual_id !== individual.id) {
    res.status(404).json(errorResponse('Medical history entry not found', 'NOT_FOUND', reqId));
    return;
  }

  const prescription = await prisma.prescription.create({
    data: {
      medical_history_id: historyId,
      individual_id: individual.id,
      medication_name: req.body.medication_name,
      dosage: req.body.dosage,
      frequency: req.body.frequency,
      duration_days: req.body.duration_days,
      route: req.body.route,
      instructions: req.body.instructions,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'create',
    resourceType: 'prescriptions',
    resourceId: prescription.id,
    newValue: { individual_id: individual.id, medication_name: prescription.medication_name },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(201).json(successResponse(prescription, reqId));
}

/**
 * PUT /prescriptions/:id/deactivate
 * Marks a prescription as inactive.
 */
export async function deactivatePrescription(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const id = getParam(req, 'id');

  const prescription = await prisma.prescription.findUnique({ where: { id } });
  if (!prescription) {
    res.status(404).json(errorResponse('Prescription not found', 'NOT_FOUND', reqId));
    return;
  }

  const updated = await prisma.prescription.update({
    where: { id },
    data: { is_active: false },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'update',
    resourceType: 'prescriptions',
    resourceId: id,
    oldValue: { is_active: true },
    newValue: { is_active: false },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.json(successResponse(updated, reqId));
}

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit.service';
import { successResponse, paginatedResponse, errorResponse, parsePagination } from '../utils/response';
import { isWithinUnitScope } from '../middleware/rbac';
import { getRequestId, getIp, getParam } from '../utils/params';

/**
 * GET /individuals/:serviceNumber/annual-exam
 */
export async function listAnnualExams(req: AuthRequest, res: Response): Promise<void> {
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
  // Commanders: aggregated only (via analytics). Deny individual-level.
  if (user.role === 'commander') {
    res.status(403).json(errorResponse('Commanders can only view aggregated fitness data via analytics', 'FORBIDDEN', reqId));
    return;
  }

  const [exams, total] = await Promise.all([
    prisma.annualMedicalExam.findMany({
      where: { individual_id: individual.id },
      skip,
      take: limit,
      orderBy: { exam_date: 'desc' },
      include: { examining_officer: { select: { id: true, username: true } } },
    }),
    prisma.annualMedicalExam.count({ where: { individual_id: individual.id } }),
  ]);

  res.json(paginatedResponse(exams, total, page, limit, reqId));
}

/**
 * POST /individuals/:serviceNumber/annual-exam
 */
export async function createAnnualExam(req: AuthRequest, res: Response): Promise<void> {
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

  const exam = await prisma.annualMedicalExam.create({
    data: {
      individual_id: individual.id,
      exam_date: new Date(req.body.exam_date),
      medical_category: req.body.medical_category,
      fitness_valid_until: new Date(req.body.fitness_valid_until),
      bmi: req.body.bmi,
      vision_left: req.body.vision_left,
      vision_right: req.body.vision_right,
      hearing_status: req.body.hearing_status,
      shape_s: req.body.shape_s ?? null,
      shape_h: req.body.shape_h ?? null,
      shape_a: req.body.shape_a ?? null,
      shape_p: req.body.shape_p ?? null,
      shape_e: req.body.shape_e ?? null,
      cope_c: req.body.cope_c ?? null,
      cope_o: req.body.cope_o ?? null,
      cope_p: req.body.cope_p ?? null,
      cope_e: req.body.cope_e ?? null,
      lab_results: req.body.lab_results,
      remarks: req.body.remarks,
      examining_officer_id: user.sub,
    },
  });

  await createAuditLog({
    userId: user.sub,
    action: 'create',
    resourceType: 'annual_medical_exam',
    resourceId: exam.id,
    newValue: { individual_id: individual.id, medical_category: exam.medical_category },
    ipAddress: getIp(req),
    userAgent: req.get('user-agent') ?? null,
  });

  res.status(201).json(successResponse(exam, reqId));
}

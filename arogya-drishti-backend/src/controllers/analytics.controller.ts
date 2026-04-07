import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { isWithinUnitScope } from '../middleware/rbac';
import { getRequestId, getParam } from '../utils/params';

/**
 * GET /analytics/unit/:unitId/fitness-summary
 * Returns aggregated fitness status counts for a unit.
 * Commanders: counts only. Medical officers: full detail.
 * ZERO individual PII at this endpoint.
 */
export async function fitnessSummary(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const unitId = getParam(req, 'unitId');

  // Scope check
  if (['commander', 'paramedic'].includes(user.role) && !await isWithinUnitScope(user.unitId, unitId)) {
    res.status(403).json(errorResponse('Access denied — outside your unit', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }

  // Get unit info
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    res.status(404).json(errorResponse('Unit not found', 'NOT_FOUND', reqId));
    return;
  }

  // Get latest annual exam per individual in this unit
  const individuals = await prisma.individual.findMany({
    where: { unit_id: unitId, is_active: true },
    select: { id: true },
  });

  const individualIds = individuals.map(i => i.id);

  // Get most recent exam for each individual
  // medical_category: 1A/1B = operationally fit; 2/3 = limited/monitor; 4 = temp unfit; 5 = perm unfit
  const latestExams = await prisma.$queryRawUnsafe<Array<{ medical_category: string; count: bigint }>>(
    `SELECT ame.medical_category, COUNT(*)::bigint as count
     FROM annual_medical_exam ame
     INNER JOIN (
       SELECT individual_id, MAX(exam_date) as max_date
       FROM annual_medical_exam
       WHERE individual_id = ANY($1::uuid[])
       GROUP BY individual_id
     ) latest ON ame.individual_id = latest.individual_id AND ame.exam_date = latest.max_date
     GROUP BY ame.medical_category`,
    individualIds
  );

  // Map SHAPE categories to display buckets
  const catCounts: Record<string, number> = {};
  for (const row of latestExams) {
    catCounts[row.medical_category] = Number(row.count);
  }
  const fit = (catCounts['1A'] ?? 0) + (catCounts['1B'] ?? 0);
  const monitor = (catCounts['2'] ?? 0) + (catCounts['3'] ?? 0);
  const temporarily_unfit = catCounts['4'] ?? 0;
  const permanently_unfit = catCounts['5'] ?? 0;

  const total = individualIds.length;
  const deployable = total > 0 ? (fit / total) : 0;

  res.json(successResponse({
    unit_name: unit.unit_name,
    unit_id: unitId,
    fitness_summary: {
      fit,
      temporarily_unfit,
      permanently_unfit,
      monitor,
      category_breakdown: catCounts,
      total,
      pct_fit: total > 0 ? Math.round((fit / total) * 10000) / 100 : 0,
      pct_deployable: Math.round(deployable * 10000) / 100,
    },
  }, reqId));
}

/**
 * GET /analytics/unit/:unitId/disease-trends
 * Returns top 10 ICD-10 codes by frequency in last 90 days.
 * Commanders: EXPLICITLY DENIED. Medical officers only.
 */
export async function diseaseTrends(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const unitId = getParam(req, 'unitId');

  // Commanders explicitly denied disease trends (they'd see diagnosis info)
  if (user.role === 'commander') {
    res.status(403).json(errorResponse('Commanders cannot access disease trend data', 'FORBIDDEN', reqId));
    return;
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    res.status(404).json(errorResponse('Unit not found', 'NOT_FOUND', reqId));
    return;
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const trends = await prisma.medicalHistory.groupBy({
    by: ['diagnosis_code'],
    where: {
      individual: { unit_id: unitId },
      visit_date: { gte: ninetyDaysAgo },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const data = trends.map((t) => ({
    diagnosis_code: t.diagnosis_code,
    count: (t._count as Record<string, number>).id,
  }));

  res.json(successResponse({
    unit_name: unit.unit_name,
    period_days: 90,
    trends: data,
  }, reqId));
}

/**
 * GET /analytics/unit/:unitId/injury-rates
 * Returns monthly injury counts for the last 12 months.
 * Commanders: aggregate counts only (no names/IDs).
 */
export async function injuryRates(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const unitId = getParam(req, 'unitId');

  if (['commander', 'paramedic'].includes(user.role) && !await isWithinUnitScope(user.unitId, unitId)) {
    res.status(403).json(errorResponse('Access denied — outside your unit', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    res.status(404).json(errorResponse('Unit not found', 'NOT_FOUND', reqId));
    return;
  }

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const injuries = await prisma.injuryLog.findMany({
    where: {
      individual: { unit_id: unitId },
      injury_date: { gte: oneYearAgo },
    },
    select: {
      injury_date: true,
      injury_type: true,
    },
  });

  // Aggregate by month
  const monthlyData: Record<string, { count: number; types: Record<string, number> }> = {};
  for (const inj of injuries) {
    const month = inj.injury_date.toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, types: {} };
    }
    monthlyData[month].count++;
    monthlyData[month].types[inj.injury_type] = (monthlyData[month].types[inj.injury_type] || 0) + 1;
  }

  const monthly = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      count: data.count,
      top_types: Object.entries(data.types)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type),
    }));

  res.json(successResponse({
    unit_name: unit.unit_name,
    period_months: 12,
    monthly,
  }, reqId));
}

/**
 * GET /analytics/unit/:unitId/deployment-readiness
 * Calculates deployment readiness score.
 * Formula: % fit minus % critical (from non-recovered injuries)
 */
export async function deploymentReadiness(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const unitId = getParam(req, 'unitId');

  if (['commander', 'paramedic'].includes(user.role) && !await isWithinUnitScope(user.unitId, unitId)) {
    res.status(403).json(errorResponse('Access denied — outside your unit', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    res.status(404).json(errorResponse('Unit not found', 'NOT_FOUND', reqId));
    return;
  }

  const totalIndividuals = await prisma.individual.count({
    where: { unit_id: unitId, is_active: true },
  });

  // Collect distinct individual IDs that are non-deployable due to active injuries
  const nonDutyRows = await prisma.injuryLog.findMany({
    where: {
      individual: { unit_id: unitId, is_active: true },
      recovery_status: { in: ['active', 'recovering'] },
      duty_status: { in: ['non_duty', 'hospitalized'] },
    },
    select: { individual_id: true },
    distinct: ['individual_id'],
  });

  // Collect distinct individual IDs that are permanently unfit (category 5)
  const permanentlyUnfitRows = await prisma.annualMedicalExam.findMany({
    where: {
      individual: { unit_id: unitId, is_active: true },
      medical_category: '5',
    },
    select: { individual_id: true },
    distinct: ['individual_id'],
  });

  // Union both sets — a person in both categories must only be counted once
  const nonDeployableIds = new Set([
    ...nonDutyRows.map((r) => r.individual_id),
    ...permanentlyUnfitRows.map((r) => r.individual_id),
  ]);

  const nonDutyCount = nonDutyRows.length;
  const permanentlyUnfitCount = permanentlyUnfitRows.length;
  const nonDeployableCount = nonDeployableIds.size;
  const deployable = totalIndividuals - nonDeployableCount;
  const readinessScore = totalIndividuals > 0
    ? Math.round((deployable / totalIndividuals) * 10000) / 100
    : 0;

  res.json(successResponse({
    unit_name: unit.unit_name,
    total_personnel: totalIndividuals,
    deployable,
    non_duty: nonDutyCount,
    permanently_unfit: permanentlyUnfitCount,
    readiness_score: readinessScore,
    readiness_grade: readinessScore >= 90 ? 'GREEN' : readinessScore >= 75 ? 'AMBER' : 'RED',
  }, reqId));
}

/**
 * GET /analytics/unit/:unitId/activity-stream
 * Returns unit medical activity aggregates for last 30 days.
 * Commanders: aggregate counts only (no PII, no medical details).
 * Privacy-compliant activity visibility.
 */
export async function unitActivityStream(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const unitId = getParam(req, 'unitId');

  // Scope check for commanders
  if (['commander', 'paramedic'].includes(user.role) && !await isWithinUnitScope(user.unitId, unitId)) {
    res.status(403).json(errorResponse('Access denied — outside your unit', 'UNIT_SCOPE_VIOLATION', reqId));
    return;
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    res.status(404).json(errorResponse('Unit not found', 'NOT_FOUND', reqId));
    return;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Daily vitals entries — use findMany and aggregate by date in JS
  // (recorded_at is a full timestamp, not a date, so groupBy would give one group per record)
  const vitalsRows = await prisma.vitalsLog.findMany({
    where: {
      individual: { unit_id: unitId },
      recorded_at: { gte: thirtyDaysAgo },
    },
    select: { recorded_at: true },
  });
  const vitalsActivity = vitalsRows.map((r) => r.recorded_at);

  // Daily medical history entries (count only)
  const medicalActivity = await prisma.medicalHistory.groupBy({
    by: ['visit_date'],
    where: {
      individual: { unit_id: unitId },
      visit_date: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
    orderBy: { visit_date: 'desc' },
  });

  // Daily injury incidents (count only)
  const injuryActivity = await prisma.injuryLog.groupBy({
    by: ['injury_date'],
    where: {
      individual: { unit_id: unitId },
      injury_date: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
    orderBy: { injury_date: 'desc' },
  });

  // Recent prescriptions (count only - no drug names)
  const prescriptionRows = await prisma.prescription.findMany({
    where: {
      individual: { unit_id: unitId },
      created_at: { gte: thirtyDaysAgo },
    },
    select: { created_at: true },
  });
  const prescriptionActivity = prescriptionRows.map((r) => r.created_at);

  // Aggregate daily activity
  const activityMap: Record<string, { 
    date: string;
    vitals: number;
    medical_visits: number;
    injuries: number;
    prescriptions: number;
    total: number;
  }> = {};

  // Process vitals
  for (const ts of vitalsActivity) {
    const dateStr = ts.toISOString().split('T')[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { date: dateStr, vitals: 0, medical_visits: 0, injuries: 0, prescriptions: 0, total: 0 };
    }
    activityMap[dateStr].vitals += 1;
    activityMap[dateStr].total += 1;
  }

  // Process medical visits
  for (const item of medicalActivity) {
    const dateStr = item.visit_date.toISOString().split('T')[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { date: dateStr, vitals: 0, medical_visits: 0, injuries: 0, prescriptions: 0, total: 0 };
    }
    activityMap[dateStr].medical_visits += (item._count as Record<string, number>).id;
    activityMap[dateStr].total += (item._count as Record<string, number>).id;
  }

  // Process injuries
  for (const item of injuryActivity) {
    const dateStr = item.injury_date.toISOString().split('T')[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { date: dateStr, vitals: 0, medical_visits: 0, injuries: 0, prescriptions: 0, total: 0 };
    }
    activityMap[dateStr].injuries += (item._count as Record<string, number>).id;
    activityMap[dateStr].total += (item._count as Record<string, number>).id;
  }

  // Process prescriptions
  for (const ts of prescriptionActivity) {
    const dateStr = ts.toISOString().split('T')[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { date: dateStr, vitals: 0, medical_visits: 0, injuries: 0, prescriptions: 0, total: 0 };
    }
    activityMap[dateStr].prescriptions += 1;
    activityMap[dateStr].total += 1;
  }

  // Convert to sorted array (most recent first)
  const dailyActivity = Object.values(activityMap)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 14); // Last 14 days for UI efficiency

  // Calculate totals for period
  const totals = {
    vitals: vitalsActivity.length,
    medical_visits: medicalActivity.reduce((sum, item) => sum + (item._count as Record<string, number>).id, 0),
    injuries: injuryActivity.reduce((sum, item) => sum + (item._count as Record<string, number>).id, 0),
    prescriptions: prescriptionActivity.length,
  };

  res.json(successResponse({
    unit_name: unit.unit_name,
    unit_id: unitId,
    period_days: 30,
    daily_activity: dailyActivity,
    period_totals: {
      total_vitals_entries: totals.vitals,
      total_medical_visits: totals.medical_visits,
      total_injuries: totals.injuries,
      total_prescriptions: totals.prescriptions,
      total_activity: totals.vitals + totals.medical_visits + totals.injuries + totals.prescriptions,
    },
    last_updated: new Date().toISOString(),
  }, reqId));
}

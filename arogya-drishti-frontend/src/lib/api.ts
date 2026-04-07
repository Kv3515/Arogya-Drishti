/**
 * Typed API client for Arogya Drishti backend.
 * Access token is stored in memory; refresh token is in an httpOnly cookie.
 */

// Derive API host from the browser's own hostname so mobile (LAN IP) and
// desktop (localhost) both work automatically without any config changes.
function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname; // e.g. "192.168.0.149" or "localhost"
    return `http://${host}:3001/api/v1`;
  }
  // SSR fallback
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
}
const API_BASE = resolveApiBase();

// ── Token store (in-memory, survives re-renders but not page reload) ──────────
let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (t: string) => { _accessToken = t; },
  clear: () => { _accessToken = null; },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'medical_officer' | 'paramedic' | 'commander' | 'individual';

export interface UserInfo {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  unitId: string;
  individualId: string | null;
  serviceNumber: string | null;
}

export interface AuthTokens {
  accessToken: string;
  user: UserInfo;
}

export interface Individual {
  id: string;
  serviceNumber: string;
  name: string;
  rank: string;
  unitId: string;
  sex: string;
  dateOfBirth: string;
  bloodGroup: string;
  dutyStatus: string;
  fitnessStatus: string;   // legacy alias — same as medicalCategory
  medicalCategory: string; // SHAPE category: 1A | 1B | 2 | 3 | 4 | 5
  heightCm: number | null;
  weightKg: number | null;
  photoUrl?: string | null;
  unit?: { name: string };
}

export interface MedicalHistory {
  id: string;
  individualId: string;
  visitDate: string;
  visitType: string;
  chiefComplaint: string;
  diagnosis: string;      // mapped from diagnosis_text
  icd10Code: string | null;  // mapped from diagnosis_code
  severity: string;
  doctorId: string;
  doctorName?: string;
  prescription?: Prescription[];
}

export interface Prescription {
  id: string;
  medicalHistoryId: string;  // mapped from medical_history_id
  drugName: string;          // mapped from medication_name
  dose: string;              // mapped from dosage
  frequency: string;
  durationDays: number;      // mapped from duration_days
  route: string;
  instructions: string | null;
}

export interface VitalsLog {
  id: string;
  individualId: string;    // mapped from individual_id
  recordedAt: string;      // mapped from recorded_at
  systolicBp: number | null;    // mapped from blood_pressure_systolic
  diastolicBp: number | null;   // mapped from blood_pressure_diastolic
  heartRateBpm: number | null;  // mapped from heart_rate
  tempCelsius: number | null;   // mapped from temperature_celsius
  spo2Percent: number | null;   // mapped from oxygen_saturation
  weightKg: number | null;      // mapped from weight_kg
  heightCm: number | null;      // mapped from height_cm
  respiratoryRate: number | null; // mapped from respiratory_rate
  painScale: number | null;     // mapped from pain_scale
  recordedById: string;         // mapped from recorded_by
  recorderName?: string;
}

export interface InjuryLog {
  id: string;
  individualId: string;     // individual_id
  injuryDate: string;       // injury_date
  injuryType: string;       // injury_type
  injuryCause: string;      // cause
  bodyPartAffected: string; // body_part
  notes: string | null;     // notes
  recoveryStatus: string;   // recovery_status
  recorderName?: string;
}

export interface Allergy {
  id: string;
  individualId: string;
  allergen: string;
  reactionType: string;   // anaphylaxis | urticaria | angioedema | rash | gi_distress | respiratory | unknown
  severity: string;       // mild | moderate | severe | life_threatening
  status: string;         // active | resolved | unconfirmed
  confirmedBy: string | null;
  confirmedDate: string | null;
  notes: string | null;
  confirmedByName?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  individualId: string;
  type: 'vitals_critical' | 'vitals_warning' | 'fitness_expired' | 'allergy_alert';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  individual?: { serviceNumber: string; name: string };
}

export interface AnnualMedicalExam {
  id: string;
  individualId: string;
  examDate: string;
  examinerDoctorId: string;
  visionLeft: string | null;
  visionRight: string | null;
  hearingStatus: string;
  bmi: number | null;
  medicalCategory: string;  // SHAPE category: 1A | 1B | 2 | 3 | 4 | 5
  overallFitness: string;   // legacy alias — same as medicalCategory
  // SHAPE individual factor scores (1–5)
  shapeS: number | null;
  shapeH: number | null;
  shapeA: number | null;
  shapeP: number | null;
  shapeE: number | null;
  // COPE coding (0–2, when medicalCategory = '3')
  copeC: number | null;
  copeO: number | null;
  copeP: number | null;
  copeE: number | null;
  remarks: string | null;
  nextExamDue: string | null;
  fitnessValidUntil: string | null;
}

export interface Unit {
  id: string;
  unitName: string;
  parentUnitId: string | null;
}

export interface AnalyticsFitnessSummary {
  unitId: string;
  totalPersonnel: number;
  fit: number;           // 1A + 1B
  monitor: number;       // 2 + 3
  critical: number;      // 5 permanently unfit
  unfit: number;         // 4 temporarily unfit
  readinessScore: number;
  categoryBreakdown: Record<string, number>; // '1A', '1B', '2', '3', '4', '5'
}

export interface AnalyticsInjuryRates {
  month: string;
  count: number;
  topTypes: string[];
}

export interface AnalyticsDeploymentReadiness {
  grade: string;
  score: number;
  breakdown: Record<string, number>;
}

export interface AnalyticsActivityStream {
  unit_name: string;
  unit_id: string;
  period_days: number;
  daily_activity: Array<{
    date: string;
    vitals: number;
    medical_visits: number;
    injuries: number;
    prescriptions: number;
    total: number;
  }>;
  period_totals: {
    total_vitals_entries: number;
    total_medical_visits: number;
    total_injuries: number;
    total_prescriptions: number;
    total_activity: number;
  };
  last_updated: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

// ── Response mappers (snake_case → camelCase) ────────────────────────────────

function mapIndividual(raw: Record<string, unknown>): Individual {
  const unit = raw.unit as { id?: string; unit_name?: string } | undefined;
  const ci = raw.contact_info as Record<string, string> | null | undefined;
  return {
    id: raw.id as string,
    serviceNumber: raw.service_number as string,
    name: raw.name as string,
    rank: (ci?.rank ?? '') as string,
    unitId: (raw.unit_id ?? unit?.id ?? '') as string,
    sex: raw.sex as string,
    dateOfBirth: raw.date_of_birth as string,
    bloodGroup: raw.blood_group as string,
    dutyStatus: (raw.duty_status ?? 'active') as string,
    fitnessStatus: (raw.medical_category ?? raw.fitness_status ?? '') as string,
    medicalCategory: (raw.medical_category ?? raw.fitness_status ?? '') as string,
    heightCm: (raw.height_cm as number | null) ?? null,
    weightKg: (raw.weight_kg as number | null) ?? null,
    photoUrl: (raw.photo_url as string | null) ?? null,
    unit: unit?.unit_name ? { name: unit.unit_name } : undefined,
  };
}

function mapVitalsLog(raw: Record<string, unknown>): VitalsLog {
  return {
    id: raw.id as string,
    individualId: raw.individual_id as string,
    recordedAt: raw.recorded_at as string,
    systolicBp: (raw.blood_pressure_systolic as number | null) ?? null,
    diastolicBp: (raw.blood_pressure_diastolic as number | null) ?? null,
    heartRateBpm: (raw.heart_rate as number | null) ?? null,
    tempCelsius: raw.temperature_celsius != null ? Number(raw.temperature_celsius) : null,
    spo2Percent: (raw.oxygen_saturation as number | null) ?? null,
    weightKg: raw.weight_kg != null ? Number(raw.weight_kg) : null,
    heightCm: raw.height_cm != null ? Number(raw.height_cm) : null,
    respiratoryRate: (raw.respiratory_rate as number | null) ?? null,
    painScale: (raw.pain_scale as number | null) ?? null,
    recordedById: raw.recorded_by as string,
    recorderName: (raw.recorder as { username?: string } | null)?.username ?? undefined,
  };
}

function mapPrescription(raw: Record<string, unknown>): Prescription {
  return {
    id: raw.id as string,
    medicalHistoryId: raw.medical_history_id as string,
    drugName: raw.medication_name as string,
    dose: raw.dosage as string,
    frequency: raw.frequency as string,
    durationDays: raw.duration_days as number,
    route: raw.route as string,
    instructions: (raw.instructions as string | null) ?? null,
  };
}

function mapMedicalHistory(raw: Record<string, unknown>): MedicalHistory {
  const prescriptions = Array.isArray(raw.prescriptions)
    ? (raw.prescriptions as Record<string, unknown>[]).map(mapPrescription)
    : [];
  return {
    id: raw.id as string,
    individualId: raw.individual_id as string,
    visitDate: raw.visit_date as string,
    visitType: raw.visit_type as string,
    chiefComplaint: (raw.chief_complaint as string) ?? '',
    diagnosis: raw.diagnosis_text as string,
    icd10Code: (raw.diagnosis_code as string | null) ?? null,
    severity: raw.severity as string,
    doctorId: raw.doctor_id as string,
    doctorName: (raw.doctor as { username?: string } | null)?.username ?? undefined,
    prescription: prescriptions,
  };
}

function mapInjuryLog(raw: Record<string, unknown>): InjuryLog {
  return {
    id: raw.id as string,
    individualId: raw.individual_id as string,
    injuryDate: raw.injury_date as string,
    injuryType: raw.injury_type as string,
    injuryCause: raw.cause as string,
    bodyPartAffected: raw.body_part as string,
    notes: (raw.notes as string | null) ?? null,
    recoveryStatus: raw.recovery_status as string,
    recorderName: (raw.recorder as { username?: string } | null)?.username ?? undefined,
  };
}

function mapAllergy(raw: Record<string, unknown>): Allergy {
  return {
    id: raw.id as string,
    individualId: raw.individual_id as string,
    allergen: raw.allergen as string,
    reactionType: raw.reaction_type as string,
    severity: raw.severity as string,
    status: raw.status as string,
    confirmedBy: (raw.confirmed_by as string | null) ?? null,
    confirmedDate: (raw.confirmed_date as string | null) ?? null,
    notes: (raw.notes as string | null) ?? null,
    confirmedByName: (raw.confirming_doctor as { username?: string } | null)?.username ?? undefined,
    createdAt: raw.created_at as string,
  };
}

function mapNotification(raw: Record<string, unknown>): Notification {
  const ind = raw.individual as { service_number?: string; name?: string } | null;
  return {
    id: raw.id as string,
    recipientId: raw.recipient_id as string,
    individualId: raw.individual_id as string,
    type: raw.type as Notification['type'],
    title: raw.title as string,
    message: raw.message as string,
    isRead: raw.is_read as boolean,
    createdAt: raw.created_at as string,
    readAt: (raw.read_at as string | null) ?? null,
    individual: ind ? { serviceNumber: ind.service_number ?? '', name: ind.name ?? '' } : undefined,
  };
}

function mapAnnualExam(raw: Record<string, unknown>): AnnualMedicalExam {
  const cat = (raw.medical_category ?? raw.fitness_status ?? '') as string;
  return {
    id: raw.id as string,
    individualId: raw.individual_id as string,
    examDate: raw.exam_date as string,
    examinerDoctorId: raw.examining_officer_id as string,
    visionLeft: (raw.vision_left as string | null) ?? null,
    visionRight: (raw.vision_right as string | null) ?? null,
    hearingStatus: raw.hearing_status as string,
    bmi: raw.bmi != null ? Number(raw.bmi) : null,
    medicalCategory: cat,
    overallFitness: cat,  // legacy alias
    shapeS: (raw.shape_s as number | null) ?? null,
    shapeH: (raw.shape_h as number | null) ?? null,
    shapeA: (raw.shape_a as number | null) ?? null,
    shapeP: (raw.shape_p as number | null) ?? null,
    shapeE: (raw.shape_e as number | null) ?? null,
    copeC: (raw.cope_c as number | null) ?? null,
    copeO: (raw.cope_o as number | null) ?? null,
    copeP: (raw.cope_p as number | null) ?? null,
    copeE: (raw.cope_e as number | null) ?? null,
    remarks: (raw.remarks as string | null) ?? null,
    nextExamDue: (raw.fitness_valid_until as string | null) ?? null,
    fitnessValidUntil: (raw.fitness_valid_until as string | null) ?? null,
  };
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = tokenStore.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE}${path}`;
    const method = (options.method || 'GET').toUpperCase();

    // ── Offline write interception ──────────────────────────────────────────
    // If offline and method is POST/PUT/PATCH, enqueue instead of fetch
    if (
      typeof window !== 'undefined'
      && !navigator.onLine
      && ['POST', 'PUT', 'PATCH'].includes(method)
    ) {
      try {
        // Dynamically import to avoid circular dependency at module load
        const { enqueueOfflineRequest } = await import('./syncManager');
        await enqueueOfflineRequest(fullUrl, method, options.body);

        // Return a synthetic queued response
        return {
          queued: true,
          offline: true,
        } as unknown as T;
      } catch (err) {
        console.error('[API] Offline enqueue failed:', err);
        throw new Error('Failed to queue request for offline sync');
      }
    }

    const res = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // send refresh-token cookie
    });

    // Auto-refresh on 401
    if (res.status === 401 && retry) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request<T>(path, options, false);
      }
      tokenStore.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }

    const json = await res.json();

    if (!res.ok) {
      // Backend returns { error: "message string", code: "..." }
      // Handle both string and object error formats
      const errMsg = typeof json.error === 'string'
        ? json.error
        : json.error?.message;
      throw new Error(errMsg ?? `HTTP ${res.status}`);
    }

    return json.data !== undefined ? json.data : json;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (json.data?.accessToken) {
        tokenStore.set(json.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<AuthTokens> {
    return this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    tokenStore.clear();
  }

  async getMe(): Promise<UserInfo> {
    return this.request<UserInfo>('/auth/me');
  }

  // ── Individuals ───────────────────────────────────────────────────────────

  async listIndividuals(params?: {
    page?: number;
    limit?: number;
    search?: string;
    unitId?: string;
    fitnessStatus?: string;
    dutyStatus?: string;
  }): Promise<PaginatedResponse<Individual>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.unitId) qs.set('unitId', params.unitId);
    if (params?.fitnessStatus) qs.set('fitnessStatus', params.fitnessStatus);
    if (params?.dutyStatus) qs.set('dutyStatus', params.dutyStatus);
    const res = await this.request<{ data: Record<string, unknown>[]; pagination: PaginatedResponse<Individual>['pagination'] }>(`/individuals?${qs}`);
    return {
      data: (res.data ?? []).map(mapIndividual),
      pagination: res.pagination,
    };
  }

  async getIndividual(serviceNumber: string): Promise<Individual> {
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}`);
    return mapIndividual(raw);
  }

  async createIndividual(data: Partial<Individual>): Promise<Individual> {
    const raw = await this.request<Record<string, unknown>>('/individuals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapIndividual(raw);
  }

  async updateIndividual(serviceNumber: string, data: Partial<Individual>): Promise<Individual> {
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapIndividual(raw);
  }

  async uploadIndividualPhoto(serviceNumber: string, photoUrl: string): Promise<void> {
    await this.request(`/individuals/${serviceNumber}/photo`, {
      method: 'PATCH',
      body: JSON.stringify({ photo_url: photoUrl }),
    });
  }

  // ── Medical History ───────────────────────────────────────────────────────

  async listMedicalHistory(serviceNumber: string): Promise<PaginatedResponse<MedicalHistory>> {
    const res = await this.request<{ data: Record<string, unknown>[]; pagination: PaginatedResponse<MedicalHistory>['pagination'] }>(`/individuals/${serviceNumber}/medical-history`);
    return {
      data: (res.data ?? []).map(mapMedicalHistory),
      pagination: res.pagination,
    };
  }

  async createMedicalRecord(serviceNumber: string, data: Partial<MedicalHistory>): Promise<MedicalHistory> {
    const body = {
      visit_date: data.visitDate,
      visit_type: data.visitType,
      chief_complaint: data.chiefComplaint,
      symptoms: [],
      diagnosis_code: data.icd10Code ?? '',
      diagnosis_text: data.diagnosis,
      severity: data.severity,
    };
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}/medical-history`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapMedicalHistory(raw);
  }

  async updateMedicalRecord(serviceNumber: string, id: string, data: Partial<MedicalHistory>): Promise<MedicalHistory> {
    const body = {
      visit_date: data.visitDate,
      visit_type: data.visitType,
      chief_complaint: data.chiefComplaint,
      diagnosis_code: data.icd10Code,
      diagnosis_text: data.diagnosis,
      severity: data.severity,
      notes: (data as Record<string, unknown>).notes,
    };
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}/medical-history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return mapMedicalHistory(raw);
  }

  // ── Vitals ────────────────────────────────────────────────────────────────

  async listVitals(serviceNumber: string, params?: { from?: string; to?: string }): Promise<PaginatedResponse<VitalsLog>> {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const res = await this.request<{ data: Record<string, unknown>[]; pagination: PaginatedResponse<VitalsLog>['pagination'] }>(`/individuals/${serviceNumber}/vitals?${qs}`);
    return {
      data: (res.data ?? []).map(mapVitalsLog),
      pagination: res.pagination,
    };
  }

  async logVitals(serviceNumber: string, data: Partial<VitalsLog>): Promise<VitalsLog> {
    const body = {
      recorded_at: data.recordedAt ?? new Date().toISOString(),
      blood_pressure_systolic: data.systolicBp ?? null,
      blood_pressure_diastolic: data.diastolicBp ?? null,
      heart_rate: data.heartRateBpm ?? null,
      temperature_celsius: data.tempCelsius ?? null,
      oxygen_saturation: data.spo2Percent ?? null,
      weight_kg: data.weightKg ?? null,
      height_cm: data.heightCm ?? null,
    };
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}/vitals`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapVitalsLog(raw);
  }

  // ── Injuries ──────────────────────────────────────────────────────────────

  async listInjuries(serviceNumber: string): Promise<PaginatedResponse<InjuryLog>> {
    const res = await this.request<{ data: Record<string, unknown>[]; pagination: PaginatedResponse<InjuryLog>['pagination'] }>(`/individuals/${serviceNumber}/injuries`);
    return {
      data: (res.data ?? []).map(mapInjuryLog),
      pagination: res.pagination,
    };
  }

  async logInjury(serviceNumber: string, data: Partial<InjuryLog>): Promise<InjuryLog> {
    const body = {
      injury_date: data.injuryDate,
      injury_type: data.injuryType,
      body_part: data.bodyPartAffected,
      cause: data.injuryCause,
      recovery_status: data.recoveryStatus ?? 'active',
      duty_status: 'active',
      notes: data.notes ?? null,
    };
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}/injuries`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapInjuryLog(raw);
  }

  // ── Allergies ─────────────────────────────────────────────────────────────

  async listAllergies(serviceNumber: string): Promise<PaginatedResponse<Allergy>> {
    const res = await this.request<{ data: Record<string, unknown>[]; pagination: PaginatedResponse<Allergy>['pagination'] }>(`/individuals/${serviceNumber}/allergies`);
    return {
      data: (res.data ?? []).map(mapAllergy),
      pagination: res.pagination,
    };
  }

  async createAllergy(serviceNumber: string, data: {
    allergen: string;
    reactionType: string;
    severity: string;
    status?: string;
    notes?: string;
  }): Promise<Allergy> {
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}/allergies`, {
      method: 'POST',
      body: JSON.stringify({
        allergen: data.allergen,
        reaction_type: data.reactionType,
        severity: data.severity,
        status: data.status ?? 'active',
        notes: data.notes ?? null,
      }),
    });
    return mapAllergy(raw);
  }

  async updateAllergyStatus(serviceNumber: string, allergyId: string, status: string): Promise<Allergy> {
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}/allergies/${allergyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return mapAllergy(raw);
  }

  // ── Prescriptions ─────────────────────────────────────────────────────────

  async listPrescriptions(serviceNumber: string): Promise<PaginatedResponse<Prescription>> {
    const res = await this.request<{ data: Record<string, unknown>[]; pagination: PaginatedResponse<Prescription>['pagination'] }>(`/individuals/${serviceNumber}/prescriptions`);
    return {
      data: (res.data ?? []).map(mapPrescription),
      pagination: res.pagination,
    };
  }

  async createPrescription(serviceNumber: string, medicalHistoryId: string, data: Partial<Prescription>): Promise<Prescription> {
    const body = {
      medical_history_id: medicalHistoryId,
      medication_name: data.drugName,
      dosage: data.dose,
      frequency: data.frequency,
      duration_days: data.durationDays,
      route: data.route,
      instructions: data.instructions ?? null,
    };
    const raw = await this.request<Record<string, unknown>>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapPrescription(raw);
  }

  async deactivatePrescription(id: string): Promise<void> {
    await this.request(`/prescriptions/${id}`, { method: 'DELETE' });
  }

  // ── Annual Exam ───────────────────────────────────────────────────────────

  async listAnnualExams(serviceNumber: string): Promise<PaginatedResponse<AnnualMedicalExam>> {
    const res = await this.request<{ data: Record<string, unknown>[]; pagination: PaginatedResponse<AnnualMedicalExam>['pagination'] }>(`/individuals/${serviceNumber}/annual-exam`);
    return {
      data: (res.data ?? []).map(mapAnnualExam),
      pagination: res.pagination,
    };
  }

  async createAnnualExam(serviceNumber: string, data: Partial<AnnualMedicalExam>): Promise<AnnualMedicalExam> {
    const body = {
      exam_date: data.examDate,
      medical_category: data.medicalCategory ?? data.overallFitness,
      fitness_valid_until: data.fitnessValidUntil,
      bmi: data.bmi,
      vision_left: data.visionLeft,
      vision_right: data.visionRight,
      hearing_status: data.hearingStatus,
      shape_s: data.shapeS,
      shape_h: data.shapeH,
      shape_a: data.shapeA,
      shape_p: data.shapeP,
      shape_e: data.shapeE,
      cope_c: data.copeC,
      cope_o: data.copeO,
      cope_p: data.copeP,
      cope_e: data.copeE,
      remarks: data.remarks,
    };
    const raw = await this.request<Record<string, unknown>>(`/individuals/${serviceNumber}/annual-exam`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapAnnualExam(raw);
  }

  // ── Analytics (Commander — zero PII) ─────────────────────────────────────

  async getFitnessSummary(unitId: string): Promise<AnalyticsFitnessSummary> {
    const raw = await this.request<{
      unit_id: string;
      fitness_summary: {
        fit: number;
        temporarily_unfit: number;
        permanently_unfit: number;
        monitor: number;
        total: number;
        pct_deployable: number;
        category_breakdown: Record<string, number>;
      };
    }>(`/analytics/unit/${unitId}/fitness-summary`);
    return {
      unitId: raw.unit_id,
      totalPersonnel: raw.fitness_summary.total,
      fit: raw.fitness_summary.fit,
      monitor: raw.fitness_summary.monitor ?? raw.fitness_summary.temporarily_unfit,
      critical: raw.fitness_summary.permanently_unfit,
      unfit: raw.fitness_summary.temporarily_unfit,
      readinessScore: Math.round(raw.fitness_summary.pct_deployable),
      categoryBreakdown: raw.fitness_summary.category_breakdown ?? {},
    };
  }

  async getInjuryRates(params?: { unitId?: string; months?: number }): Promise<AnalyticsInjuryRates[]> {
    if (!params?.unitId) return [];
    const raw = await this.request<{
      monthly: Array<{ month: string; count: number; top_types: string[] }>;
    }>(`/analytics/unit/${params.unitId}/injury-rates`);
    return (raw.monthly ?? []).map((m) => ({
      month: m.month,
      count: m.count,
      topTypes: m.top_types ?? [],
    }));
  }

  async getDeploymentReadiness(unitId: string): Promise<AnalyticsDeploymentReadiness> {
    const raw = await this.request<{
      total_personnel: number;
      deployable: number;
      non_duty: number;
      permanently_unfit: number;
      readiness_score: number;
      readiness_grade: string;
    }>(`/analytics/unit/${unitId}/deployment-readiness`);
    return {
      grade: raw.readiness_grade,
      score: Math.round(raw.readiness_score),
      breakdown: {
        deployable: raw.deployable,
        non_duty: raw.non_duty,
        permanently_unfit: raw.permanently_unfit,
        total: raw.total_personnel,
      },
    };
  }

  async getDiseaseTrends(unitId: string): Promise<Array<{ diagnosis_code: string; count: number }>> {
    const raw = await this.request<{ trends: Array<{ diagnosis_code: string; count: number }> }>(
      `/analytics/unit/${unitId}/disease-trends`
    );
    return raw.trends ?? [];
  }

  async getUnitActivityStream(unitId: string): Promise<AnalyticsActivityStream> {
    return this.request<AnalyticsActivityStream>(
      `/analytics/unit/${unitId}/activity-stream`
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listUsers(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<UserInfo>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return this.request<PaginatedResponse<UserInfo>>(`/admin/users?${qs}`);
  }

  async createUser(data: {
    username: string;
    password: string;
    email?: string;
    role: UserRole;
    unitId: string;
  }): Promise<UserInfo> {
    return this.request<UserInfo>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminUpdateUser(id: string, data: { username?: string; password?: string; role?: UserRole; is_active?: boolean }): Promise<UserInfo> {
    return this.request<UserInfo>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changeMyCredentials(data: { currentPassword: string; newUsername?: string; newPassword?: string }): Promise<{ id: string; username: string; role: string }> {
    return this.request('/auth/me/credentials', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async listAuditLogs(params?: { page?: number; limit?: number; userId?: string }): Promise<PaginatedResponse<Record<string, unknown>>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.userId) qs.set('userId', params.userId);
    return this.request(`/admin/audit-logs?${qs}`);
  }

  async listUnits(): Promise<Unit[]> {
    const raw = await this.request<Array<{ id: string; unit_name: string; parent_unit_id: string | null }>>('/units');
    return (Array.isArray(raw) ? raw : (raw as any).data ?? []).map((u: { id: string; unit_name: string; parent_unit_id: string | null }) => ({
      id: u.id,
      unitName: u.unit_name,
      parentUnitId: u.parent_unit_id,
    }));
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  async listNotifications(params?: { unreadOnly?: boolean; page?: number; limit?: number }): Promise<{ data: Notification[]; unreadCount: number }> {
    const qs = new URLSearchParams();
    if (params?.unreadOnly) qs.set('unread_only', 'true');
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const res = await this.request<{ data: Record<string, unknown>[]; meta: { unreadCount: number } }>(`/notifications?${qs}`);
    return {
      data: (res.data ?? []).map(mapNotification),
      unreadCount: res.meta?.unreadCount ?? 0,
    };
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const raw = await this.request<Record<string, unknown>>(`/notifications/${id}/read`, { method: 'PATCH' });
    return mapNotification(raw);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/read-all', { method: 'PATCH' });
  }
}

export const api = new ApiClient();

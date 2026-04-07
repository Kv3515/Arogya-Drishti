import { z } from 'zod';

// ─── Auth Validators ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(256),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Individual Validators ──────────────────────────────────────────────────────

export const createIndividualSchema = z.object({
  service_number: z.string().min(1).max(50).regex(/^[A-Za-z0-9\-]+$/, 'Service number must be alphanumeric'),
  name: z.string().min(1).max(255),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  sex: z.enum(['male', 'female', 'other']),
  blood_group: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']),
  unit_id: z.string().uuid(),
  contact_info: z.record(z.string(), z.unknown()).optional(),
});

export const updateIndividualSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  blood_group: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']).optional(),
  unit_id: z.string().uuid().optional(),
  contact_info: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

// ─── Medical History Validators ─────────────────────────────────────────────────

// ICD-10-CM format: letter + 2 digits + optional dot + up to 4 more chars
const icd10Regex = /^[A-Z]\d{2}(\.\d{1,4})?$/;

export const createMedicalHistorySchema = z.object({
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visit_type: z.enum(['OPD', 'emergency', 'annual', 'field', 'telemedicine']),
  chief_complaint: z.string().max(1000).optional(),
  symptoms: z.array(z.object({
    code: z.string(),
    description: z.string(),
  })).min(1),
  diagnosis_code: z.string().regex(icd10Regex, 'Must be valid ICD-10-CM code (e.g., I10, E11.9)'),
  diagnosis_text: z.string().min(1).max(500),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']),
  is_sensitive: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export const updateMedicalHistorySchema = z.object({
  chief_complaint: z.string().max(1000).optional(),
  symptoms: z.array(z.object({
    code: z.string(),
    description: z.string(),
  })).optional(),
  diagnosis_code: z.string().regex(icd10Regex).optional(),
  diagnosis_text: z.string().min(1).max(500).optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
  is_sensitive: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

// ─── Vitals Validators ──────────────────────────────────────────────────────────

export const createVitalsSchema = z.object({
  recorded_at: z.string().datetime(),
  blood_pressure_systolic: z.number().int().min(60).max(200).optional(),
  blood_pressure_diastolic: z.number().int().min(30).max(150).optional(),
  heart_rate: z.number().int().min(30).max(200).optional(),
  temperature_celsius: z.number().min(35).max(42).optional(),
  oxygen_saturation: z.number().int().min(70).max(100).optional(),
  weight_kg: z.number().min(20).max(300).optional(),
  height_cm: z.number().min(50).max(250).optional(),
  respiratory_rate: z.number().int().min(8).max(40).optional(),
  pain_scale: z.number().int().min(0).max(10).optional(),
});

// ─── Injury Validators ──────────────────────────────────────────────────────────

export const createInjurySchema = z.object({
  injury_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  injury_type: z.enum(['fracture', 'laceration', 'burn', 'contusion', 'sprain', 'blast', 'other']),
  body_part: z.string().min(1).max(100),
  cause: z.enum(['combat', 'training', 'accident', 'sports', 'other']),
  recovery_status: z.enum(['active', 'recovering', 'recovered', 'chronic']),
  duty_status: z.enum(['full_duty', 'light_duty', 'non_duty', 'hospitalized']),
  notes: z.string().max(2000).optional(),
});

export const updateInjurySchema = z.object({
  recovery_status: z.enum(['active', 'recovering', 'recovered', 'chronic']).optional(),
  duty_status: z.enum(['full_duty', 'light_duty', 'non_duty', 'hospitalized']).optional(),
  notes: z.string().max(2000).optional(),
});

// ─── Prescription Validators ────────────────────────────────────────────────────

export const createPrescriptionSchema = z.object({
  medication_name: z.string().min(1).max(255),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  duration_days: z.number().int().min(1).max(365),
  route: z.enum(['oral', 'IV', 'IM', 'topical', 'inhaled', 'other']),
  instructions: z.string().max(1000).optional(),
});

// ─── Annual Exam Validators ─────────────────────────────────────────────────────
// Medical categories per AO 9/2011 DGMS (SHAPE classification system)
// 1A=fit all duties, 1B=fit with observation, 2=limited duties, 3=sedentary/COPE,
// 4=temporarily unfit (hospitalised), 5=permanently unfit

export const createAnnualExamSchema = z.object({
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  medical_category: z.enum(['1A', '1B', '2', '3', '4', '5']),
  fitness_valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bmi: z.number().min(10).max(60).optional(),
  vision_left: z.string().max(20).optional(),
  vision_right: z.string().max(20).optional(),
  hearing_status: z.enum(['normal', 'impaired', 'deaf']),
  // SHAPE individual factor scores (1–5 each)
  shape_s: z.number().int().min(1).max(5).optional(),
  shape_h: z.number().int().min(1).max(5).optional(),
  shape_a: z.number().int().min(1).max(5).optional(),
  shape_p: z.number().int().min(1).max(5).optional(),
  shape_e: z.number().int().min(1).max(5).optional(),
  // COPE coding (0–2 each, applicable when category = 3)
  cope_c: z.number().int().min(0).max(2).optional(),
  cope_o: z.number().int().min(0).max(2).optional(),
  cope_p: z.number().int().min(0).max(2).optional(),
  cope_e: z.number().int().min(0).max(2).optional(),
  lab_results: z.record(z.string(), z.unknown()).optional(),
  remarks: z.string().max(2000).optional(),
});

// ─── User Management Validators ─────────────────────────────────────────────────

export const createUserSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(12).max(256)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain special character'),
  role: z.enum(['super_admin', 'medical_officer', 'paramedic', 'commander', 'individual']),
  linked_individual_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
});

// ─── Query Parameter Validators ─────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
});

export const searchSchema = z.object({
  search: z.string().min(3).max(50).regex(/^[A-Za-z0-9\-\s]+$/).optional(),
  unitId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
});

// ─── Validate middleware factory ─────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
        meta: { timestamp: new Date().toISOString(), requestId: req.headers['x-request-id'] || '' },
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}

'use client';

import { useState, FormEvent } from 'react';
import {
  Plus, ChevronDown, ChevronUp, Calendar, ShieldCheck,
  Eye, Ear, Scale, Activity, FlaskConical, Heart,
  Brain, Dumbbell, Info,
} from 'lucide-react';
import { api, type AnnualMedicalExam, type Individual } from '@/lib/api';

// ── SHAPE Medical Category definitions (AO 9/2011 DGMS) ─────────────────────────
export const SHAPE_CATEGORIES = [
  { value: '1A', label: 'Category 1A', desc: 'Fit for all duties anywhere', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: '1B', label: 'Category 1B', desc: 'Fit for all duties, under medical observation (no employability restriction)', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { value: '2',  label: 'Category 2',  desc: 'Fit for all duties — limited by stress, hearing or vision acuity', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: '3',  label: 'Category 3',  desc: 'Fit for routine / sedentary duties only — COPE coding required', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: '4',  label: 'Category 4',  desc: 'Temporarily unfit — hospitalised', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: '5',  label: 'Category 5',  desc: 'Permanently unfit for military duties', color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

export type MedicalCategory = '1A' | '1B' | '2' | '3' | '4' | '5';

export function getCategoryStyle(cat: string) {
  return SHAPE_CATEGORIES.find((c) => c.value === cat) ?? {
    value: cat, label: `Category ${cat}`, desc: '', color: 'bg-gray-100 text-gray-700 border-gray-300',
  };
}

/**
 * Formats individual SHAPE factor scores into the standard Indian Army notation.
 * All grade-1 → "SHAPE 1"
 * Any grade > 1 → inline, e.g. S=1 H=1 A=2 P=1 E=1 → "SHA2PE"
 * All null (no data recorded) → null
 */
export function formatShapeCode(
  s: number | null, h: number | null, a: number | null, p: number | null, e: number | null
): string | null {
  const vals = [s, h, a, p, e];
  if (vals.every((v) => v === null)) return null;               // no data
  if (vals.every((v) => v === null || v === 1)) return 'SHAPE 1'; // all grade 1
  const letters = ['S', 'H', 'A', 'P', 'E'];
  return letters.map((letter, i) => {
    const v = vals[i];
    if (v === null || v === 1) return letter;
    return `${letter}${v}`;
  }).join('');
}

const SHAPE_FACTORS = [
  { key: 'shapeS' as const, letter: 'S', label: 'Psychological / Cognitive', Icon: Brain },
  { key: 'shapeH' as const, letter: 'H', label: 'Hearing',                   Icon: Ear },
  { key: 'shapeA' as const, letter: 'A', label: 'Appendages (Limbs)',         Icon: Dumbbell },
  { key: 'shapeP' as const, letter: 'P', label: 'Physical Capacity',          Icon: Activity },
  { key: 'shapeE' as const, letter: 'E', label: 'Eye Sight',                  Icon: Eye },
];

const COPE_FACTORS = [
  { key: 'copeC' as const, letter: 'C', label: 'Climate & Terrain restrictions' },
  { key: 'copeO' as const, letter: 'O', label: 'Medical observation required' },
  { key: 'copeP' as const, letter: 'P', label: 'Physical capability limitations' },
  { key: 'copeE' as const, letter: 'E', label: 'Exclusive limitations (disease-specific)' },
];

const SCORE_1_5 = [1, 2, 3, 4, 5] as const;
const SCORE_0_2 = [0, 1, 2] as const;
const HEARING_OPTIONS = ['normal', 'impaired', 'deaf'] as const;

interface DoctorExamCardProps {
  individual: Individual;
  exams: AnnualMedicalExam[];
  onExamAdded: (exam: AnnualMedicalExam) => void;
}

interface ExamForm {
  examDate: string;
  examType: 'AME' | 'PME';
  medicalCategory: MedicalCategory;
  fitnessValidUntil: string;
  shapeS: number | null; shapeH: number | null; shapeA: number | null;
  shapeP: number | null; shapeE: number | null;
  copeC: number | null; copeO: number | null; copeP: number | null; copeE: number | null;
  weightKg: string; bmi: string; waistCm: string; chestCm: string;
  systolicBp: string; diastolicBp: string; heartRateBpm: string;
  spo2Percent: string; respiratoryRate: string;
  visionLeft: string; visionRight: string; hearingStatus: string;
  hbPercent: string; tlcDlc: string; bloodSugarFasting: string; bloodSugarPP: string;
  uricAcid: string; creatinine: string; cholesterolTotal: string; lipidProfile: string;
  urineRE: string; restingECG: string; xrayChest: string;
  gynaecologyNotes: string; remarks: string;
}

const defaultForm = (): ExamForm => ({
  examDate: new Date().toISOString().split('T')[0],
  examType: 'AME', medicalCategory: '1A', fitnessValidUntil: '',
  shapeS: null, shapeH: null, shapeA: null, shapeP: null, shapeE: null,
  copeC: null, copeO: null, copeP: null, copeE: null,
  weightKg: '', bmi: '', waistCm: '', chestCm: '',
  systolicBp: '', diastolicBp: '', heartRateBpm: '', spo2Percent: '', respiratoryRate: '',
  visionLeft: '', visionRight: '', hearingStatus: 'normal',
  hbPercent: '', tlcDlc: '', bloodSugarFasting: '', bloodSugarPP: '',
  uricAcid: '', creatinine: '', cholesterolTotal: '', lipidProfile: '',
  urineRE: '', restingECG: '', xrayChest: '', gynaecologyNotes: '', remarks: '',
});

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="col-span-full flex items-center gap-2 pt-3 pb-1 border-b border-gray-200/70 mt-1">
      <Icon className="h-3.5 w-3.5 text-gray-400" />
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function FormField({ label, children, required, colSpan }: {
  label: string; children: React.ReactNode; required?: boolean; colSpan?: string;
}) {
  return (
    <div className={colSpan}>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function DoctorExamCard({ individual, exams, onExamAdded }: DoctorExamCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<ExamForm>(defaultForm());

  const update = (k: keyof ExamForm, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const showCOPE = form.medicalCategory === '3';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // ── SHAPE score ↔ Category cross-validation ─────────────────────────────
    const scores = [form.shapeS, form.shapeH, form.shapeA, form.shapeP, form.shapeE].filter((v) => v !== null) as number[];
    if (scores.length > 0) {
      const maxScore = Math.max(...scores);
      const cat = form.medicalCategory;
      // Cat 1A/1B: all scores must be 1 or 2
      if (['1A', '1B'].includes(cat) && maxScore >= 3) {
        setError(`Category ${cat} requires all SHAPE scores ≤ 2. Current max score is ${maxScore}.`);
        return;
      }
      // Cat 3: at least one score must be ≥ 3
      if (cat === '3' && maxScore < 3) {
        setError('Category 3 requires at least one SHAPE factor score ≥ 3.');
        return;
      }
      // Cat 4: at least one score must be 4
      if (cat === '4' && maxScore < 4) {
        setError('Category 4 requires at least one SHAPE factor score of 4.');
        return;
      }
      // Cat 5: at least one score must be 5
      if (cat === '5' && maxScore < 5) {
        setError('Category 5 requires at least one SHAPE factor score of 5.');
        return;
      }
    }

    setSaving(true);
    try {
      const labResults: Record<string, string> = {};
      const labMap: [string, string][] = [
        ['hbPercent', form.hbPercent], ['tlcDlc', form.tlcDlc],
        ['bloodSugarFasting', form.bloodSugarFasting], ['bloodSugarPP', form.bloodSugarPP],
        ['uricAcid', form.uricAcid], ['creatinine', form.creatinine],
        ['cholesterolTotal', form.cholesterolTotal], ['lipidProfile', form.lipidProfile],
        ['urineRE', form.urineRE], ['restingECG', form.restingECG], ['xrayChest', form.xrayChest],
        ['systolicBp', form.systolicBp], ['diastolicBp', form.diastolicBp],
        ['heartRateBpm', form.heartRateBpm], ['spo2Percent', form.spo2Percent],
        ['waistCm', form.waistCm], ['chestCm', form.chestCm],
      ];
      if (form.examType === 'PME' && form.gynaecologyNotes) labMap.push(['gynaecologyNotes', form.gynaecologyNotes]);
      labMap.forEach(([k, v]) => { if (v) labResults[k] = v; });

      const exam = await api.createAnnualExam(individual.serviceNumber, {
        examDate: form.examDate,
        medicalCategory: form.medicalCategory,
        fitnessValidUntil: form.fitnessValidUntil || null,
        visionLeft: form.visionLeft || null,
        visionRight: form.visionRight || null,
        hearingStatus: form.hearingStatus,
        bmi: form.bmi ? parseFloat(form.bmi) : null,
        shapeS: form.shapeS, shapeH: form.shapeH, shapeA: form.shapeA,
        shapeP: form.shapeP, shapeE: form.shapeE,
        copeC: showCOPE ? form.copeC : null, copeO: showCOPE ? form.copeO : null,
        copeP: showCOPE ? form.copeP : null, copeE: showCOPE ? form.copeE : null,
        remarks: [form.examType, Object.keys(labResults).length ? 'lab results recorded' : '', form.remarks]
          .filter(Boolean).join(' | ') || null,
      });
      onExamAdded(exam);
      setShowForm(false);
      setForm(defaultForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exam.');
    } finally {
      setSaving(false);
    }
  };

  const sortedExams = [...exams].sort(
    (a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
  );

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Medical Category (SHAPE System)</h3>
            <p className="text-xs text-gray-400">
              {exams.length} assessment{exams.length !== 1 ? 's' : ''} · AO 9/2011 DGMS
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(null); }}
          className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Cancel' : 'Record Assessment'}
        </button>
      </div>

      <div className="px-6 pb-6 pt-5 space-y-5">
        {error && (
          <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">{error}</div>
        )}

        {/* ── ASSESSMENT FORM ─────────────────────────── */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-50/60 border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">New Medical Category Assessment</p>
            <p className="text-xs text-slate-500 mb-5">
              Set the soldier's SHAPE medical category per AO 9/2011/DGMS.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">

              {/* Exam basics */}
              <SectionHeading icon={Calendar} label="Examination Details" />
              <FormField label="Exam Type" required>
                <div className="flex gap-2">
                  {(['AME', 'PME'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => update('examType', t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.examType === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}>{t}</button>
                  ))}
                </div>
              </FormField>
              <FormField label="Exam Date" required>
                <input type="date" value={form.examDate} onChange={(e) => update('examDate', e.target.value)} className="input input-sm" required />
              </FormField>
              <FormField label="Valid Until">
                <input type="date" value={form.fitnessValidUntil} onChange={(e) => update('fitnessValidUntil', e.target.value)} className="input input-sm" />
              </FormField>

              {/* Overall Category */}
              <SectionHeading icon={ShieldCheck} label="SHAPE Medical Category" />
              <div className="col-span-full">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Overall Category <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SHAPE_CATEGORIES.map((cat) => (
                    <button key={cat.value} type="button" onClick={() => update('medicalCategory', cat.value)}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                        form.medicalCategory === cat.value
                          ? cat.color + ' border-current shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      <div className="font-bold text-sm">{cat.label}</div>
                      <div className="text-[11px] mt-0.5 opacity-80 leading-tight">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SHAPE Factor Scores */}
              <SectionHeading icon={Activity} label="SHAPE Factor Scores (1–5)" />
              <div className="col-span-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[11px] text-gray-500">
                    1–2 = Fit &nbsp;·&nbsp; 3 = Sedentary only &nbsp;·&nbsp; 4 = Temp unfit &nbsp;·&nbsp; 5 = Perm unfit
                  </span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {SHAPE_FACTORS.map(({ key, letter, label, Icon }) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">{letter} — {label}</span>
                      </div>
                      <div className="flex gap-1">
                        {SCORE_1_5.map((n) => (
                          <button key={n} type="button"
                            onClick={() => update(key, form[key] === n ? null : n)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                              form[key] === n
                                ? n <= 2 ? 'bg-emerald-500 text-white border-emerald-500'
                                  : n === 3 ? 'bg-amber-500 text-white border-amber-500'
                                  : n === 4 ? 'bg-orange-500 text-white border-orange-500'
                                  : 'bg-red-500 text-white border-red-500'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COPE Coding — only for Category 3 */}
              {showCOPE && (
                <>
                  <SectionHeading icon={ShieldCheck} label="COPE Coding (required for Category 3)" />
                  <div className="col-span-full bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                    <div className="px-3 py-2 bg-amber-100 flex items-center gap-2 border-b border-amber-200">
                      <Info className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[11px] text-amber-700 font-medium">
                        0 = No restriction &nbsp;·&nbsp; 1 = Moderate &nbsp;·&nbsp; 2 = Severe restriction
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {COPE_FACTORS.map(({ key, letter, label }) => (
                        <div key={key} className="space-y-1.5">
                          <span className="text-xs font-bold text-gray-700">{letter} — {label}</span>
                          <div className="flex gap-1.5">
                            {SCORE_0_2.map((n) => (
                              <button key={n} type="button"
                                onClick={() => update(key, form[key] === n ? null : n)}
                                className={`w-9 h-8 rounded-lg text-xs font-bold border transition-all ${
                                  form[key] === n
                                    ? n === 0 ? 'bg-emerald-500 text-white border-emerald-500'
                                      : n === 1 ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-red-500 text-white border-red-500'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'
                                }`}
                              >{n}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Clinical Measurements */}
              <SectionHeading icon={Scale} label="Clinical Measurements" />
              <FormField label="Weight (kg)">
                <input type="number" step="0.1" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} className="input input-sm" placeholder="e.g. 72.5" />
              </FormField>
              <FormField label="BMI">
                <input type="number" step="0.1" value={form.bmi} onChange={(e) => update('bmi', e.target.value)} className="input input-sm" placeholder="calculated or enter" />
              </FormField>
              <FormField label="Waist (cm)">
                <input type="number" step="0.5" value={form.waistCm} onChange={(e) => update('waistCm', e.target.value)} className="input input-sm" />
              </FormField>
              <FormField label="Chest (cm)">
                <input type="number" step="0.5" value={form.chestCm} onChange={(e) => update('chestCm', e.target.value)} className="input input-sm" />
              </FormField>
              <FormField label="BP Systolic (mmHg)">
                <input type="number" value={form.systolicBp} onChange={(e) => update('systolicBp', e.target.value)} className="input input-sm" placeholder="120" />
              </FormField>
              <FormField label="BP Diastolic (mmHg)">
                <input type="number" value={form.diastolicBp} onChange={(e) => update('diastolicBp', e.target.value)} className="input input-sm" placeholder="80" />
              </FormField>
              {form.examType === 'PME' && (
                <>
                  <FormField label="Heart Rate (bpm)">
                    <input type="number" value={form.heartRateBpm} onChange={(e) => update('heartRateBpm', e.target.value)} className="input input-sm" />
                  </FormField>
                  <FormField label="SpO₂ (%)">
                    <input type="number" value={form.spo2Percent} onChange={(e) => update('spo2Percent', e.target.value)} className="input input-sm" />
                  </FormField>
                  <FormField label="Resp Rate (/min)">
                    <input type="number" value={form.respiratoryRate} onChange={(e) => update('respiratoryRate', e.target.value)} className="input input-sm" />
                  </FormField>
                </>
              )}

              {/* Sensory */}
              <SectionHeading icon={Eye} label="Sensory Examination" />
              <FormField label="Vision — Left Eye">
                <input value={form.visionLeft} onChange={(e) => update('visionLeft', e.target.value)} className="input input-sm" placeholder="e.g. 6/6" />
              </FormField>
              <FormField label="Vision — Right Eye">
                <input value={form.visionRight} onChange={(e) => update('visionRight', e.target.value)} className="input input-sm" placeholder="e.g. 6/6" />
              </FormField>
              <FormField label="Hearing Status">
                <select value={form.hearingStatus} onChange={(e) => update('hearingStatus', e.target.value)} className="input input-sm">
                  {HEARING_OPTIONS.map((h) => (
                    <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>
                  ))}
                </select>
              </FormField>

              {/* Investigations # */}
              <SectionHeading icon={FlaskConical} label="Investigations — Level # (all exams)" />
              <FormField label="Hb%">
                <input value={form.hbPercent} onChange={(e) => update('hbPercent', e.target.value)} className="input input-sm" placeholder="e.g. 14.5 g/dL" />
              </FormField>
              <FormField label="TLC / DLC">
                <input value={form.tlcDlc} onChange={(e) => update('tlcDlc', e.target.value)} className="input input-sm" placeholder="Normal / Abnormal" />
              </FormField>
              <FormField label="Urine RE & Sp Gr">
                <input value={form.urineRE} onChange={(e) => update('urineRE', e.target.value)} className="input input-sm" placeholder="Normal / Abnormal" />
              </FormField>

              {/* Investigations ## / ### */}
              <SectionHeading icon={FlaskConical} label={`Investigations — Level ${form.examType === 'PME' ? '###' : '##'} (age-specific)`} />
              <FormField label="Blood Sugar — Fasting (mg/dL)">
                <input type="number" value={form.bloodSugarFasting} onChange={(e) => update('bloodSugarFasting', e.target.value)} className="input input-sm" />
              </FormField>
              <FormField label="Blood Sugar — PP (mg/dL)">
                <input type="number" value={form.bloodSugarPP} onChange={(e) => update('bloodSugarPP', e.target.value)} className="input input-sm" />
              </FormField>
              <FormField label="Resting ECG">
                <input value={form.restingECG} onChange={(e) => update('restingECG', e.target.value)} className="input input-sm" placeholder="Normal / Findings" />
              </FormField>
              {form.examType === 'PME' && (
                <>
                  <FormField label="Uric Acid (mg/dL)">
                    <input type="number" step="0.1" value={form.uricAcid} onChange={(e) => update('uricAcid', e.target.value)} className="input input-sm" />
                  </FormField>
                  <FormField label="Creatinine (mg/dL)">
                    <input type="number" step="0.01" value={form.creatinine} onChange={(e) => update('creatinine', e.target.value)} className="input input-sm" />
                  </FormField>
                  <FormField label="Cholesterol Total (mg/dL)">
                    <input type="number" value={form.cholesterolTotal} onChange={(e) => update('cholesterolTotal', e.target.value)} className="input input-sm" />
                  </FormField>
                  <FormField label="Lipid Profile">
                    <input value={form.lipidProfile} onChange={(e) => update('lipidProfile', e.target.value)} className="input input-sm" placeholder="Normal / Dyslipidaemia" />
                  </FormField>
                  <FormField label="X-Ray Chest PA View">
                    <input value={form.xrayChest} onChange={(e) => update('xrayChest', e.target.value)} className="input input-sm" placeholder="Normal / Findings" />
                  </FormField>
                  {individual.sex === 'female' && (
                    <FormField label="Gynaecology (age ≥ 45)" colSpan="col-span-2">
                      <textarea value={form.gynaecologyNotes} onChange={(e) => update('gynaecologyNotes', e.target.value)} className="input input-sm resize-none h-14" placeholder="AFMSF-3A / HRC findings…" />
                    </FormField>
                  )}
                </>
              )}

              {/* Remarks */}
              <div className="col-span-full mt-1">
                <FormField label="Remarks / Recommendations">
                  <textarea value={form.remarks} onChange={(e) => update('remarks', e.target.value)} className="input input-sm resize-none h-16" placeholder="Medical board findings, restrictions, follow-up instructions…" />
                </FormField>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button type="submit" disabled={saving} className="btn-primary text-xs h-8 px-6">
                {saving ? 'Saving…' : `Save ${form.examType} Record`}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(defaultForm()); }} className="btn-secondary text-xs h-8 px-4">
                Cancel
              </button>
              <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full border ${getCategoryStyle(form.medicalCategory).color}`}>
                {getCategoryStyle(form.medicalCategory).label}
              </span>
              {(() => {
                const code = formatShapeCode(form.shapeS, form.shapeH, form.shapeA, form.shapeP, form.shapeE);
                return code ? (
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full tracking-widest">
                    {code}
                  </span>
                ) : null;
              })()}
            </div>
          </form>
        )}

        {/* ── Past exams list ─────────────────────────────────── */}
        {sortedExams.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheck className="h-9 w-9 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No assessments recorded</p>
            <p className="text-xs text-gray-400 mt-1">Record this individual's first medical category assessment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedExams.map((exam) => {
              const isOpen = expandedId === exam.id;
              const catStyle = getCategoryStyle(exam.medicalCategory);
              const hasShape = [exam.shapeS, exam.shapeH, exam.shapeA, exam.shapeP, exam.shapeE].some((v) => v != null);
              const hasCOPE  = [exam.copeC, exam.copeO, exam.copeP, exam.copeE].some((v) => v != null);
              return (
                <div key={exam.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-200 transition-all">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : exam.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/60 hover:bg-blue-50/40 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(exam.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${catStyle.color}`}>
                        {catStyle.label}
                      </span>
                      {(() => {
                        const code = formatShapeCode(exam.shapeS, exam.shapeH, exam.shapeA, exam.shapeP, exam.shapeE);
                        return code ? (
                          <span className="hidden sm:inline text-[11px] font-mono font-bold text-slate-600 tracking-widest">
                            {code}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 py-4 space-y-4">
                      <div className={`px-3 py-2 rounded-xl border text-xs font-medium ${catStyle.color}`}>
                        {catStyle.desc}
                      </div>

                      {hasShape && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">SHAPE Factor Scores</p>
                          <div className="flex flex-wrap gap-2">
                            {SHAPE_FACTORS.map(({ letter, key }) => {
                              const val = exam[key as keyof AnnualMedicalExam] as number | null;
                              if (val == null) return null;
                              return (
                                <div key={letter} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  val <= 2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : val === 3 ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : val === 4 ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  <span>{letter}</span>
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]">{val}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {hasCOPE && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">COPE Coding</p>
                          <div className="flex flex-wrap gap-2">
                            {COPE_FACTORS.map(({ letter, key }) => {
                              const val = exam[key as keyof AnnualMedicalExam] as number | null;
                              if (val == null) return null;
                              return (
                                <div key={letter} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  val === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : val === 1 ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  <span>{letter}</span>
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]">{val}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                        {[
                          { label: 'Vision (L)', value: exam.visionLeft },
                          { label: 'Vision (R)', value: exam.visionRight },
                          { label: 'Hearing', value: exam.hearingStatus },
                          { label: 'BMI', value: exam.bmi?.toFixed(1) },
                          { label: 'Valid Until', value: exam.fitnessValidUntil ? new Date(exam.fitnessValidUntil).toLocaleDateString('en-IN') : null },
                          { label: 'Remarks', value: exam.remarks },
                        ].map(({ label, value }) => value ? (
                          <div key={label}>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                            <p className="text-xs font-semibold text-gray-800 mt-0.5">{value}</p>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

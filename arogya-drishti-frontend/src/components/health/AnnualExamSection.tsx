'use client';

import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/ui/TacticalStatusBadge';
import { 
  ChevronDown,
  ChevronUp,
  Calendar,
  Stethoscope,
  Eye,
  Ear,
  Scale,
  AlertTriangle,
  ShieldCheck,
  User,
  Activity,
  Heart,
  Droplets,
  FlaskConical,
  ClipboardList,
  Ruler,
} from 'lucide-react';
import type { Individual, AnnualMedicalExam, VitalsLog } from '@/lib/api';
import { formatShapeCode } from '@/components/doctor/DoctorExamCard';
import {
  getBMICategory,
  getBMIStatusColor,
  formatDateForDisplay,
} from '@/lib/health/calculations';

interface AnnualExamSectionProps {
  individual: Individual;
  exams: AnnualMedicalExam[];
  latestVitals?: VitalsLog;
  loading?: boolean;
}

interface ProcessedExam extends AnnualMedicalExam {
  formattedDate: string;
  bmiCategory: string;
  isOverdue: boolean;
}

// ── AO 9/2011/DGMS — Age-wise Exam Schedule ────────────────────────────
interface ExamScheduleEntry {
  ageFrom: number; // completed years, inclusive
  ageTo: number;   // exclusive
  type: 'AME' | 'PME';
  investigations: '#' | '##' | '###';
  venue: string;
}

const AO_EXAM_SCHEDULE: ExamScheduleEntry[] = [
  { ageFrom: 0,  ageTo: 25, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 25, ageTo: 26, type: 'AME', investigations: '##',  venue: 'Nearest MH' },
  { ageFrom: 26, ageTo: 30, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 30, ageTo: 31, type: 'AME', investigations: '##',  venue: 'Nearest MH' },
  { ageFrom: 31, ageTo: 35, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 35, ageTo: 36, type: 'PME', investigations: '###', venue: 'Nearest MH (PME Board)' },
  { ageFrom: 36, ageTo: 37, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 37, ageTo: 38, type: 'AME', investigations: '##',  venue: 'Nearest MH' },
  { ageFrom: 38, ageTo: 40, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 40, ageTo: 41, type: 'PME', investigations: '###', venue: 'Nearest MH (PME Board)' },
  { ageFrom: 41, ageTo: 42, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 42, ageTo: 43, type: 'AME', investigations: '##',  venue: 'Nearest MH' },
  { ageFrom: 43, ageTo: 45, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 45, ageTo: 46, type: 'PME', investigations: '###', venue: 'Nearest MH (PME Board)' },
  { ageFrom: 46, ageTo: 47, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 47, ageTo: 48, type: 'AME', investigations: '##',  venue: 'Nearest MH' },
  { ageFrom: 48, ageTo: 49, type: 'AME', investigations: '#',   venue: 'AMA (RMO / Unit MO)' },
  { ageFrom: 49, ageTo: 50, type: 'AME', investigations: '##',  venue: 'Nearest MH' },
  { ageFrom: 50, ageTo: 51, type: 'PME', investigations: '###', venue: 'Nearest MH (PME Board)' },
  { ageFrom: 51, ageTo: 53, type: 'AME', investigations: '##',  venue: 'Nearest MH' },
  { ageFrom: 53, ageTo: 54, type: 'PME', investigations: '###', venue: 'Nearest MH (PME Board)' },
  { ageFrom: 54, ageTo: 57, type: 'AME', investigations: '##',  venue: 'Nearest MH (Medical Specialist)' },
  { ageFrom: 57, ageTo: 58, type: 'PME', investigations: '###', venue: 'Nearest MH (PME Board)' },
  { ageFrom: 58, ageTo: 99, type: 'AME', investigations: '##',  venue: 'Nearest MH (Medical Specialist)' },
];

function getExamScheduleForAge(age: number): ExamScheduleEntry {
  return AO_EXAM_SCHEDULE.find(e => age >= e.ageFrom && age < e.ageTo) ?? AO_EXAM_SCHEDULE[0];
}

// Investigation required tests per level (per AO 9/2011/DGMS Appendix A)
const INVESTIGATION_TESTS: Record<'#' | '##' | '###', string[]> = {
  '#':   [
    'Blood — Hb%, TLC, DLC',
    'Urine RE & Sp Gr',
  ],
  '##':  [
    'Blood — Hb%, TLC, DLC',
    'Urine RE & Sp Gr',
    'Blood Sugar — Fasting & PP',
    'Resting ECG',
  ],
  '###': [
    'Blood — Hb%, TLC, DLC',
    'Blood Sugar — Fasting & PP',
    'Uric Acid',
    'Creatinine',
    'Cholesterol / Lipid Profile',
    'Urine RE & Sp Gr',
    'Resting ECG',
    'X-Ray Chest PA view',
  ],
};

// ── AME Test row component ─────────────────────────────────────────────
function TestRow({ label, value, icon: Icon, unit }: { label: string; value?: string | number | null; icon?: any; unit?: string }) {
  const display = value != null && value !== '' ? `${value}${unit ? ' ' + unit : ''}` : '—';
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
        <span>{label}</span>
      </div>
      <span className={`text-xs font-semibold ${display === '—' ? 'text-gray-300' : 'text-gray-800'}`}>{display}</span>
    </div>
  );
}

export function AnnualExamSection({ 
  individual, 
  exams, 
  latestVitals,
  loading = false 
}: AnnualExamSectionProps) {
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ame' | 'pme'>('ame');

  // Calculate individual's current age and AO 9/2011 schedule requirement
  const ageYears = useMemo(() => {
    if (!individual.dateOfBirth) return null;
    const dob = new Date(individual.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }, [individual.dateOfBirth]);

  const examSchedule = useMemo(
    () => (ageYears !== null ? getExamScheduleForAge(ageYears) : null),
    [ageYears]
  );

  const processedExams = useMemo((): ProcessedExam[] => {
    if (!exams?.length) return [];
    return exams
      .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())
      .map((exam): ProcessedExam => {
        const nextDue = exam.nextExamDue ? new Date(exam.nextExamDue) : null;
        return {
          ...exam,
          formattedDate: formatDateForDisplay(new Date(exam.examDate)),
          bmiCategory: exam.bmi ? getBMICategory(exam.bmi) : 'Unknown',
          isOverdue: nextDue ? new Date() > nextDue : false,
        };
      });
  }, [exams]);

  const latestExam = processedExams[0] ?? null;
  const nextExamDue = latestExam?.nextExamDue ? formatDateForDisplay(latestExam.nextExamDue) : null;

  const toggleExpanded = (examId: string) => {
    setExpandedExam(expandedExam === examId ? null : examId);
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-100 rounded-xl">
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Medical Examinations</h3>
            <p className="text-xs text-gray-500">{processedExams.length} exam{processedExams.length !== 1 ? 's' : ''} on record</p>
          </div>
        </div>
        {nextExamDue && (
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Next due</p>
            <p className="text-xs font-semibold text-gray-700">{nextExamDue}</p>
          </div>
        )}
      </div>

      {/* ── AME / PME Tabs ─────────────────────────── */}
      <div className="px-6 pt-4">
        {/* AO 9/2011/DGMS requirement strip */}
        {examSchedule && ageYears !== null && (
          <div className={`mb-4 rounded-xl border px-4 py-3 flex flex-wrap items-start gap-4 ${
            examSchedule.type === 'PME'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                examSchedule.type === 'PME'
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
                {examSchedule.type}
              </span>
              <span className="text-xs font-semibold text-gray-700">
                Age {ageYears} yrs — Current year requirement
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-1">Venue:</span>
                  <span className="text-xs text-gray-600">{examSchedule.venue}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-1">Investigations ({examSchedule.investigations}):</span>
                  <span className="text-xs text-gray-600">{INVESTIGATION_TESTS[examSchedule.investigations].join(' · ')}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">As per Army Order 9/2011/DGMS, Appendix A</p>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(['ame', 'pme'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'ame' ? 'Annual Medical Exam (AME)' : 'Periodic Medical Exam (PME)'}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          AME TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'ame' && (
        <div className="p-6 space-y-5">
          {processedExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Stethoscope className="h-8 w-8 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No annual exams on record</p>
              <p className="text-xs text-gray-400 mt-1">Annual exams are required yearly to maintain fitness status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processedExams.map((exam) => (
                <div key={exam.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-150">
                  {/* Exam header row */}
                  <div
                    className="flex items-center justify-between px-5 py-3.5 bg-gray-50/60 cursor-pointer"
                    onClick={() => toggleExpanded(exam.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{exam.formattedDate}</span>
                      <StatusBadge status={mapFitnessToStatus(exam.overallFitness)} label={categoryLabel(exam.overallFitness)} size="sm" />
                      {(() => {
                        const code = formatShapeCode(exam.shapeS ?? null, exam.shapeH ?? null, exam.shapeA ?? null, exam.shapeP ?? null, exam.shapeE ?? null);
                        return code ? (
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full tracking-widest">
                            {code}
                          </span>
                        ) : null;
                      })()}
                      {exam.isOverdue && (
                        <div className="flex items-center gap-1 text-red-500">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Overdue</span>
                        </div>
                      )}
                    </div>
                    {expandedExam === exam.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>

                  {/* Expanded AME test grid */}
                  {expandedExam === exam.id && (
                    <div className="px-5 py-4">
                      {/* Required investigations for this age */}
                      {examSchedule && (
                        <div className="mb-3 pb-3 border-b border-gray-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            Required Investigations — Level {examSchedule.investigations} (per AO 9/2011)
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {INVESTIGATION_TESTS[examSchedule.investigations].map((test) => (
                              <span key={test} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        {/* Left col - AME tests */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recorded Tests</p>
                          <TestRow label="Weight" value={exam.bmi && individual.heightCm ? (exam.bmi * Math.pow(individual.heightCm / 100, 2)).toFixed(1) : latestVitals?.weightKg?.toFixed(1)} unit="kg" icon={Scale} />
                          <TestRow label="Blood Pressure" value={latestVitals?.systolicBp ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}` : null} unit="mmHg" icon={Activity} />
                          <TestRow label="BMI" value={exam.bmi?.toFixed(1)} icon={Scale} />
                          <TestRow label="CBC (Blood Count)" value={null} icon={FlaskConical} />
                          <TestRow label="Waist Circumference" value={null} unit="cm" icon={Ruler} />
                          <TestRow label="Chest Circumference" value={null} unit="cm" icon={Ruler} />
                        </div>
                        {/* Right col - Sensory + validity */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sensory &amp; Status</p>
                          <TestRow label="Vision — Left Eye" value={exam.visionLeft} icon={Eye} />
                          <TestRow label="Vision — Right Eye" value={exam.visionRight} icon={Eye} />
                          <TestRow label="Hearing Status" value={exam.hearingStatus} icon={Ear} />
                          <TestRow label="Medical Category" value={categoryLabel(exam.overallFitness)} icon={ShieldCheck} />
                          <TestRow label="Valid Until" value={exam.fitnessValidUntil ? formatDateForDisplay(exam.fitnessValidUntil) : null} icon={Calendar} />
                          {exam.remarks && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Remarks</p>
                              <p className="text-xs text-gray-600 leading-snug">{exam.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          PME TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'pme' && (
        <div className="p-6 space-y-5">
          {/* Official PME (###) explanation */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">
              Periodic Medical Examination — Investigation Level ###
            </p>
            <p className="text-[11px] text-amber-700 leading-snug">
              PME is conducted at ages 35, 40, 45, 50, 53 &amp; 57 years at the Nearest Military Hospital.
              All mandatory investigations are listed below as per AO 9/2011/DGMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
            {/* Left col */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Blood Investigations</p>
              <TestRow label="Blood — Hb%, TLC, DLC" value={null} icon={FlaskConical} />
              <TestRow label="Blood Sugar — Fasting" value={null} unit="mg/dL" icon={FlaskConical} />
              <TestRow label="Blood Sugar — Post-Prandial (PP)" value={null} unit="mg/dL" icon={FlaskConical} />
              <TestRow label="Uric Acid" value={null} unit="mg/dL" icon={FlaskConical} />
              <TestRow label="Creatinine" value={null} unit="mg/dL" icon={FlaskConical} />
              <TestRow label="Cholesterol / Lipid Profile" value={null} icon={FlaskConical} />

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">Cardiovascular</p>
              <TestRow label="Resting ECG" value={null} icon={Heart} />
              <TestRow label="Heart Rate" value={latestVitals?.heartRateBpm} unit="bpm" icon={Activity} />
              <TestRow label="Blood Pressure" value={latestVitals?.systolicBp ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}` : null} unit="mmHg" icon={Activity} />
              <TestRow label="SpO₂" value={latestVitals?.spo2Percent} unit="%" icon={Activity} />
            </div>
            {/* Right col */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urine &amp; Radiology</p>
              <TestRow label="Urine RE & Sp Gr" value={null} icon={Droplets} />
              <TestRow label="X-Ray Chest — PA view" value={null} icon={Ruler} />

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">Clinical Examination</p>
              <TestRow label="Weight" value={latestVitals?.weightKg?.toFixed(1)} unit="kg" icon={Scale} />
              <TestRow label="Respiratory Rate" value={latestVitals?.respiratoryRate} unit="/min" icon={Activity} />
              <TestRow label="Temperature" value={latestVitals?.tempCelsius} unit="°C" icon={Activity} />
              <TestRow label="Pain Scale" value={latestVitals?.painScale} icon={ClipboardList} />

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">Additional (age ≥ 45)</p>
              <TestRow label="Gynaecology exam (female officers)" value={null} icon={User} />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
            {latestVitals
              ? `Vitals recorded on ${new Date(latestVitals.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}. `
              : 'No vitals recorded. '}
            Laboratory investigations (blood tests, ECG, X-Ray) are conducted at MH and recorded externally — not yet integrated in the system.
            Authority: Army Order 9/2011/DGMS, Appendix A, Para 9 &amp; 15.
          </p>
        </div>
      )}
    </div>
  );
}

function mapFitnessToStatus(fitness: string): 'fit' | 'monitor' | 'critical' | 'operational' {
  if (['1A', '1B'].includes(fitness)) return 'fit';
  if (['2', '3'].includes(fitness)) return 'monitor';
  if (fitness === '4') return 'monitor';
  if (fitness === '5') return 'critical';
  // Legacy fallback
  if (fitness.toLowerCase() === 'fit') return 'fit';
  if (fitness.toLowerCase().includes('temporarily')) return 'monitor';
  if (fitness.toLowerCase().includes('permanently')) return 'critical';
  return 'operational';
}

function categoryLabel(cat: string): string {
  const MAP: Record<string, string> = {
    '1A': 'Cat 1A — Fit All Duties',
    '1B': 'Cat 1B — Fit (Observation)',
    '2': 'Cat 2 — Fit (Limited)',
    '3': 'Cat 3 — Sedentary Duties',
    '4': 'Cat 4 — Temporarily Unfit',
    '5': 'Cat 5 — Permanently Unfit',
  };
  return MAP[cat] ?? `Category ${cat}`;
}

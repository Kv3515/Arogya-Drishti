'use client';

import { useState, FormEvent, useRef } from 'react';
import {
  ClipboardList, Plus, X, Activity, FlaskConical, FileText, Upload,
  Pill, ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react';
import { api, type MedicalHistory, type VitalsLog, type Allergy } from '@/lib/api';
import { MedicalTimeline } from '@/components/MedicalTimeline';
import { PrescriptionForm } from './PrescriptionForm';
import { VitalsChart } from '@/components/VitalsChart';

interface Prescription {
  drugName: string;
  dosage: string; // local form field — mapped to 'dose' for API
  frequency: string;
  durationDays: number;
  route: string;
  instructions?: string;
}

interface DoctorVisitCardProps {
  serviceNumber: string;
  history: MedicalHistory[];
  vitals: VitalsLog[];
  onRecordAdded: (record: MedicalHistory) => void;
  onVitalsUpdated: (v: VitalsLog) => void;
  allergies?: Allergy[];
}

const VISIT_TYPES = ['OPD', 'IPD', 'EMERGENCY', 'FOLLOW_UP', 'ANNUAL_EXAM'] as const;
const VISIT_TYPE_LABELS: Record<string, string> = {
  OPD: 'Normal Checkup (OPD)',
  IPD: 'In-Patient (IPD)',
  EMERGENCY: 'Emergency',
  FOLLOW_UP: 'Follow-up',
  ANNUAL_EXAM: 'Annual Exam',
};
const SEVERITIES = ['mild', 'moderate', 'severe', 'critical'] as const;

const VITALS_FIELDS = [
  { key: 'systolicBp', label: 'Systolic BP', unit: 'mmHg', type: 'number' },
  { key: 'diastolicBp', label: 'Diastolic BP', unit: 'mmHg', type: 'number' },
  { key: 'heartRateBpm', label: 'Heart Rate', unit: 'bpm', type: 'number' },
  { key: 'tempCelsius', label: 'Temperature', unit: '°C', type: 'number' },
  { key: 'spo2Percent', label: 'SpO₂', unit: '%', type: 'number' },
  { key: 'respiratoryRate', label: 'Resp Rate', unit: '/min', type: 'number' },
  { key: 'weightKg', label: 'Weight', unit: 'kg', type: 'number' },
  { key: 'painScale', label: 'Pain Scale', unit: '/10', type: 'number' },
] as const;

const BLOOD_TEST_FIELDS = [
  { key: 'hbPercent', label: 'Hb%' },
  { key: 'tlcTotal', label: 'TLC (cells/μL)' },
  { key: 'dlcNeutro', label: 'DLC — Neutrophils (%)' },
  { key: 'dlcLymph', label: 'DLC — Lymphocytes (%)' },
  { key: 'sugarFasting', label: 'Blood Sugar Fasting (mg/dL)' },
  { key: 'sugarPP', label: 'Blood Sugar PP (mg/dL)' },
  { key: 'uricAcid', label: 'Uric Acid (mg/dL)' },
  { key: 'creatinine', label: 'Creatinine (mg/dL)' },
  { key: 'cholesterolTotal', label: 'Cholesterol Total (mg/dL)' },
  { key: 'ldl', label: 'LDL (mg/dL)' },
  { key: 'hdl', label: 'HDL (mg/dL)' },
  { key: 'triglycerides', label: 'Triglycerides (mg/dL)' },
] as const;

function SectionToggle({
  label, icon: Icon, open, onToggle, badge,
}: {
  label: string; icon: any; open: boolean; onToggle: () => void; badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="section-toggle-bar"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        {badge && (
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
            {badge}
          </span>
        )}
      </span>
      {open
        ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
    </button>
  );
}

export function DoctorVisitCard({
  serviceNumber, history, vitals, onRecordAdded, onVitalsUpdated, allergies = [],
}: DoctorVisitCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showVitalsTrend, setShowVitalsTrend] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visit form
  const [visitType, setVisitType] = useState<string>('OPD');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icd10, setIcd10] = useState('');
  const [severity, setSeverity] = useState('mild');
  const [doctorRemarks, setDoctorRemarks] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Collapsible sections
  const [showVitalsSection, setShowVitalsSection] = useState(true);
  const [showBloodSection, setShowBloodSection] = useState(false);
  const [showOtherTests, setShowOtherTests] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Vitals
  const [vitalsForm, setVitalsForm] = useState<Record<string, string>>({});

  // Blood tests
  const [bloodForm, setBloodForm] = useState<Record<string, string>>({});

  // Other tests
  const [otherTests, setOtherTests] = useState<Array<{ name: string; result: string }>>([]);
  const addOtherTest = () => setOtherTests((t) => [...t, { name: '', result: '' }]);
  const updateOtherTest = (i: number, key: 'name' | 'result', val: string) =>
    setOtherTests((t) => t.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)));
  const removeOtherTest = (i: number) => setOtherTests((t) => t.filter((_, idx) => idx !== i));

  // File upload (frontend-only placeholder)
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const resetForm = () => {
    setVisitType('OPD'); setChiefComplaint(''); setDiagnosis('');
    setIcd10(''); setSeverity('mild'); setDoctorRemarks('');
    setPrescriptions([]); setVitalsForm({}); setBloodForm({});
    setOtherTests([]); setUploadedFiles([]); setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) { setError('Chief complaint is required.'); return; }
    if (!diagnosis.trim()) { setError('Diagnosis is required.'); return; }
    setError(null);
    setSaving(true);
    try {
      // Build vitals payload
      const vitalsPayload: Partial<VitalsLog> = {};
      for (const f of VITALS_FIELDS) {
        if (vitalsForm[f.key]) (vitalsPayload as any)[f.key] = Number(vitalsForm[f.key]);
      }
      const hasVitals = Object.keys(vitalsPayload).length > 0;

      // Build remarks with blood tests + other tests appended
      const bloodLines = BLOOD_TEST_FIELDS
        .filter(f => bloodForm[f.key])
        .map(f => `${f.label}: ${bloodForm[f.key]}`);
      const otherLines = otherTests
        .filter(t => t.name.trim())
        .map(t => `${t.name}: ${t.result}`);
      const uploadLines = uploadedFiles.length > 0 ? [`Reports uploaded: ${uploadedFiles.join(', ')}`] : [];
      const fullRemarks = [
        doctorRemarks,
        bloodLines.length ? `\nBlood Tests:\n${bloodLines.join('\n')}` : '',
        otherLines.length ? `\nOther Tests:\n${otherLines.join('\n')}` : '',
        uploadLines.length ? `\n${uploadLines.join('\n')}` : '',
      ].join('').trim();

      // Save vitals if any
      let savedVitals: VitalsLog | null = null;
      if (hasVitals) {
        savedVitals = await api.logVitals(serviceNumber, vitalsPayload);
        onVitalsUpdated(savedVitals);
      }

      // Save medical record
      const record = await api.createMedicalRecord(serviceNumber, {
        visitType,
        chiefComplaint,
        diagnosis,
        icd10Code: icd10 || undefined,
        severity,
        visitDate: new Date().toISOString(),
        notes: fullRemarks || undefined,
      } as Partial<MedicalHistory>);

      // Save prescriptions
      if (prescriptions.length > 0) {
        await Promise.all(
          prescriptions.map((rx) =>
            api.createPrescription(serviceNumber, record.id, {
              drugName: rx.drugName,
              dose: rx.dosage,
              frequency: rx.frequency,
              durationDays: rx.durationDays,
              route: rx.route,
              instructions: rx.instructions || undefined,
            })
          )
        );
      }

      onRecordAdded(record);
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const clinicVisits = history.filter((h) => h.visitType !== 'ANNUAL_EXAM');

  return (
    <div className="glass-card overflow-hidden">
      {/* Header — always visible, click to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors duration-150 text-left"
        style={{ borderBottom: isOpen ? '1px solid rgba(203,213,225,0.5)' : 'none' }}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shadow-sm">
            <ClipboardList className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Medical Visits</h3>
            <p className="text-xs text-slate-400">{clinicVisits.length} clinic record{clinicVisits.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {isOpen
          ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* Action buttons inside expanded body */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowVitalsTrend((v) => !v)}
              className={`flex items-center gap-1.5 text-xs h-8 px-3 rounded-lg border font-semibold transition-all ${
                showVitalsTrend
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Vitals Trend
            </button>
            <button
              onClick={() => { setShowForm((v) => !v); if (showForm) resetForm(); }}
              className="btn-primary text-xs h-8 px-3 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {showForm ? 'Cancel' : 'New Visit'}
            </button>
          </div>
        {/* Vitals Trend chart */}
        {showVitalsTrend && vitals.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: '#f0f9ff', border: '1px solid rgba(186,230,253,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <VitalsChart vitals={vitals} />
          </div>
        )}
        {showVitalsTrend && vitals.length === 0 && (
          <div className="rounded-xl px-4 py-6 text-center text-xs text-slate-400" style={{ background: '#f0f9ff', border: '1px solid rgba(186,230,253,0.6)' }}>
            No vitals recorded yet.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">{error}</div>
        )}

        {/* ── VISIT FORM ─────────────────────────────── */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl p-5 space-y-4" style={{ background: '#faf9ff', border: '1px solid rgba(167,139,250,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p className="text-sm font-semibold text-gray-800">New Medical Visit</p>

            {/* Visit type + severity */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Visit Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {VISIT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVisitType(t)}
                      className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                        visitType === t
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {VISIT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input input-sm">
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Chief complaint + diagnosis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chief Complaint *</label>
                <input value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} className="input input-sm" placeholder="e.g. Persistent headache for 3 days" />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Diagnosis *</label>
                <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="input input-sm" placeholder="e.g. Tension-type headache" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ICD-10 Code</label>
                <input value={icd10} onChange={(e) => setIcd10(e.target.value)} className="input input-sm" placeholder="e.g. G44.2" />
              </div>
            </div>

            {/* ── Collapsible: Vitals ─────────────────── */}
            <SectionToggle
              label="Vitals" icon={Activity} open={showVitalsSection}
              onToggle={() => setShowVitalsSection((v) => !v)}
            />
            {showVitalsSection && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-2">
                {VITALS_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      {f.label} <span className="normal-case text-gray-300">({f.unit})</span>
                    </label>
                    <input
                      type="number" step="any"
                      value={vitalsForm[f.key] ?? ''}
                      onChange={(e) => setVitalsForm((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="input input-sm"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ── Collapsible: Blood Tests ─────────────── */}
            <SectionToggle
              label="Blood Tests" icon={FlaskConical} open={showBloodSection}
              onToggle={() => setShowBloodSection((v) => !v)}
              badge="Optional"
            />
            {showBloodSection && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-2">
                {BLOOD_TEST_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input
                      value={bloodForm[f.key] ?? ''}
                      onChange={(e) => setBloodForm((b) => ({ ...b, [f.key]: e.target.value }))}
                      className="input input-sm"
                      placeholder="value or N/A"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ── Collapsible: Other Tests ─────────────── */}
            <SectionToggle
              label="Other Tests / Investigations" icon={ClipboardList} open={showOtherTests}
              onToggle={() => setShowOtherTests((v) => !v)}
              badge="Optional"
            />
            {showOtherTests && (
              <div className="pl-2 space-y-2">
                {otherTests.map((t, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={t.name}
                      onChange={(e) => updateOtherTest(i, 'name', e.target.value)}
                      className="input input-sm flex-1"
                      placeholder="Test name (e.g. X-Ray, ECG)"
                    />
                    <input
                      value={t.result}
                      onChange={(e) => updateOtherTest(i, 'result', e.target.value)}
                      className="input input-sm flex-1"
                      placeholder="Result / Findings"
                    />
                    <button type="button" onClick={() => removeOtherTest(i)} className="text-gray-400 hover:text-red-500 p-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOtherTest} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add test
                </button>
              </div>
            )}

            {/* ── Collapsible: Upload Reports ─────────── */}
            <SectionToggle
              label="Upload Reports" icon={Upload} open={showUpload}
              onToggle={() => setShowUpload((v) => !v)}
              badge={uploadedFiles.length > 0 ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}` : undefined}
            />
            {showUpload && (
              <div className="pl-2">
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Click to select reports (PDF, JPG, PNG)</p>
                  <p className="text-[10px] text-gray-400 mt-1">File storage integration coming in Phase 6</p>
                  <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                        <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="flex-1 truncate">{f}</span>
                        <button type="button" onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-400">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Doctor's Remarks */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Doctor's Remarks</label>
              <textarea
                value={doctorRemarks}
                onChange={(e) => setDoctorRemarks(e.target.value)}
                className="input input-sm resize-none h-16"
                placeholder="Clinical observations, follow-up instructions, referrals…"
              />
            </div>

            {/* ── Drug-allergy warning ───────────────── */}
            {(() => {
              const activeAllergens = allergies
                .filter((a) => a.status === 'active')
                .map((a) => a.allergen.toLowerCase());
              const hits = prescriptions.filter((rx) =>
                rx.drugName.trim().length >= 3 &&
                activeAllergens.some((ag) =>
                  ag.includes(rx.drugName.toLowerCase()) ||
                  rx.drugName.toLowerCase().includes(ag)
                )
              );
              if (hits.length === 0) return null;
              return (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
                  <div>
                    <p className="text-xs font-bold text-red-700">Drug–Allergy Warning</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {hits.map((rx) => rx.drugName).join(', ')} may conflict with known active allergies.
                      Verify before prescribing.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* ── Prescriptions ──────────────────────── */}
            <PrescriptionForm prescriptions={prescriptions} onPrescriptionsChange={setPrescriptions} />

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="btn-primary text-xs h-8 px-5">
                {saving ? 'Saving…' : `Save Visit${prescriptions.length > 0 ? ` + ${prescriptions.length} Rx` : ''}`}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary text-xs h-8 px-4">Cancel</button>
            </div>
          </form>
        )}

        {/* ── Visit History ─────────────────────────── */}
          <MedicalTimeline records={clinicVisits} />
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { ClipboardList, Plus, X } from 'lucide-react';
import { api, type MedicalHistory } from '@/lib/api';
import { MedicalTimeline } from '@/components/MedicalTimeline';
import { PrescriptionForm } from './PrescriptionForm';

interface MedicalHistorySectionProps {
  serviceNumber: string;
  records: MedicalHistory[];
  onRecordAdded: (record: MedicalHistory) => void;
}

interface Prescription {
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route: string;
  instructions?: string;
}

const VISIT_TYPES = ['OPD', 'IPD', 'EMERGENCY', 'FOLLOW_UP', 'ANNUAL_EXAM'] as const;
const SEVERITIES = ['mild', 'moderate', 'severe', 'critical'] as const;

export function MedicalHistorySection({ serviceNumber, records, onRecordAdded }: MedicalHistorySectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    visitType: 'OPD' as string,
    chiefComplaint: '',
    diagnosis: '',
    icd10Code: '',
    severity: 'mild' as string,
  });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.chiefComplaint.trim()) { setError('Chief complaint is required.'); return; }
    if (!form.diagnosis.trim()) { setError('Diagnosis is required.'); return; }
    
    // Validate prescriptions
    for (let i = 0; i < prescriptions.length; i++) {
      const rx = prescriptions[i];
      if (!rx.drugName.trim()) {
        setError(`Prescription ${i + 1}: Drug name is required`);
        return;
      }
      if (!rx.dosage.trim()) {
        setError(`Prescription ${i + 1}: Dosage is required`);
        return;
      }
      if (rx.durationDays < 1 || rx.durationDays > 365) {
        setError(`Prescription ${i + 1}: Duration must be between 1-365 days`);
        return;
      }
    }
    
    setError(null);
    setSaving(true);
    
    try {
      // Create medical record first
      const record = await api.createMedicalRecord(serviceNumber, {
        visitType: form.visitType,
        chiefComplaint: form.chiefComplaint,
        diagnosis: form.diagnosis,
        icd10Code: form.icd10Code || undefined,
        severity: form.severity,
        visitDate: new Date().toISOString(),
      } as Partial<MedicalHistory>);

      // Create prescriptions if any
      if (prescriptions.length > 0) {
        const prescriptionPromises = prescriptions.map(rx => 
          api.createPrescription(serviceNumber, record.id, {
            drugName: rx.drugName,
            dose: rx.dosage,
            frequency: rx.frequency,
            durationDays: rx.durationDays,
            route: rx.route,
            instructions: rx.instructions || undefined,
          })
        );
        await Promise.all(prescriptionPromises);
      }

      onRecordAdded(record);
      setShowForm(false);
      setForm({ visitType: 'OPD', chiefComplaint: '', diagnosis: '', icd10Code: '', severity: 'mild' });
      setPrescriptions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save medical record.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm({ visitType: 'OPD', chiefComplaint: '', diagnosis: '', icd10Code: '', severity: 'mild' });
    setPrescriptions([]);
    setError(null);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-brand-500" />
          <h3 className="font-semibold text-gray-900">Medical History</h3>
          {records.length > 0 && <span className="text-xs text-gray-400">{records.length} records</span>}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-xs h-8 px-3">
          <Plus className="h-3.5 w-3.5" /> Add Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">New Medical Record</p>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 font-medium">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Visit Type</label>
              <select value={form.visitType} onChange={(e) => update('visitType', e.target.value)} className="input input-sm">
                {VISIT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Severity</label>
              <select value={form.severity} onChange={(e) => update('severity', e.target.value)} className="input input-sm">
                {SEVERITIES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chief Complaint *</label>
            <input value={form.chiefComplaint} onChange={(e) => update('chiefComplaint', e.target.value)} className="input input-sm" placeholder="e.g. Persistent headache for 3 days" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Diagnosis *</label>
              <input value={form.diagnosis} onChange={(e) => update('diagnosis', e.target.value)} className="input input-sm" placeholder="e.g. Tension-type headache" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ICD-10 Code</label>
              <input value={form.icd10Code} onChange={(e) => update('icd10Code', e.target.value)} className="input input-sm" placeholder="e.g. G44.2" />
            </div>
          </div>

          {/* Prescriptions Section */}
          <PrescriptionForm
            prescriptions={prescriptions}
            onPrescriptionsChange={setPrescriptions}
          />

          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving} className="btn-primary text-xs h-8 px-4">
              {saving ? 'Saving…' : `Save Record${prescriptions.length > 0 ? ` + ${prescriptions.length} Prescription${prescriptions.length > 1 ? 's' : ''}` : ''}`}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary text-xs h-8 px-4">Cancel</button>
          </div>
        </form>
      )}

      <MedicalTimeline records={records} />
    </div>
  );
}

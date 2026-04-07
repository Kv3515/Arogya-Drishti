'use client';

import { useState, FormEvent } from 'react';
import { Activity, Plus, X } from 'lucide-react';
import { api, type VitalsLog } from '@/lib/api';
import { VitalsChart } from '@/components/VitalsChart';

interface VitalsSectionProps {
  serviceNumber: string;
  vitals: VitalsLog[];
  onVitalsUpdated: (newVitals: VitalsLog) => void;
}

const VITALS_FIELDS = [
  { key: 'systolicBp', label: 'Systolic BP', unit: 'mmHg', min: 60, max: 250 },
  { key: 'diastolicBp', label: 'Diastolic BP', unit: 'mmHg', min: 30, max: 150 },
  { key: 'heartRateBpm', label: 'Heart Rate', unit: 'bpm', min: 30, max: 220 },
  { key: 'tempCelsius', label: 'Temperature', unit: '°C', min: 34, max: 42 },
  { key: 'spo2Percent', label: 'SpO₂', unit: '%', min: 50, max: 100 },
  { key: 'respiratoryRate', label: 'Respiratory Rate', unit: 'brpm', min: 8, max: 40 },
  { key: 'painScale', label: 'Pain Scale', unit: '/10', min: 0, max: 10 },
] as const;

type FormState = Record<string, string>;

export function VitalsSection({ serviceNumber, vitals, onVitalsUpdated }: VitalsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ 
    systolicBp: '', 
    diastolicBp: '', 
    heartRateBpm: '', 
    tempCelsius: '', 
    spo2Percent: '', 
    respiratoryRate: '', 
    painScale: '' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestVitals = vitals[0] ?? null;

  const validate = (): string | null => {
    const filled = VITALS_FIELDS.filter((f) => form[f.key].trim() !== '');
    if (filled.length === 0) return 'Enter at least one vital sign.';
    for (const f of filled) {
      const val = Number(form[f.key]);
      if (isNaN(val)) return `${f.label} must be a number.`;
      if (val < f.min || val > f.max) return `${f.label} must be between ${f.min}–${f.max} ${f.unit}.`;
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setSaving(true);
    try {
      const payload: Partial<VitalsLog> = {};
      if (form.systolicBp) payload.systolicBp = Number(form.systolicBp);
      if (form.diastolicBp) payload.diastolicBp = Number(form.diastolicBp);
      if (form.heartRateBpm) payload.heartRateBpm = Number(form.heartRateBpm);
      if (form.tempCelsius) payload.tempCelsius = Number(form.tempCelsius);
      if (form.spo2Percent) payload.spo2Percent = Number(form.spo2Percent);
      const newVitals = await api.logVitals(serviceNumber, payload);
      onVitalsUpdated(newVitals);
      setShowForm(false);
      setForm({ systolicBp: '', diastolicBp: '', heartRateBpm: '', tempCelsius: '', spo2Percent: '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save vitals.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-500" />
          <h3 className="font-semibold text-gray-900">Vitals Trend</h3>
          {vitals.length > 0 && (
            <span className="text-xs text-gray-400">{vitals.length} readings</span>
          )}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-xs h-8 px-3">
          <Plus className="h-3.5 w-3.5" /> Log Vitals
        </button>
      </div>

      {/* Latest vitals summary */}
      {latestVitals && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
          {[
            { label: 'BP', value: latestVitals.systolicBp ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}` : null, danger: (latestVitals.systolicBp ?? 0) >= 140 },
            { label: 'HR', value: latestVitals.heartRateBpm ? `${latestVitals.heartRateBpm} bpm` : null, danger: false },
            { label: 'SpO₂', value: latestVitals.spo2Percent ? `${latestVitals.spo2Percent}%` : null, danger: (latestVitals.spo2Percent ?? 100) < 95 },
            { label: 'Temp', value: latestVitals.tempCelsius ? `${latestVitals.tempCelsius}°C` : null, danger: (latestVitals.tempCelsius ?? 37) > 38.5 },
          ].filter((v) => v.value).map(({ label, value, danger }) => (
            <div key={label} className={`rounded-lg p-2 border text-center ${danger ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
              <p className={`text-sm font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Record New Vitals</p>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {VITALS_FIELDS.map(({ key, label, unit, min, max }) => (
              <div key={key}>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {label} ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={min}
                  max={max}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="input input-sm"
                  placeholder={`${min}–${max}`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-xs h-8 px-4">
              {saving ? 'Saving…' : 'Save Vitals'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="btn-secondary text-xs h-8 px-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      <VitalsChart vitals={vitals} />
    </div>
  );
}

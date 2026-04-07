'use client';

import { useState, FormEvent, useEffect } from 'react';
import { AlertTriangle, Plus, X, Zap, ShieldAlert } from 'lucide-react';
import { api, type Allergy } from '@/lib/api';

const REACTION_TYPES = [
  { value: 'anaphylaxis',  label: 'Anaphylaxis' },
  { value: 'urticaria',    label: 'Urticaria (Hives)' },
  { value: 'angioedema',   label: 'Angioedema' },
  { value: 'rash',         label: 'Rash' },
  { value: 'gi_distress',  label: 'GI Distress' },
  { value: 'respiratory',  label: 'Respiratory' },
  { value: 'unknown',      label: 'Unknown' },
] as const;

const SEVERITIES = [
  { value: 'mild',             label: 'Mild',            color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'moderate',         label: 'Moderate',         color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'severe',           label: 'Severe',           color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'life_threatening', label: 'Life-Threatening',  color: 'bg-red-900 text-white border-red-700' },
] as const;

function getSeverityStyle(sev: string) {
  return SEVERITIES.find((s) => s.value === sev) ?? { color: 'bg-gray-100 text-gray-700 border-gray-300', label: sev };
}

interface AllergySectionProps {
  serviceNumber: string;
  /** Optional: pre-loaded allergies — if not provided, component fetches its own */
  initialAllergies?: Allergy[];
  onAllergiesChange?: (allergies: Allergy[]) => void;
}

export function AllergySection({ serviceNumber, initialAllergies, onAllergiesChange }: AllergySectionProps) {
  const [allergies, setAllergies] = useState<Allergy[]>(initialAllergies ?? []);
  const [loading, setLoading] = useState(!initialAllergies);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [allergen, setAllergen] = useState('');
  const [reactionType, setReactionType] = useState('rash');
  const [severity, setSeverity] = useState('mild');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialAllergies) {
      setAllergies(initialAllergies);
      return;
    }
    setLoading(true);
    api.listAllergies(serviceNumber)
      .then((res) => setAllergies(res.data ?? []))
      .catch((e) => console.error('Failed to load allergies:', e))
      .finally(() => setLoading(false));
  }, [serviceNumber, initialAllergies]);

  const activeAllergies = allergies.filter((a) => a.status === 'active');
  const hasLifeThreatening = activeAllergies.some((a) => a.severity === 'life_threatening');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allergen.trim()) { setError('Allergen name is required.'); return; }
    setError(null);
    setSaving(true);
    try {
      const created = await api.createAllergy(serviceNumber, {
        allergen: allergen.trim(),
        reactionType,
        severity,
        notes: notes.trim() || undefined,
      });
      const updated = [created, ...allergies];
      setAllergies(updated);
      onAllergiesChange?.(updated);
      setShowForm(false);
      setAllergen(''); setReactionType('rash'); setSeverity('mild'); setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save allergy.');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (allergy: Allergy) => {
    try {
      const updated = await api.updateAllergyStatus(serviceNumber, allergy.id, 'resolved');
      const next = allergies.map((a) => (a.id === allergy.id ? updated : a));
      setAllergies(next);
      onAllergiesChange?.(next);
    } catch (err) {
      console.error('Failed to update allergy status:', err);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-4 flex items-center gap-2 text-sm text-slate-400">
        <div className="h-4 w-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
        Loading allergies…
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 py-4">

      {/* ── Life-threatening banner ─────────────────────────── */}
      {hasLifeThreatening && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-900 border border-red-700 rounded-xl text-white"
          style={{ animation: 'pulseRing 1.8s ease-in-out infinite' }}>
          <Zap className="h-5 w-5 text-red-200 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-red-100">⚠ LIFE-THREATENING ALLERGY ON RECORD</p>
            <p className="text-xs text-red-200 mt-0.5">
              {activeAllergies.filter((a) => a.severity === 'life_threatening').map((a) => a.allergen).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Active allergy pills ────────────────────────────── */}
      {activeAllergies.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-500 mb-2">Active Allergies</p>
          <div className="flex flex-wrap gap-2">
            {activeAllergies.map((a) => {
              const style = getSeverityStyle(a.severity);
              return (
                <div key={a.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${style.color}`}
                  title={a.reactionType.replace(/_/g, ' ')}
                >
                  <ShieldAlert className="h-3 w-3 flex-shrink-0" />
                  <span>{a.allergen}</span>
                  <span className="opacity-70">({style.label})</span>
                  <button
                    onClick={() => handleResolve(a)}
                    className="ml-1 hover:opacity-60 transition-opacity"
                    title="Mark resolved"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Resolved list (collapsed) ────────────────────────── */}
      {allergies.filter((a) => a.status !== 'active').length > 0 && (
        <p className="text-xs text-slate-400">
          + {allergies.filter((a) => a.status !== 'active').length} resolved / unconfirmed
        </p>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {activeAllergies.length === 0 && !showForm && (
        <p className="text-sm text-slate-400">No active allergies on record.</p>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">{error}</div>
      )}

      {/* ── Add form ─────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">New Allergy Record</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Allergen *</label>
              <input
                type="text"
                value={allergen}
                onChange={(e) => setAllergen(e.target.value)}
                className="input input-sm w-full"
                placeholder="e.g. Penicillin, Sulfa, Latex"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Reaction Type *</label>
              <select
                value={reactionType}
                onChange={(e) => setReactionType(e.target.value)}
                className="input input-sm w-full"
              >
                {REACTION_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Severity *</label>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                    severity === s.value ? s.color + ' border-current shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input input-sm w-full"
              placeholder="Optional clinical notes"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary text-xs h-8 px-4 flex items-center gap-1.5 flex-shrink-0">
              {saving ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {saving ? 'Saving…' : 'Save Allergy'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="text-xs h-8 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Add button ───────────────────────────────────────── */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Allergy
        </button>
      )}
    </div>
  );
}

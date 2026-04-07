'use client';

import { useState, useEffect, FormEvent } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { api, type InjuryLog } from '@/lib/api';

interface InjuriesSectionProps {
  serviceNumber: string;
}

const INJURY_TYPES = ['FRACTURE', 'LACERATION', 'SPRAIN', 'BURN', 'CONCUSSION', 'DISLOCATION', 'OTHER'] as const;
const RECOVERY_STATUSES = ['ACTIVE', 'RECOVERING', 'RECOVERED'] as const;

export function InjuriesSection({ serviceNumber }: InjuriesSectionProps) {
  const [injuries, setInjuries] = useState<InjuryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    injuryType: 'FRACTURE',
    bodyPartAffected: '',
    injuryCause: '',
    recoveryStatus: 'ACTIVE',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listInjuries(serviceNumber);
        setInjuries(Array.isArray(res.data) ? res.data : []);
      } catch { /* non-fatal */ }
      finally { setLoading(false); }
    })();
  }, [serviceNumber]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.bodyPartAffected.trim()) { setError('Body part is required.'); return; }
    if (!form.injuryCause.trim()) { setError('Cause is required.'); return; }
    setError(null);
    setSaving(true);
    try {
      const newInjury = await api.logInjury(serviceNumber, {
        injuryType: form.injuryType,
        bodyPartAffected: form.bodyPartAffected,
        injuryCause: form.injuryCause,
        recoveryStatus: form.recoveryStatus,
        notes: form.notes || undefined,
        injuryDate: new Date().toISOString(),
      } as Partial<InjuryLog>);
      setInjuries((prev) => [newInjury, ...prev]);
      setShowForm(false);
      setForm({ injuryType: 'FRACTURE', bodyPartAffected: '', injuryCause: '', recoveryStatus: 'ACTIVE', notes: '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log injury.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const activeInjuries = injuries.filter((i) => i.recoveryStatus !== 'RECOVERED');
  const recoveredInjuries = injuries.filter((i) => i.recoveryStatus === 'RECOVERED');

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Injuries</h3>
          {activeInjuries.length > 0 && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
              {activeInjuries.length} active
            </span>
          )}
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-xs h-8 px-3">
          <Plus className="h-3.5 w-3.5" /> Log Injury
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Log New Injury</p>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 font-medium">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Injury Type</label>
              <select value={form.injuryType} onChange={(e) => update('injuryType', e.target.value)} className="input input-sm">
                {INJURY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Recovery Status</label>
              <select value={form.recoveryStatus} onChange={(e) => update('recoveryStatus', e.target.value)} className="input input-sm">
                {RECOVERY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Body Part *</label>
              <input value={form.bodyPartAffected} onChange={(e) => update('bodyPartAffected', e.target.value)} className="input input-sm" placeholder="e.g. Left knee" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Cause *</label>
              <input value={form.injuryCause} onChange={(e) => update('injuryCause', e.target.value)} className="input input-sm" placeholder="e.g. Training exercise" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
            <input value={form.notes} onChange={(e) => update('notes', e.target.value)} className="input input-sm" placeholder="Additional details..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-xs h-8 px-4">{saving ? 'Saving…' : 'Log Injury'}</button>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="btn-secondary text-xs h-8 px-4">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
      ) : injuries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No injuries on record.</p>
      ) : (
        <div className="space-y-2">
          {[...activeInjuries, ...recoveredInjuries].map((inj) => (
            <div key={inj.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
              inj.recoveryStatus === 'RECOVERED' ? 'bg-gray-50 border-gray-100' : 'bg-amber-50/50 border-amber-100'
            }`}>
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                inj.recoveryStatus === 'RECOVERED' ? 'bg-gray-200 text-gray-500' : 'bg-amber-200 text-amber-700'
              }`}>
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{inj.injuryType.replace(/_/g, ' ')}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inj.recoveryStatus === 'RECOVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {inj.recoveryStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{inj.bodyPartAffected} · {inj.injuryCause}</p>
                {inj.notes && <p className="text-xs text-gray-400 italic mt-0.5">{inj.notes}</p>}
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">
                {new Date(inj.injuryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

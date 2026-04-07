'use client';

import type { MedicalHistory } from '@/lib/api';

const severityConfig: Record<string, { badge: string; dot: string }> = {
  MILD:     { badge: 'badge-fit',      dot: 'bg-emerald-500' },
  MODERATE: { badge: 'badge-monitor',  dot: 'bg-amber-500' },
  SEVERE:   { badge: 'badge-critical', dot: 'bg-red-500' },
  CRITICAL: { badge: 'badge-critical', dot: 'bg-red-600' },
};

interface Props {
  records: MedicalHistory[];
}

export function MedicalTimeline({ records }: Props) {
  const sorted = [...records].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-400">No medical history recorded.</p>
      </div>
    );
  }

  return (
    <ol className="relative pl-6 space-y-4 border-l-2 border-gray-100 ml-2">
      {sorted.map((record, index) => {
        const cfg = severityConfig[record.severity] ?? severityConfig['MODERATE'];
        return (
          <li key={record.id} className={`relative ${index === sorted.length - 1 ? '' : 'pb-0'}`}>
            {/* Timeline dot */}
            <span className={`absolute -left-[25px] top-3.5 flex h-5 w-5 items-center justify-center rounded-full ${cfg.dot} ring-4 ring-slate-50 shadow-sm`}>
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm ring-1 ring-black/[0.02] hover:shadow transition-shadow duration-150">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{record.diagnosis}</p>
                  {record.icd10Code && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">ICD-10: {record.icd10Code}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cfg.badge}>{record.severity}</span>
                  <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                    {record.visitType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              {record.chiefComplaint && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{record.chiefComplaint}</p>
              )}
              {record.prescription && record.prescription.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Prescriptions</p>
                  <div className="flex flex-wrap gap-2">
                    {record.prescription.map((rx) => (
                      <span key={rx.id} className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-100/60 px-2.5 py-1 rounded-lg">
                        <span className="font-semibold">{rx.drugName}</span>
                        <span className="text-brand-400">{rx.dose}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-400">
                {new Date(record.visitDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

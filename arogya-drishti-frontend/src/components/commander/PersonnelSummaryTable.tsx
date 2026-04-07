'use client';

import { Users } from 'lucide-react';
import type { AnalyticsDeploymentReadiness } from '@/lib/api';

interface PersonnelSummaryTableProps {
  readiness: AnalyticsDeploymentReadiness;
}

export function PersonnelSummaryTable({ readiness }: PersonnelSummaryTableProps) {
  const breakdown = readiness.breakdown ?? {};
  const entries = Object.entries(breakdown);

  if (entries.length === 0) return null;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="flex items-center gap-3">
          <div className="kpi-icon kpi-icon-teal h-9 w-9 rounded-xl text-white flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Personnel Breakdown</h3>
            <p className="text-xs text-slate-400">{entries.length} categories</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              <th className="table-th text-left">Category</th>
              <th className="table-th text-right">Count</th>
              <th className="table-th text-right">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => {
              const total = (breakdown as Record<string, number>).total_personnel ?? (breakdown as Record<string, number>).total ?? 1;
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              const rowTint = key === 'permanently_unfit' ? 'status-row-critical'
                            : key === 'non_duty' ? 'status-row-warning'
                            : '';
              const pctNum = parseFloat(pct);
              return (
                <tr key={key} className={`border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60 ${rowTint}`}>
                  <td className="table-td py-3 text-sm text-slate-700 capitalize">{label}</td>
                  <td className="table-td py-3 text-sm font-bold text-right" style={{ color: '#0D9488' }}>{value}</td>
                  <td className="table-td py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Mini progress bar */}
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(pctNum, 100)}%`,
                            background: rowTint === 'status-row-critical'
                              ? 'linear-gradient(90deg, #EF4444, #F87171)'
                              : rowTint === 'status-row-warning'
                              ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                              : 'linear-gradient(90deg, #14B8A6, #06B6D4)',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

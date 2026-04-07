'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'fit' | 'monitor' | 'critical' | 'default' | 'teal';
  icon?: ReactNode;
  /** Renders as full teal-to-cyan gradient hero card (white text) */
  hero?: boolean;
  delta?: string;
  deltaPositive?: boolean;
}

const accentConfig: Record<NonNullable<StatCardProps['accent']>, {
  iconBg: string;
  valueColor: string;
  accentBar: string;
}> = {
  teal: {
    iconBg: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)',
    valueColor: '#0D9488',
    accentBar: 'linear-gradient(90deg, #14B8A6, #06B6D4)',
  },
  fit: {
    iconBg: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
    valueColor: '#15803D',
    accentBar: 'linear-gradient(90deg, #22C55E, #4ADE80)',
  },
  monitor: {
    iconBg: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
    valueColor: '#B45309',
    accentBar: 'linear-gradient(90deg, #F59E0B, #FCD34D)',
  },
  critical: {
    iconBg: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
    valueColor: '#DC2626',
    accentBar: 'linear-gradient(90deg, #EF4444, #F87171)',
  },
  default: {
    iconBg: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)',
    valueColor: '#334155',
    accentBar: 'linear-gradient(90deg, #94A3B8, #CBD5E1)',
  },
};

export function StatCard({ label, value, sub, accent = 'default', icon, hero = false, delta, deltaPositive }: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = accentConfig[accent];

  // Determine if value is purely numeric for count-up animation
  const numericEnd = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericEnd);

  // Count-up for numeric values (700ms, 0 decimals by default)
  const animatedValue = useCountUp({
    end: isNumeric ? numericEnd : 0,
    enabled: isNumeric,
    duration: 700,
  });

  const displayValue = isNumeric ? animatedValue : String(value);

  // Hero: full teal-to-cyan gradient card (white text)
  if (hero) {
    return (
      <div className="kpi-card-hero">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-2">{label}</p>
            <p className="text-3xl font-bold text-white leading-none tracking-tight">{displayValue}</p>
            {sub && <p className="mt-1.5 text-xs text-white/60">{sub}</p>}
            {delta && (
              <p className={`mt-2 text-xs font-semibold ${deltaPositive ? 'text-emerald-200' : 'text-red-200'}`}>
                {deltaPositive ? '▲' : '▼'} {delta}
              </p>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:-translate-y-0.5"
      style={{
        border: '1px solid rgba(226,232,240,0.8)',
        boxShadow: hovered
          ? '0 0 0 1px rgba(20,184,166,0.14), 0 8px 28px rgba(20,184,166,0.12), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 0 0 1px rgba(20,184,166,0.08), 0 4px 20px rgba(20,184,166,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 3px gradient accent bar */}
      <div style={{ height: '3px', background: cfg.accentBar }} aria-hidden="true" />

      <div className="p-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p
            className={`mt-2 text-3xl font-bold tracking-tight leading-none ${
              accent === 'critical' ? 'value-heartbeat' :
              accent === 'fit'      ? 'value-breathe'   : ''
            }`}
            style={{ color: cfg.valueColor }}
          >
            {displayValue}
          </p>
          {sub && <p className="mt-1.5 text-xs text-slate-400">{sub}</p>}
          {delta && (
            <p className={`mt-1.5 text-xs font-semibold ${deltaPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {deltaPositive ? '▲' : '▼'} {delta}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="kpi-icon flex-shrink-0 text-white"
            style={{ background: cfg.iconBg }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

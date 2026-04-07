'use client';

import type { Individual } from '@/lib/api';

const fitnessConfig: Record<string, { badge: string; dot: string }> = {
  FIT:      { badge: 'badge-fit',      dot: 'bg-emerald-400' },
  MONITOR:  { badge: 'badge-monitor',  dot: 'bg-amber-400' },
  CRITICAL: { badge: 'badge-critical', dot: 'bg-red-400' },
  UNFIT:    { badge: 'badge-critical', dot: 'bg-red-500' },
};

interface Props {
  individual: Individual;
  onClick?: () => void;
}

export function IndividualCard({ individual, onClick }: Props) {
  const cfg = fitnessConfig[individual.fitnessStatus ?? ''] ?? { badge: 'badge-monitor', dot: 'bg-amber-400' };
  const initials = individual.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 shadow-sm ring-1 ring-black/[0.03] ${
        onClick
          ? 'cursor-pointer hover:border-brand-200 hover:shadow-md hover:bg-brand-50/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500'
          : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs">
          {initials}
        </div>
        {individual.fitnessStatus && (
          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${cfg.dot}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{individual.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {individual.rank ? `${individual.rank} · ` : ''}{individual.serviceNumber}
        </p>
      </div>
      {individual.fitnessStatus && (
        <span className={`${cfg.badge} flex-shrink-0 text-[10px]`}>{individual.fitnessStatus}</span>
      )}
    </div>
  );
}

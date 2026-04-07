'use client';

import { PulseIndicator } from '@/components/ui/PulseIndicator';
import { useCountUp } from '@/hooks/useCountUp';
import type { LucideIcon } from 'lucide-react';

type VitalStatus = 'fit' | 'monitor' | 'critical';
type IconColour = 'teal' | 'green' | 'amber' | 'red' | 'indigo';

interface VitalCardProps {
  label: string;
  value: number;
  unit: string;
  normalRange: string;
  icon: LucideIcon;
  iconColour?: IconColour;
  status: VitalStatus;
  animationDelay?: number;
  className?: string;
}

// Maps to existing kpi-icon-* CSS classes in globals.css
const ICON_CLASS: Record<IconColour, string> = {
  teal:   'kpi-icon kpi-icon-teal',
  green:  'kpi-icon kpi-icon-green',
  amber:  'kpi-icon kpi-icon-amber',
  red:    'kpi-icon kpi-icon-red',
  indigo: 'kpi-icon kpi-icon-indigo',
};

export function VitalCard({
  label,
  value,
  unit,
  normalRange,
  icon: Icon,
  iconColour = 'teal',
  status,
  animationDelay = 0,
  className = '',
}: VitalCardProps) {
  const animatedValue = useCountUp({ end: value, duration: 700, delay: animationDelay });

  return (
    <div
      className={`kpi-card animate-slide-up ${className}`}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${ICON_CLASS[iconColour]} text-white flex-shrink-0`}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <PulseIndicator status={status} size="sm" />
      </div>

      <p
        className="text-2xl font-bold text-slate-800 tabular-nums"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {animatedValue}
        <span className="text-sm font-semibold text-slate-400 ml-1">{unit}</span>
      </p>
      <p className="text-xs font-semibold text-slate-700 mt-1">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">Normal: {normalRange}</p>
    </div>
  );
}

'use client';

import { PulseIndicator } from './PulseIndicator';

type BadgeStatus = 'fit' | 'monitor' | 'critical';
type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: BadgeSize;
  className?: string;
}

// Maps to existing CSS classes in globals.css
const BADGE_CLASS: Record<BadgeStatus, string> = {
  fit:      'badge-fit',
  monitor:  'badge-monitor',
  critical: 'badge-critical',
};

const DEFAULT_LABEL: Record<BadgeStatus, string> = {
  fit:      'Fit',
  monitor:  'Monitor',
  critical: 'Critical',
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function StatusBadge({ status, label, size = 'md', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${BADGE_CLASS[status]} ${SIZE_CLASS[size]} ${className}`}
    >
      <PulseIndicator status={status} size="xs" />
      {label ?? DEFAULT_LABEL[status]}
    </span>
  );
}

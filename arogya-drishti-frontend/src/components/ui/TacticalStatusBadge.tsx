'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'operational' | 'degraded' | 'critical' | 'offline' | 'fit' | 'monitor' | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  icon?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<StatusType, {
  className: string;
  indicator: ReactNode;
}> = {
  operational: {
    className: 'badge-success',
    indicator: <div className="w-2 h-2 bg-current rounded-full" />,
  },
  degraded: {
    className: 'badge-warning',
    indicator: <div className="w-2 h-2 bg-current rounded-full" />,
  },
  critical: {
    className: 'badge-danger',
    indicator: <div className="w-2 h-2 bg-current rounded-full animate-pulse" />,
  },
  offline: {
    className: 'badge-secondary',
    indicator: <div className="w-2 h-2 border border-current rounded-full" />,
  },
  fit: {
    className: 'badge-success',
    indicator: <div className="w-2 h-2 bg-current rounded-full" />,
  },
  monitor: {
    className: 'badge-warning',
    indicator: <div className="w-2 h-2 bg-current rounded-full" />,
  },
  warning: {
    className: 'badge-warning',
    indicator: <div className="w-2 h-2 bg-current rounded-full" />,
  },
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function StatusBadge({ 
  status, 
  label, 
  icon, 
  className,
  size = 'md'
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span 
      className={cn(
        'badge',
        config.className,
        sizes[size],
        className
      )}
    >
      {icon || config.indicator}
      <span>{displayLabel}</span>
    </span>
  );
}

// Live indicator variants
export function LiveIndicator({ 
  type = 'live',
  label,
  className 
}: {
  type?: 'live' | 'syncing' | 'offline';
  label?: string;
  className?: string;
}) {
  const indicators = {
    live: 'badge-success',
    syncing: 'badge-warning',
    offline: 'badge-secondary',
  };
  
  const labels = {
    live: 'Live',
    syncing: 'Syncing',
    offline: 'Offline',
  };
  
  return (
    <span className={cn('badge', indicators[type], 'text-xs', className)}>
      <div className={cn(
        'w-1.5 h-1.5 rounded-full',
        type === 'live' && 'bg-current animate-pulse-slow',
        type === 'syncing' && 'bg-current animate-pulse',
        type === 'offline' && 'border border-current'
      )} />
      <span>{label || labels[type]}</span>
    </span>
  );
}

// Legacy exports for compatibility
export { StatusBadge as TacticalStatusBadge };
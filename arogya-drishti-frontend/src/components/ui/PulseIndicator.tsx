'use client';

/** Animated status dot. Uses keyframes already defined in globals.css */

type IndicatorStatus = 'fit' | 'monitor' | 'critical' | 'online' | 'offline';
type IndicatorSize = 'xs' | 'sm' | 'md';

interface PulseIndicatorProps {
  status: IndicatorStatus;
  size?: IndicatorSize;
  className?: string;
}

const STATUS_CONFIG: Record<IndicatorStatus, {
  dotColor: string;
  animation: string;
  hasRing: boolean;
  ringColor: string;
}> = {
  fit:      { dotColor: 'bg-success-500',  animation: '',                                           hasRing: false, ringColor: '' },
  monitor:  { dotColor: 'bg-warning-500',  animation: 'animate-breathe',                            hasRing: false, ringColor: '' },
  critical: { dotColor: 'bg-danger-500',   animation: '',                                           hasRing: true,  ringColor: 'bg-danger-500' },
  online:   { dotColor: 'bg-success-500',  animation: 'animate-breathe',                            hasRing: false, ringColor: '' },
  offline:  { dotColor: 'bg-slate-400',    animation: '',                                           hasRing: false, ringColor: '' },
};

// animate-pulse-ring uses the pulseRing keyframe defined in globals.css
// animate-breathe uses the breathe keyframe defined in globals.css

const DOT_SIZE: Record<IndicatorSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
};

const RING_SIZE: Record<IndicatorSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
};

export function PulseIndicator({ status, size = 'sm', className = '' }: PulseIndicatorProps) {
  const { dotColor, animation, hasRing, ringColor } = STATUS_CONFIG[status];

  return (
    <span className={`relative flex-shrink-0 inline-flex items-center justify-center ${className}`}>
      {hasRing && (
        <span
          className={`absolute ${RING_SIZE[size]} ${ringColor} rounded-full opacity-40 animate-pulse-ring`}
          aria-hidden="true"
        />
      )}
      <span className={`${DOT_SIZE[size]} ${dotColor} rounded-full ${animation} flex-shrink-0`} />
    </span>
  );
}

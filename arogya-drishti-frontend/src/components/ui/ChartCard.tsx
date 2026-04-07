'use client';

import { useState } from 'react';

type TimeRange = 'today' | 'week' | 'month';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showRangePicker?: boolean;         // default true
  defaultRange?: TimeRange;          // default 'week'
  onRangeChange?: (range: TimeRange) => void;
  headerRight?: React.ReactNode;     // optional extra content in header right slot
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week',  value: 'week'  },
  { label: 'Month', value: 'month' },
];

export function ChartCard({
  title,
  subtitle,
  children,
  className = '',
  showRangePicker = true,
  defaultRange = 'week',
  onRangeChange,
  headerRight,
}: ChartCardProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>(defaultRange);

  function handleRange(range: TimeRange) {
    setActiveRange(range);
    onRangeChange?.(range);
  }

  return (
    <div className={`chart-card ${className}`}>
      {/* Header */}
      <div className="chart-card-header">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerRight}

          {showRangePicker && (
            <div
              className="flex items-center gap-1 bg-slate-100 rounded-xl p-1"
              role="group"
              aria-label="Time range selector"
            >
              {RANGES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => handleRange(value)}
                  className={activeRange === value ? 'chart-time-pill chart-time-pill-active' : 'chart-time-pill'}
                  aria-pressed={activeRange === value}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart content */}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

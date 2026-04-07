'use client';

import type { ReactNode } from 'react';
import { cn, formatValue } from '@/lib/utils';
import { Card } from './GlassCard';
import { StatusBadge, LiveIndicator } from './TacticalStatusBadge';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  status?: 'operational' | 'degraded' | 'critical' | 'offline';
  icon?: ReactNode;
  className?: string;
  elevated?: boolean;
  live?: boolean;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  onClick?: () => void;
}

const trendIcons = {
  up: '↗',
  down: '↘', 
  stable: '→',
};

const trendColors = {
  up: 'text-success-600 dark:text-success-400',
  down: 'text-danger-600 dark:text-danger-400',
  stable: 'text-gray-500 dark:text-gray-400',
};

export function StatCard({
  label,
  value,
  unit,
  subtitle,
  status,
  icon,
  className,
  elevated = false,
  live = false,
  trend,
  trendValue,
  onClick,
}: StatCardProps) {
  const isClickable = !!onClick;
  
  const formattedValue = typeof value === 'number' ? formatValue(value, unit) : value;
  
  return (
    <Card 
      className={cn(
        'stat-card',
        isClickable && 'cursor-pointer hover:shadow-card-hover',
        elevated && 'shadow-lg',
        className
      )}
      variant={elevated ? 'elevated' : 'default'}
      hover={isClickable}
      onClick={onClick}
    >
      {/* Header with label and indicators */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="section-title">{label}</h3>
            {live && <LiveIndicator type="live" className="text-xs" />}
          </div>
          {subtitle && (
            <p className="section-subtitle mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {status && (
          <StatusBadge 
            status={status} 
            size="sm"
            className="ml-2"
          />
        )}
      </div>
      
      {/* Main content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Value */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="metric-value">
              {formattedValue}
            </span>
            {trend && (
              <span className={cn(
                'text-lg font-medium',
                trendColors[trend]
              )}>
                {trendIcons[trend]}
              </span>
            )}
          </div>
          
          {/* Trend info */}
          {trend && trendValue && (
            <p className={cn(
              'text-sm font-medium',
              trendColors[trend]
            )}>
              {trendValue}
            </p>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <div className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
            'bg-primary-50 dark:bg-primary-900/20'
          )}>
            <span className="text-primary-600 dark:text-primary-400">
              {icon}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Specialized variants
export function MetricCard({
  metric,
  value,
  target,
  unit,
  ...props
}: {
  metric: string;
  value: number;
  target?: number;
  unit?: string;
} & Omit<StatCardProps, 'label' | 'value' | 'unit'>) {
  const percentage = target ? Math.round((value / target) * 100) : null;
  const status = target && percentage !== null ? (
    percentage >= 90 ? 'operational' :
    percentage >= 70 ? 'degraded' : 'critical'
  ) : undefined;
  
  return (
    <StatCard
      label={metric}
      value={value}
      unit={unit}
      subtitle={target ? `Target: ${target}${unit || ''}` : undefined}
      status={status}
      {...props}
    />
  );
}

export function ReadinessCard({
  grade,
  percentage,
  total,
  ...props
}: {
  grade: string;
  percentage: number;
  total: number;
} & Omit<StatCardProps, 'label' | 'value' | 'subtitle'>) {
  const status = percentage >= 90 ? 'operational' :
                percentage >= 70 ? 'degraded' : 'critical';
  
  return (
    <StatCard
      label="Readiness Grade"
      value={grade}
      subtitle={`${percentage}% of ${total} personnel`}
      status={status}
      elevated={status === 'critical'}
      live
      {...props}
    />
  );
}

// Legacy exports for compatibility
export { StatCard as TacticalStatCard };
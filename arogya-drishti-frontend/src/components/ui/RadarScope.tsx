'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  size?: number;
  children?: ReactNode;
  className?: string;
  title?: string;
}

interface DataPointProps {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage 
  type?: 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  active?: boolean;
  className?: string;
}

const pointColors = {
  success: 'bg-success-500 border-success-600',
  warning: 'bg-warning-500 border-warning-600',
  danger: 'bg-danger-500 border-danger-600',
  info: 'bg-primary-500 border-primary-600',
};

const pointSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function ChartContainer({
  size = 300,
  children,
  className,
  title,
}: ChartContainerProps) {
  return (
    <div className={cn('chart-container', className)}>
      {title && (
        <div className="mb-4">
          <h3 className="section-title">{title}</h3>
        </div>
      )}
      <div 
        className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700"
        style={{ width: size, height: size }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0">
          {/* Horizontal lines */}
          {[25, 50, 75].map(percent => (
            <div
              key={`h-${percent}`}
              className="absolute w-full border-t border-gray-200 dark:border-gray-700 opacity-50"
              style={{ top: `${percent}%` }}
            />
          ))}
          
          {/* Vertical lines */}
          {[25, 50, 75].map(percent => (
            <div
              key={`v-${percent}`}
              className="absolute h-full border-l border-gray-200 dark:border-gray-700 opacity-50"
              style={{ left: `${percent}%` }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DataPoint({
  x,
  y,
  type = 'info',
  size = 'md',
  label,
  active = false,
  className,
}: DataPointProps) {
  const left = `${Math.max(0, Math.min(100, x))}%`;
  const top = `${Math.max(0, Math.min(100, y))}%`;
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left, top }}
    >
      <div
        className={cn(
          'rounded-full border-2 shadow-sm transition-all duration-200',
          pointSizes[size],
          pointColors[type],
          active && 'animate-pulse scale-110',
          'hover:scale-125 cursor-pointer',
          className
        )}
        title={label}
      />
      {label && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 pointer-events-none">
          <span className="text-xs font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

// Clean replacement for tactical components
export function DataVisualization({
  data,
  ...props
}: {
  data: Array<{
    id: string;
    x: number;
    y: number;
    type: 'success' | 'warning' | 'danger' | 'info';
    label?: string;
    status?: 'operational' | 'degraded' | 'critical' | 'offline';
  }>;
} & Omit<ChartContainerProps, 'children'>) {
  const statusToType = {
    operational: 'success' as const,
    degraded: 'warning' as const, 
    critical: 'danger' as const,
    offline: 'info' as const,
  };
  
  return (
    <ChartContainer {...props}>
      {data.map(point => (
        <DataPoint
          key={point.id}
          x={point.x}
          y={point.y}
          type={point.status ? statusToType[point.status] : point.type}
          label={point.label}
          active={point.status === 'critical'}
        />
      ))}
    </ChartContainer>
  );
}

// Legacy exports for compatibility
export { ChartContainer as RadarScope };
export { DataPoint as RadarBlip };
export { DataVisualization as ThreatRadar };
export { DataVisualization as PersonnelRadar };
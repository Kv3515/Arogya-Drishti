'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { 
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

import type { Individual, VitalsLog } from '@/lib/api';
import { 
  processVitalsForChart,
  getVitalThresholds,
  generateVitalAlerts,
  calculateVitalTrends,
  getDateRangeFromFilter,
  type VitalMetric,
  type DateRangeFilter,
  type ProcessedVitalData,
  type DateRange
} from '@/lib/health/calculations';

interface VitalsMonitoringSectionProps {
  vitalsData: VitalsLog[];
  individual: Individual;
  className?: string;
}

interface VitalsState {
  dateRange: DateRangeFilter;
  customDateRange: DateRange;
  selectedMetrics: Set<VitalMetric>;
  showThresholds: boolean;
}

// Apollo 5-colour chart palette: teal-primary, red, blue, green, amber
const METRIC_COLORS = {
  'BP Systolic':  '#EF4444', // red — danger signal
  'BP Diastolic': '#F87171', // red-light
  'Heart Rate':   '#14B8A6', // teal-primary — most prominent vital
  'SpO₂':         '#22C55E', // green — good = green semantics
  'Temperature':  '#F59E0B', // amber — warning threshold
} as const;

const METRIC_LABELS: Record<string, VitalMetric> = {
  'BP Systolic': 'systolic',
  'BP Diastolic': 'diastolic',
  'Heart Rate': 'heartRate',
  'SpO₂': 'spo2',
  'Temperature': 'temperature',
};

export function VitalsMonitoringSection({ 
  vitalsData, 
  individual, 
  className = '' 
}: VitalsMonitoringSectionProps) {
  const [state, setState] = useState<VitalsState>({
    dateRange: '30d',
    customDateRange: {
      start: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)),
      end: new Date()
    },
    selectedMetrics: new Set(['systolic', 'diastolic', 'heartRate', 'spo2']),
    showThresholds: true,
  });

  // Process data for current date range
  const chartData = useMemo(() => {
    const dateRange = getDateRangeFromFilter(
      state.dateRange, 
      state.dateRange === 'custom' ? state.customDateRange : undefined
    );
    return processVitalsForChart(vitalsData, dateRange);
  }, [vitalsData, state.dateRange, state.customDateRange]);

  // Generate current health alerts
  const vitalAlerts = useMemo(() => {
    return generateVitalAlerts(vitalsData);
  }, [vitalsData]);

  // Calculate trends
  const vitalTrends = useMemo(() => {
    return calculateVitalTrends(vitalsData);
  }, [vitalsData]);

  const handleDateRangeChange = (range: DateRangeFilter) => {
    setState(prev => ({ ...prev, dateRange: range }));
  };

  const handleCustomDateChange = (field: 'start' | 'end', date: Date) => {
    setState(prev => ({
      ...prev,
      customDateRange: {
        ...prev.customDateRange,
        [field]: date
      }
    }));
  };

  const handleMetricToggle = (metric: VitalMetric) => {
    setState(prev => {
      const newMetrics = new Set(prev.selectedMetrics);
      if (newMetrics.has(metric)) {
        newMetrics.delete(metric);
      } else {
        newMetrics.add(metric);
      }
      return { ...prev, selectedMetrics: newMetrics };
    });
  };

  const toggleThresholds = () => {
    setState(prev => ({ ...prev, showThresholds: !prev.showThresholds }));
  };

  const formatTooltipLabel = (label: string | number | undefined, payload: any): string => {
    if (payload && payload.length > 0 && payload[0].payload) {
      return payload[0].payload.formattedDate;
    }
    return label?.toString() || '';
  };

  const renderTrendIcon = (trend: 'improving' | 'worsening' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'worsening':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  // Empty state
  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-xl border overflow-hidden ${className}`}>
        <div className="ecg-strip rounded-t-xl opacity-50" aria-hidden="true" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Vitals Monitoring</h3>
              <p className="text-sm text-gray-500">Track vital signs trends over time</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center h-48 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            No vitals recorded yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`chart-card overflow-hidden ${className}`}
      role="group"
      aria-label="Vitals Monitoring Dashboard"
    >
      {/* ECG decorative strip at top */}
      <div className="ecg-strip" aria-hidden="true" />

      {/* Header */}
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="kpi-icon kpi-icon-teal h-10 w-10 rounded-xl text-white flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Vitals Trends</h3>
                <span className="live-system-badge">Live</span>
              </div>
              <p className="text-xs text-slate-400">{chartData.length} recordings in selected period</p>
            </div>
          </div>

          <button
            onClick={toggleThresholds}
            className="chart-time-pill flex items-center gap-1.5"
            role="switch"
            aria-checked={state.showThresholds}
            aria-label="Show threshold bands"
          >
            {state.showThresholds ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Thresholds
          </button>
        </div>

        {/* Date Range Controls */}
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-slate-400" />
          <div className="flex gap-1" role="group" aria-label="Date range selection">
            {(['7d', '30d', '90d', 'custom'] as DateRangeFilter[]).map((range) => (
              <button
                key={range}
                onClick={() => handleDateRangeChange(range)}
                className={state.dateRange === range ? 'chart-time-pill chart-time-pill-active' : 'chart-time-pill'}
                aria-pressed={state.dateRange === range}
              >
                {range === '7d' ? '7 Days' :
                 range === '30d' ? '30 Days' :
                 range === '90d' ? '90 Days' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {state.dateRange === 'custom' && (
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label htmlFor="start-date" className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={state.customDateRange.start.toISOString().split('T')[0]}
                onChange={(e) => handleCustomDateChange('start', new Date(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={state.customDateRange.end.toISOString().split('T')[0]}
                onChange={(e) => handleCustomDateChange('end', new Date(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        )}

        {/* Metric Selection */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700 mr-2">Metrics:</span>
          <div className="flex gap-3" role="group" aria-label="Metric selection">
            {Object.entries(METRIC_LABELS).map(([label, metric]) => (
              <label key={metric} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.selectedMetrics.has(metric)}
                  onChange={() => handleMetricToggle(metric)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={label}
                />
                <span 
                  className="text-sm"
                  style={{ color: METRIC_COLORS[label as keyof typeof METRIC_COLORS] }}
                >
                  {label}
                </span>
                {renderTrendIcon(vitalTrends[metric])}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Health Alerts */}
      {vitalAlerts.length > 0 && (
        <div className="p-6 bg-amber-50 border-b">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Health Alerts</span>
          </div>
          <div className="space-y-2">
            {vitalAlerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  alert.type === 'critical' 
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : alert.type === 'warning'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'  
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            role="img"
            aria-label={`Vitals trend chart showing ${Array.from(state.selectedMetrics).join(', ')} over ${state.dateRange}`}
            aria-describedby="vitals-chart-description"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#9CA3AF' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#9CA3AF' }} 
              axisLine={false} 
              tickLine={false} 
              width={40}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium text-gray-900 mb-2">
                        {formatTooltipLabel(label, payload)}
                      </p>
                      {payload
                        .filter(p => p.value !== null && p.value !== undefined)
                        .map((p, index) => (
                          <p key={`${p.dataKey?.toString()}-${index}`} style={{ color: p.color }} className="text-sm">
                            {p.dataKey?.toString()}: {p.value}
                            {p.dataKey?.toString().includes('BP') ? ' mmHg' :
                             p.dataKey === 'Heart Rate' ? ' bpm' :
                             p.dataKey === 'SpO₂' ? '%' :
                             p.dataKey === 'Temperature' ? '°F' : ''}
                          </p>
                        ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: 12, paddingTop: 16 }} 
              iconType="line"
            />
            
            {/* Threshold bands (if enabled) */}
            {state.showThresholds && (
              <>
                {/* Blood pressure normal ranges */}
                {state.selectedMetrics.has('systolic') && (
                  <ReferenceArea 
                    y1={90} 
                    y2={120} 
                    fill="#10B981" 
                    fillOpacity={0.1}
                    stroke="none"
                  />
                )}
                {/* Add other threshold bands as needed */}
              </>
            )}

            {/* Lines for each selected metric */}
            {Object.entries(METRIC_COLORS).map(([metric, color]) => {
              const vitalMetric = METRIC_LABELS[metric];
              if (!state.selectedMetrics.has(vitalMetric)) return null;
              
              return (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  strokeDasharray={chartData.length > 50 ? "2 2" : undefined} // Dash for large datasets
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        
        <div id="vitals-chart-description" className="sr-only">
          Interactive chart displaying vital signs trends over the selected time period.
          Use the controls above to filter by date range and select which metrics to display.
          Hover over data points for detailed values.
        </div>
      </div>
    </div>
  );
}
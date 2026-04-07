'use client';

import React, { useMemo } from 'react';
import { 
  Activity, 
  FileText, 
  Bandage, 
  Pill,
  TrendingUp,
  Clock,
  Users2,
  AlertCircle
} from 'lucide-react';
import { GlassCard, TacticalStatusBadge, LiveIndicator } from '@/components/ui';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface UnitActivity {
  date: string;
  vitals: number;
  medical_visits: number;
  injuries: number;
  prescriptions: number;
  total: number;
}

interface ActivityTotals {
  total_vitals_entries: number;
  total_medical_visits: number;
  total_injuries: number;
  total_prescriptions: number;
  total_activity: number;
}

interface UnitActivityStreamProps {
  unitName?: string;
  dailyActivity: UnitActivity[];
  totals: ActivityTotals;
  isLoading?: boolean;
  lastUpdated?: string;
}

export function UnitActivityStream({
  unitName = 'Unit',
  dailyActivity,
  totals,
  isLoading = false,
  lastUpdated
}: UnitActivityStreamProps) {
  // Prepare chart data (reverse to show oldest to newest left-to-right)
  const chartData = useMemo(() => {
    return dailyActivity
      .slice()
      .reverse()
      .slice(-14) // Last 14 days for visibility
      .map((day) => ({
        ...day,
        // Format date for display
        displayDate: new Date(day.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
      }));
  }, [dailyActivity]);

  // Calculate activity trends
  const activityTrend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    const recent = chartData.slice(-3).reduce((sum, day) => sum + day.total, 0);
    const previous = chartData.slice(-6, -3).reduce((sum, day) => sum + day.total, 0);
    if (recent > previous * 1.2) return 'up';
    if (recent < previous * 0.8) return 'down';
    return 'stable';
  }, [chartData]);

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">UNIT MEDICAL ACTIVITY STREAM</h2>
          <LiveIndicator type="syncing" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-tactical-crimson dark:text-nvg-green" />
          <h2 className="section-title">UNIT MEDICAL ACTIVITY STREAM</h2>
          <TacticalStatusBadge 
            status={totals.total_activity > 0 ? "operational" : "offline"} 
            label="LAST 30 DAYS" 
          />
        </div>
        <div className="flex items-center gap-2">
          <LiveIndicator 
            type={activityTrend === 'up' ? 'live' : activityTrend === 'down' ? 'offline' : 'syncing'} 
            label={`TREND ${activityTrend.toUpperCase()}`} 
          />
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {new Date(lastUpdated).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-bg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">VITALS</span>
              </div>
              <div className="text-lg font-tactical-bold text-gray-900 dark:text-gray-100">
                {totals.total_vitals_entries}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-bg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">VISITS</span>
              </div>
              <div className="text-lg font-tactical-bold text-gray-900 dark:text-gray-100">
                {totals.total_medical_visits}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-bg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bandage className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">INJURIES</span>
              </div>
              <div className="text-lg font-tactical-bold text-gray-900 dark:text-gray-100">
                {totals.total_injuries}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-bg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Pill className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">RX</span>
              </div>
              <div className="text-lg font-tactical-bold text-gray-900 dark:text-gray-100">
                {totals.total_prescriptions}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Trend Chart */}
      {chartData.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Daily Activity Volume — Last 14 Days
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users2 className="h-3 w-3" />
              <span>Unit: {unitName}</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="totalActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B2635" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B2635" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="vitalsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(139, 38, 53, 0.1)" 
                className="dark:stroke-nvg-green/10"
                vertical={false} 
              />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10, fill: 'currentColor' }} 
                className="text-gray-400"
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'currentColor' }} 
                className="text-gray-400"
                axisLine={false} 
                tickLine={false} 
                allowDecimals={false} 
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid rgba(139, 38, 53, 0.2)',
                  fontSize: 11,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={(value) => `Date: ${value}`}
                formatter={(value, name) => [
                  value ?? 0,
                  name === 'total' ? 'Total Activity' : 
                  name === 'vitals' ? 'Vitals Logged' :
                  name === 'medical_visits' ? 'Medical Visits' :
                  name === 'injuries' ? 'Injuries' : 'Prescriptions'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stackId="1"
                stroke="#8B2635" 
                strokeWidth={2}
                fill="url(#totalActivity)" 
                className="dark:stroke-nvg-green"
              />
              <Area 
                type="monotone" 
                dataKey="vitals" 
                stackId="2"
                stroke="#3B82F6" 
                strokeWidth={1}
                fill="url(#vitalsGradient)" 
                strokeOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="medical_visits" 
                stackId="2"
                stroke="#10B981" 
                strokeWidth={1}
                fill="url(#visitsGradient)" 
                strokeOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">No activity data available</span>
          <TacticalStatusBadge status="offline" className="mt-2" />
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          📊 AGGREGATE DATA ONLY — NO INDIVIDUAL MEDICAL INFORMATION DISCLOSED
        </p>
      </div>
    </GlassCard>
  );
}
'use client';

import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
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
  Scale,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  Calendar,
  BarChart3
} from 'lucide-react';

import type { Individual, VitalsLog } from '@/lib/api';
import { 
  processWeightData,
  calculateWeightProgress,
  generateWeightInsights,
  determineWeightChangeRate,
  getBMICategory,
  getBMIColor,
  type WeightDisplayMode,
  type WeightTimeframe,
  type ProcessedWeightData
} from '@/lib/health/calculations';

interface WeightTrendChartProps {
  vitalsData: VitalsLog[];
  individual: Individual;
  targetWeight?: number;
  targetBMI?: number;
  className?: string;
}

interface WeightChartState {
  displayMode: WeightDisplayMode;
  showGoals: boolean;
  timeframe: WeightTimeframe;
}

const DISPLAY_MODE_CONFIG = {
  weight: { label: 'Weight', color: '#2563EB', yAxisId: 'weight' },
  bmi: { label: 'BMI', color: '#10B981', yAxisId: 'bmi' },
  both: { label: 'Both', color: '#6366F1', yAxisId: 'both' }
};

const TIMEFRAME_LABELS = {
  '3m': '3 Months',
  '6m': '6 Months', 
  '1y': '1 Year',
  'all': 'All Time'
};

export function WeightTrendChart({ 
  vitalsData, 
  individual, 
  targetWeight, 
  targetBMI, 
  className = '' 
}: WeightTrendChartProps) {
  const [state, setState] = useState<WeightChartState>({
    displayMode: 'both',
    showGoals: true,
    timeframe: '6m'
  });

  // Process weight data for current timeframe
  const weightData = useMemo(() => {
    return processWeightData(vitalsData, individual, state.timeframe);
  }, [vitalsData, individual, state.timeframe]);

  // Calculate progress statistics
  const progress = useMemo(() => {
    return calculateWeightProgress(weightData, targetWeight, targetBMI);
  }, [weightData, targetWeight, targetBMI]);

  // Generate insights
  const insights = useMemo(() => {
    return progress ? generateWeightInsights(progress, targetWeight, targetBMI) : [];
  }, [progress, targetWeight, targetBMI]);

  const handleDisplayModeChange = (mode: WeightDisplayMode) => {
    setState(prev => ({ ...prev, displayMode: mode }));
  };

  const handleTimeframeChange = (timeframe: WeightTimeframe) => {
    setState(prev => ({ ...prev, timeframe }));
  };

  const toggleGoals = () => {
    setState(prev => ({ ...prev, showGoals: !prev.showGoals }));
  };

  const formatTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.formattedDate}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} style={{ color: p.color }} className="text-sm">
              {p.dataKey === 'weightKg' ? `Weight: ${p.value} kg` :
               p.dataKey === 'bmi' ? `BMI: ${p.value} (${data.bmiCategory})` : 
               `${p.dataKey}: ${p.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderProgressIcon = () => {
    if (!progress) return <Minus className="h-4 w-4 text-gray-400" />;
    
    if (progress.weightChange < -0.5) {
      return <TrendingDown className="h-4 w-4 text-green-500" />; // Weight loss = good
    } else if (progress.weightChange > 0.5) {
      return <TrendingUp className="h-4 w-4 text-amber-500" />; // Weight gain = caution
    }
    return <Minus className="h-4 w-4 text-gray-400" />; // Stable
  };

  // Empty state
  if (weightData.length === 0) {
    return (
      <div className={`bg-white rounded-xl border p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Scale className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Weight Tracking</h3>
            <p className="text-sm text-gray-500">Monitor weight and BMI trends</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-48 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          No weight records available.
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl border ${className}`}
      role="group" 
      aria-label="Weight Tracking Dashboard"
    >
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Scale className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Weight & BMI Trends</h3>
              <p className="text-sm text-gray-500">
                {weightData.length} recordings over {state.timeframe === 'all' ? 'all time' : TIMEFRAME_LABELS[state.timeframe].toLowerCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(targetWeight || targetBMI) && (
              <button
                onClick={toggleGoals}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                role="switch"
                aria-checked={state.showGoals}
                aria-label="Show goal lines"
              >
                {state.showGoals ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Goals
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Display Mode */}
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 mr-2">Display:</span>
            <div className="flex gap-1" role="group" aria-label="Display mode selection">
              {(Object.keys(DISPLAY_MODE_CONFIG) as WeightDisplayMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleDisplayModeChange(mode)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    state.displayMode === mode
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-pressed={state.displayMode === mode}
                >
                  {DISPLAY_MODE_CONFIG[mode].label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 mr-2">Period:</span>
            <div className="flex gap-1" role="group" aria-label="Timeframe selection">
              {(Object.keys(TIMEFRAME_LABELS) as WeightTimeframe[]).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => handleTimeframeChange(timeframe)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    state.timeframe === timeframe
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-pressed={state.timeframe === timeframe}
                >
                  {TIMEFRAME_LABELS[timeframe]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {progress && (
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Current Status</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold" style={{ color: getBMIColor(progress.currentBMI) }}>
                  {progress.currentWeight} kg
                </p>
                <p className="text-sm text-gray-600">
                  BMI {progress.currentBMI.toFixed(1)} ({getBMICategory(progress.currentBMI)})
                </p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {renderProgressIcon()}
                <span className="text-sm font-medium text-gray-700">Progress</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {progress.weightChange > 0 ? '+' : ''}{progress.weightChange.toFixed(1)} kg
                </p>
                <p className="text-sm text-gray-600">
                  {Math.abs(progress.weightChangeRate).toFixed(1)} kg/month rate
                </p>
                {progress.progressToGoal !== undefined && (
                  <p className="text-sm font-medium text-blue-600">
                    {progress.progressToGoal.toFixed(0)}% progress to goal
                  </p>
                )}
              </div>
            </div>

            {/* Goals */}
            {(targetWeight || targetBMI) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Targets</span>
                </div>
                <div className="space-y-1">
                  {targetWeight && (
                    <p className="text-sm text-gray-600">Weight: {targetWeight} kg</p>
                  )}
                  {targetBMI && (
                    <p className="text-sm text-gray-600">BMI: {targetBMI}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Insights</h4>
              <div className="flex flex-wrap gap-2">
                {insights.map((insight, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {insight}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart 
            data={weightData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            role="img"
            aria-label={`Weight trend chart showing ${state.displayMode} over ${state.timeframe}`}
            aria-describedby="weight-chart-description"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#9CA3AF' }} 
              axisLine={false} 
              tickLine={false} 
            />
            
            {/* Dual Y-axes for weight and BMI */}
            {(state.displayMode === 'weight' || state.displayMode === 'both') && (
              <YAxis 
                yAxisId="weight"
                orientation="left"
                domain={['dataMin - 2', 'dataMax + 2']}
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 11, fill: '#2563EB' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
            )}
            
            {(state.displayMode === 'bmi' || state.displayMode === 'both') && (
              <YAxis 
                yAxisId="bmi"
                orientation="right"
                domain={[16, 35]}
                label={{ value: 'BMI', angle: 90, position: 'insideRight' }}
                tick={{ fontSize: 11, fill: '#10B981' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
            )}

            <Tooltip content={formatTooltipContent} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />

            {/* BMI Category Reference Areas (if showing BMI) */}
            {(state.displayMode === 'bmi' || state.displayMode === 'both') && (
              <>
                <ReferenceArea yAxisId="bmi" y1={18.5} y2={25} fill="#10B981" fillOpacity={0.1} />
                <ReferenceLine yAxisId="bmi" y={18.5} stroke="#EAB308" strokeDasharray="2 2" />
                <ReferenceLine yAxisId="bmi" y={25} stroke="#F59E0B" strokeDasharray="2 2" />
                <ReferenceLine yAxisId="bmi" y={30} stroke="#EF4444" strokeDasharray="2 2" />
              </>
            )}

            {/* Goal Lines */}
            {state.showGoals && targetWeight && (state.displayMode === 'weight' || state.displayMode === 'both') && (
              <ReferenceLine 
                yAxisId="weight" 
                y={targetWeight} 
                stroke="#059669" 
                strokeDasharray="4 4"
                strokeWidth={2}
              />
            )}
            
            {state.showGoals && targetBMI && (state.displayMode === 'bmi' || state.displayMode === 'both') && (
              <ReferenceLine 
                yAxisId="bmi" 
                y={targetBMI} 
                stroke="#059669" 
                strokeDasharray="4 4"
                strokeWidth={2}
              />
            )}

            {/* Weight Line */}
            {(state.displayMode === 'weight' || state.displayMode === 'both') && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weightKg"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />
            )}

            {/* BMI Area */}
            {(state.displayMode === 'bmi' || state.displayMode === 'both') && (
              <Area
                yAxisId="bmi"
                type="monotone"
                dataKey="bmi"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        
        <div id="weight-chart-description" className="sr-only">
          Interactive weight and BMI trend chart over the selected time period.
          Use the controls above to change display mode and timeframe.
          Hover over data points for detailed information.
        </div>
      </div>
    </div>
  );
}
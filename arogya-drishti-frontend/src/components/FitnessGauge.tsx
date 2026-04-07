'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AnalyticsFitnessSummary } from '@/lib/api';

const COLORS = ['#16A34A', '#D97706', '#DC2626', '#6B7280'];

interface Props {
  summary: AnalyticsFitnessSummary;
}

export function FitnessGauge({ summary }: Props) {
  const data = [
    { name: 'Fit', value: summary.fit },
    { name: 'Monitor', value: summary.monitor },
    { name: 'Critical', value: summary.critical },
    { name: 'Unfit', value: summary.unfit },
  ].filter((d) => d.value > 0);

  const scoreColor =
    summary.readinessScore >= 80
      ? '#16A34A'
      : summary.readinessScore >= 60
      ? '#D97706'
      : '#DC2626';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <ResponsiveContainer width={240} height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Personnel']} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre readiness score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-3xl font-bold" style={{ color: scoreColor }}>
            {summary.readinessScore}
          </p>
          <p className="text-xs text-gray-500">Readiness</p>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{summary.totalPersonnel}</span> total personnel
        </p>
      </div>
    </div>
  );
}

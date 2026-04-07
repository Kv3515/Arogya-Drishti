'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VitalsLog } from '@/lib/api';

interface Props {
  vitals: VitalsLog[];
}

export function VitalsChart({ vitals }: Props) {
  const data = [...vitals]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map((v) => ({
      date: new Date(v.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      'BP Systolic': v.systolicBp,
      'BP Diastolic': v.diastolicBp,
      'Heart Rate': v.heartRateBpm,
      'SpO₂': v.spo2Percent,
      'Respiratory Rate': v.respiratoryRate,
      'Pain Scale': v.painScale,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No vitals recorded yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }}
          itemStyle={{ color: '#374151' }}
          labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line type="monotone" dataKey="BP Systolic" stroke="#DC2626" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="BP Diastolic" stroke="#F87171" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="Heart Rate" stroke="#2563EB" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="SpO₂" stroke="#16A34A" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

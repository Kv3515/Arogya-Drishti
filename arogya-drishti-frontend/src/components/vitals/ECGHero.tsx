'use client';

import { Activity } from 'lucide-react';
import { PulseIndicator } from '@/components/ui/PulseIndicator';
import { useCountUp } from '@/hooks/useCountUp';

type VitalStatus = 'fit' | 'monitor' | 'critical';

interface ECGHeroProps {
  heartRate?: number;
  status?: VitalStatus;
  patientName?: string;
  lastUpdated?: string;
  className?: string;
}

export function ECGHero({
  heartRate = 72,
  status = 'fit',
  patientName,
  lastUpdated = 'Just now',
  className = '',
}: ECGHeroProps) {
  const animatedHR = useCountUp({ end: heartRate, duration: 800 });

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 ${className}`}
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 55%, #0F172A 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* ECG grid overlay — uses existing ecg-grid pattern approach */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(20,184,166,0.06) 19px, rgba(20,184,166,0.06) 20px),' +
            'repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(20,184,166,0.06) 19px, rgba(20,184,166,0.06) 20px)',
          pointerEvents: 'none',
        }}
      />

      {/* Sweeping glow — reuses ecgSweep keyframe via inline style */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.04) 50%, transparent 100%)',
          backgroundSize: '200px 100%',
          animation: 'ecgSweep 4s linear infinite',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Top row: icon + value + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(20,184,166,0.18)', border: '1px solid rgba(20,184,166,0.25)' }}
            >
              <Activity
                size={22}
                className="text-teal-400"
                style={{ animation: 'heartbeat 1.4s ease-in-out infinite' }}
              />
            </div>
            <div>
              {patientName && (
                <p className="text-slate-400 text-xs font-medium mb-0.5">{patientName}</p>
              )}
              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-bold text-white tabular-nums tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {animatedHR}
                </span>
                <span className="text-teal-400 font-semibold text-sm">bpm</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">Heart Rate · Live</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-right">
            <div>
              <p className="text-white text-sm font-semibold capitalize">{status}</p>
              <p className="text-slate-500 text-[10px]">{lastUpdated}</p>
            </div>
            <PulseIndicator status={status} size="md" />
          </div>
        </div>

        {/* ECG waveform SVG */}
        <div className="h-14 overflow-hidden" aria-hidden="true">
          <svg
            viewBox="0 0 800 56"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <polyline
              points="0,28 60,28 80,28 90,7 100,49 110,14 120,28 160,28 220,28 240,28 250,7 260,49 270,14 280,28 320,28 380,28 400,28 410,7 420,49 430,14 440,28 480,28 540,28 560,28 570,7 580,49 590,14 600,28 640,28 700,28 720,28 730,7 740,49 750,14 760,28 800,28"
              fill="none"
              stroke="#14B8A6"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

'use client';

import {
  Droplets, Ruler, Scale, TrendingUp, CalendarDays, ShieldCheck, Clock,
} from 'lucide-react';
import type { Individual, AnnualMedicalExam } from '@/lib/api';
import { formatShapeCode } from '@/components/doctor/DoctorExamCard';

interface ProfileCardProps {
  individual: Individual;
  latestExam?: AnnualMedicalExam | null;
}

export function ProfileCard({ individual, latestExam }: ProfileCardProps) {
  const age = individual.dateOfBirth
    ? Math.floor((Date.now() - new Date(individual.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const shapeCode = latestExam
    ? formatShapeCode(latestExam.shapeS ?? null, latestExam.shapeH ?? null, latestExam.shapeA ?? null, latestExam.shapeP ?? null, latestExam.shapeE ?? null)
    : null;

  const bmi =
    individual.heightCm && individual.weightKg
      ? individual.weightKg / Math.pow(individual.heightCm / 100, 2)
      : null;

  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
    : null;

  return (
    <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-2xl overflow-hidden shadow-lg">
      {/* Top strip */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ring-2 ring-white/20">
            {individual.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{individual.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${
                ['1A','1B'].includes(individual.medicalCategory) ? 'bg-emerald-400/20 text-emerald-300 ring-emerald-400/30' :
                ['2','3'].includes(individual.medicalCategory) ? 'bg-amber-400/20 text-amber-300 ring-amber-400/30' :
                individual.medicalCategory === '4'             ? 'bg-orange-400/20 text-orange-300 ring-orange-400/30' :
                individual.medicalCategory === '5'             ? 'bg-red-400/20 text-red-300 ring-red-400/30' :
                                                                  'bg-gray-400/20 text-gray-300 ring-gray-400/30'
              }`}>
                {shapeCode ?? `Cat ${individual.medicalCategory || '—'}`}
              </span>
            </div>
            <p className="text-brand-200 text-sm mt-0.5">
              {individual.rank} &middot; {individual.serviceNumber}
              {individual.unit?.name ? ` · ${individual.unit.name}` : ''}
            </p>
            {age && (
              <p className="text-brand-300 text-xs mt-1">{age} years old &middot; {individual.sex}</p>
            )}
          </div>
        </div>

        {/* Key medical facts bar */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-2">
            <Droplets className="h-3.5 w-3.5 text-red-300" />
            <span className="text-xs text-brand-200">Blood Group</span>
            <span className="text-sm font-bold text-white ml-0.5">{individual.bloodGroup}</span>
          </div>
          {individual.heightCm && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-2">
              <Ruler className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs text-brand-200">Height</span>
              <span className="text-sm font-bold text-white ml-0.5">{individual.heightCm} cm</span>
            </div>
          )}
          {individual.weightKg && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-2">
              <Scale className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs text-brand-200">Weight</span>
              <span className="text-sm font-bold text-white ml-0.5">{individual.weightKg} kg</span>
            </div>
          )}
          {bmi && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-2">
              <TrendingUp className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs text-brand-200">BMI</span>
              <span className={`text-sm font-bold ml-0.5 ${bmi >= 30 ? 'text-red-300' : bmi >= 25 ? 'text-amber-300' : 'text-white'}`}>
                {bmi.toFixed(1)} <span className="text-[11px] font-normal opacity-70">({bmiCategory})</span>
              </span>
            </div>
          )}
          {individual.dateOfBirth && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-2">
              <CalendarDays className="h-3.5 w-3.5 text-brand-300" />
              <span className="text-xs text-brand-200">DOB</span>
              <span className="text-sm font-bold text-white ml-0.5">
                {new Date(individual.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Duty status footer strip */}
      <div className="bg-black/20 px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
          <span className="text-xs text-brand-300 font-medium">Duty Status:</span>
          <span className="text-xs text-white font-semibold">{individual.dutyStatus.replace(/_/g, ' ')}</span>
        </div>
        {latestExam?.nextExamDue && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-brand-300" />
            <span className="text-xs text-brand-300 font-medium">Next Exam Due:</span>
            <span className="text-xs text-white font-semibold">
              {new Date(latestExam.nextExamDue).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Droplets, ShieldCheck, User, Camera, Activity, Printer } from 'lucide-react';
import type { Individual, AnnualMedicalExam, VitalsLog } from '@/lib/api';
import { api } from '@/lib/api';
import { getCategoryStyle, formatShapeCode } from '@/components/doctor/DoctorExamCard';

interface PatientDetailHeaderProps {
  patient: Individual;
  latestExam?: AnnualMedicalExam | null;
  latestVitals?: VitalsLog | null;
  onPhotoUpdate?: (photoUrl: string) => void;
  onPrint?: () => void;
}

function Field({ label, value, className }: { label: string; value?: string | number | null; className?: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className={`field-value ${className ?? ''}`}>{value ?? '—'}</p>
    </div>
  );
}

function PillField({ label, value, pillClass }: { label: string; value?: string | null; pillClass: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <span className={`info-pill ${pillClass}`}>{value ?? '—'}</span>
    </div>
  );
}

export function PatientDetailHeader({ patient, latestExam, latestVitals, onPhotoUpdate, onPrint }: PatientDetailHeaderProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(patient.photoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = patient.name
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const bmi =
    patient.heightCm && patient.weightKg
      ? patient.weightKg / Math.pow(patient.heightCm / 100, 2)
      : null;

  const bmiLabel = bmi
    ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
    : null;

  const catStyle = getCategoryStyle(patient.medicalCategory || patient.fitnessStatus);
  const shapeCode = latestExam
    ? formatShapeCode(latestExam.shapeS ?? null, latestExam.shapeH ?? null, latestExam.shapeA ?? null, latestExam.shapeP ?? null, latestExam.shapeE ?? null)
    : null;
  const fitnessRing =
    ['1A','1B'].includes(patient.medicalCategory) ? 'bg-emerald-500 text-white'
    : ['2','3'].includes(patient.medicalCategory) ? 'bg-amber-500 text-white'
    : patient.medicalCategory === '4' ? 'bg-orange-500 text-white'
    : patient.medicalCategory === '5' ? 'bg-red-500 text-white'
    : 'bg-gray-500 text-white';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Resize + convert to base64 via canvas
      const dataUrl = await resizeImageToBase64(file, 300);
      await api.uploadIndividualPhoto(patient.serviceNumber, dataUrl);
      setPhotoUrl(dataUrl);
      onPhotoUpdate?.(dataUrl);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Hero gradient strip */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Avatar / Photo */}
            <div className="relative flex-shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={patient.name}
                  className="h-14 w-14 rounded-2xl object-cover border-2 border-white/25 shadow-lg"
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {initials}
                </div>
              )}
              {/* Camera badge — always visible */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow hover:bg-teal-400 transition-colors"
                title="Upload photo"
              >
                {uploading
                  ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="h-3 w-3 text-white" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">{patient.name}</h2>
              <p className="text-sm text-white/60 mt-0.5">
                {patient.rank} &nbsp;·&nbsp; {patient.serviceNumber}
                {patient.unit?.name ? ` · ${patient.unit.name}` : ''}
                {age ? ` · ${age} yrs` : ''}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${fitnessRing}`}>
                  {shapeCode ?? catStyle.label}
                </span>
                <span className="text-xs bg-white/15 text-white/80 px-2.5 py-0.5 rounded-full font-medium">
                  {patient.dutyStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
          {/* Blood group badge + Print button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
              <Droplets className="h-5 w-5 text-red-300" />
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Blood</p>
                <p className="text-base font-bold text-white">{patient.bloodGroup}</p>
              </div>
            </div>
            <button
              onClick={onPrint ?? (() => window.print())}
              className="no-print flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 text-xs font-medium hover:bg-white/20 transition-colors"
              title="Print fitness certificate"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Latest vitals strip ──────────────────────────────── */}
      {latestVitals && (
        <div className="border-b border-slate-100 px-6 py-3 bg-slate-50/60">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Latest Vitals · {new Date(latestVitals.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {/* BP */}
            {(() => {
              const sys = latestVitals.systolicBp;
              const dia = latestVitals.diastolicBp;
              const critical = sys != null && (sys >= 140 || (dia != null && dia >= 90));
              const warn = sys != null && !critical && sys >= 120;
              return (
                <div className={`rounded-xl px-3 py-2.5 border text-center ${critical ? 'bg-red-50 border-red-200' : warn ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">BP</p>
                  <p className={`text-sm font-bold tabular-nums ${critical ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {sys != null && dia != null ? `${sys}/${dia}` : '—'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">mmHg</p>
                </div>
              );
            })()}
            {/* HR */}
            {(() => {
              const hr = latestVitals.heartRateBpm;
              const critical = hr != null && (hr > 100 || hr < 60);
              return (
                <div className={`rounded-xl px-3 py-2.5 border text-center ${critical ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">HR</p>
                  <p className={`text-sm font-bold tabular-nums ${critical ? 'text-amber-600' : 'text-emerald-600'}`}>{hr ?? '—'}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">bpm</p>
                </div>
              );
            })()}
            {/* SpO₂ */}
            {(() => {
              const spo2 = latestVitals.spo2Percent;
              const critical = spo2 != null && spo2 < 95;
              const warn = spo2 != null && !critical && spo2 < 98;
              return (
                <div className={`rounded-xl px-3 py-2.5 border text-center ${critical ? 'bg-red-50 border-red-200' : warn ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">SpO₂</p>
                  <p className={`text-sm font-bold tabular-nums ${critical ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600'}`}>{spo2 != null ? `${spo2}%` : '—'}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">%</p>
                </div>
              );
            })()}
            {/* Temp */}
            {(() => {
              const temp = latestVitals.tempCelsius;
              const critical = temp != null && (temp >= 38.5 || temp < 35);
              const warn = temp != null && !critical && temp >= 37.5;
              return (
                <div className={`rounded-xl px-3 py-2.5 border text-center ${critical ? 'bg-red-50 border-red-200' : warn ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Temp</p>
                  <p className={`text-sm font-bold tabular-nums ${critical ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600'}`}>{temp != null ? `${Number(temp).toFixed(1)}°` : '—'}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">°C</p>
                </div>
              );
            })()}
            {/* RR */}
            {(() => {
              const rr = latestVitals.respiratoryRate;
              const critical = rr != null && (rr >= 30 || rr < 8);
              const warn = rr != null && !critical && rr > 20;
              return (
                <div className={`rounded-xl px-3 py-2.5 border text-center ${critical ? 'bg-red-50 border-red-200' : warn ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">RR</p>
                  <p className={`text-sm font-bold tabular-nums ${critical ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600'}`}>{rr ?? '—'}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">/min</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Exhaustive details grid */}
      <div className="px-6 py-5 space-y-5">
        {/* Personal */}
        <div>
          <div className="section-group-label mb-3">
            <User className="h-3 w-3" /> Personal Details
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-4">
            <Field label="Date of Birth" value={new Date(patient.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <PillField
              label="Age"
              value={age ? `${age} yrs` : undefined}
              pillClass="bg-blue-50 text-blue-800 border-blue-200"
            />
            <Field label="Sex" value={patient.sex} />
            <PillField
              label="Blood Group"
              value={patient.bloodGroup}
              pillClass="bg-red-50 text-red-800 border-red-200"
            />
            <Field label="Height" value={patient.heightCm ? `${patient.heightCm} cm` : undefined} />
            <Field label="Weight" value={patient.weightKg ? `${patient.weightKg} kg` : undefined} />
            <Field
              label="BMI"
              value={bmi ? `${bmi.toFixed(1)} (${bmiLabel})` : undefined}
              className={bmi ? (bmi >= 30 ? 'text-red-600' : bmi >= 25 ? 'text-amber-600' : 'text-emerald-700') : ''}
            />
          </div>
        </div>

        {/* Service */}
        <div>
          <div className="section-group-label mb-3">
            <ShieldCheck className="h-3 w-3" /> Service Details
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-4">
            <Field label="Service Number" value={patient.serviceNumber} />
            <Field label="Rank" value={patient.rank} />
            <Field label="Unit" value={patient.unit?.name} />
            <Field label="Duty Status" value={patient.dutyStatus.replace(/_/g, ' ')} />
            <PillField
              label="Medical Category"
              value={shapeCode ? `${shapeCode} (${catStyle.label})` : catStyle.label}
              pillClass={
                ['1A','1B'].includes(patient.medicalCategory) ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : ['2','3'].includes(patient.medicalCategory) ? 'bg-amber-50 text-amber-800 border-amber-200'
                : patient.medicalCategory === '4' ? 'bg-orange-50 text-orange-800 border-orange-200'
                : 'bg-red-50 text-red-800 border-red-200'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Resize an image File to maxPx × maxPx and return a base64 data URL. */
function resizeImageToBase64(file: File, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { StatCard } from '@/components/StatCard';
import { 
  HealthOverviewCard,
  VitalsMonitoringSection,
  WeightTrendChart,
  MedicalHistoryTimeline,
  AnnualExamSection
} from '@/components/health';
import {
  api,
  type Individual,
  type MedicalHistory,
  type VitalsLog,
  type Prescription,
  type AnnualMedicalExam,
  type InjuryLog,
  type Allergy,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useHealthDataPolling } from '@/hooks';
import {
  HeartPulse, Pill, ClipboardList, Activity, User,
  AlertTriangle, Stethoscope, ShieldCheck, Zap, Eye, Ear, Scale,
  ChevronDown, ChevronUp, RefreshCw, X, Shield, Award, Camera,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/TacticalStatusBadge';
import { getCategoryStyle, formatShapeCode } from '@/components/doctor/DoctorExamCard';

export default function MyHealthPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
  const [devServiceNumber, setDevServiceNumber] = useState('SVC-00001');
  const [committedServiceNumber, setCommittedServiceNumber] = useState('SVC-00001');
  const [injuriesDialogOpen, setInjuriesDialogOpen] = useState(false);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const commitServiceNumber = () => setCommittedServiceNumber(devServiceNumber);

  const effectiveServiceNumber = user?.serviceNumber ?? (DEV_BYPASS ? committedServiceNumber : null);

  // Use polling hook for real-time health data updates
  const { 
    data: { individual, history, vitals, prescriptions, exams, injuries },
    loading, 
    updating, 
    error: fetchError, 
    lastUpdated,
    refetch 
  } = useHealthDataPolling({
    serviceNumber: effectiveServiceNumber || '',
    enabled: !!effectiveServiceNumber && !authLoading,
    pollingInterval: 30000 // 30 seconds
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  // Fetch allergies when service number is known
  useEffect(() => {
    if (!effectiveServiceNumber) return;
    api.listAllergies(effectiveServiceNumber)
      .then((res) => setAllergies(res.data ?? []))
      .catch(() => {}); // non-critical
  }, [effectiveServiceNumber]);

  // Handle authentication and service number validation
  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  if (!effectiveServiceNumber) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          {DEV_BYPASS && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">DEV MODE</span>
              <input
                type="text"
                value={devServiceNumber}
                onChange={(e) => setDevServiceNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commitServiceNumber()}
                className="input-sm w-36"
                placeholder="SVC-00001"
              />
              <button
                onClick={commitServiceNumber}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
              >
                Go
              </button>
              <span className="text-xs text-amber-600">Enter any service number (SVC-00001 to SVC-00100)</span>
            </div>
          )}
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-critical-light flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-critical" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Account not linked</h2>
            <p className="text-sm text-gray-500 max-w-xs">Your account is not linked to a service record. Please contact your administrator.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (fetchError) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          {DEV_BYPASS && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">DEV MODE</span>
              <input
                type="text"
                value={devServiceNumber}
                onChange={(e) => setDevServiceNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commitServiceNumber()}
                className="input-sm w-36"
                placeholder="SVC-00001"
              />
              <button
                onClick={commitServiceNumber}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
              >
                Go
              </button>
              <span className="text-xs text-amber-600">Enter any service number (SVC-00001 to SVC-00100)</span>
            </div>
          )}
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-critical-light flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-critical" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Unable to load health record</h2>
            <p className="text-sm text-gray-500 max-w-xs">{fetchError}</p>
            <button
              onClick={refetch}
              className="mt-2 px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const latestVitals = vitals[0] ?? null;
  const latestExam = exams[0] ?? null;
  const latestShapeCode = latestExam
    ? formatShapeCode(latestExam.shapeS ?? null, latestExam.shapeH ?? null, latestExam.shapeA ?? null, latestExam.shapeP ?? null, latestExam.shapeE ?? null)
    : null;
  const activePrescriptions = prescriptions.filter((_, i) => i < 10);
  const pastPrescriptions = prescriptions.filter((_, i) => i >= 10);

  // Derive BMI
  const bmi = individual?.heightCm && individual?.weightKg
    ? individual.weightKg / Math.pow(individual.heightCm / 100, 2)
    : null;
  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
    : null;

  // Age
  const age = individual?.dateOfBirth
    ? Math.floor((new Date().getTime() - new Date(individual.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Risk flags from vitals
  const riskFlags: { label: string; detail: string; level: 'critical' | 'warn' }[] = [];
  if (latestVitals?.systolicBp && latestVitals.systolicBp >= 140) {
    riskFlags.push({ label: 'Elevated BP', detail: `${latestVitals.systolicBp}/${latestVitals.diastolicBp} mmHg`, level: 'critical' });
  } else if (latestVitals?.systolicBp && latestVitals.systolicBp >= 120) {
    riskFlags.push({ label: 'Pre-hypertension', detail: `${latestVitals.systolicBp}/${latestVitals.diastolicBp} mmHg`, level: 'warn' });
  }
  if (latestVitals?.spo2Percent && latestVitals.spo2Percent < 95) {
    riskFlags.push({ label: 'Low SpO₂', detail: `${latestVitals.spo2Percent}%`, level: 'critical' });
  }
  if (bmi && bmi >= 30) {
    riskFlags.push({ label: 'Obese BMI', detail: `BMI ${bmi.toFixed(1)}`, level: 'warn' });
  }
  if (individual?.medicalCategory === '5' || individual?.fitnessStatus === 'CRITICAL') {
    riskFlags.push({ label: 'Critical Medical Category', detail: 'Cat 5 — Permanently unfit, requires review', level: 'critical' });
  }

  // Injury recovery stats
  const activeInjuries = injuries.filter(inj => inj.recoveryStatus !== 'RECOVERED');

  // Doctor clinic visits (non-routine)
  const clinicVisits = history.filter(h => h.visitType !== 'ANNUAL_EXAM');

  // Resolved photo: local upload takes priority, then server value
  const displayPhoto = heroPhoto ?? individual?.photoUrl ?? null;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !individual) return;
    setPhotoUploading(true);
    try {
      const dataUrl = await resizeToBase64(file, 300);
      await api.uploadIndividualPhoto(individual.serviceNumber, dataUrl);
      setHeroPhoto(dataUrl);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-5 pb-8">

        {/* ── DEV override ───────────────────────────────── */}
        {DEV_BYPASS && !user?.serviceNumber && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">DEV MODE</span>
            <input
              type="text"
              value={devServiceNumber}
              onChange={(e) => setDevServiceNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitServiceNumber()}
              className="input-sm w-36"
              placeholder="SVC-00001"
            />
            <button
              onClick={commitServiceNumber}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
            >
              Go
            </button>
            <span className="text-xs text-amber-600">Enter any service number (SVC-00001 to SVC-00100)</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            HERO — IDENTITY CARD
        ═══════════════════════════════════════════════ */}
        {individual && (
          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            {/* gradient background — teal-to-cyan */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 45%, #06B6D4 100%)' }} />
            {/* subtle mesh overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative flex items-center gap-5 p-6">
              {/* Avatar / Photo */}
              <div className="relative flex-shrink-0">
                {displayPhoto ? (
                  <img
                    src={displayPhoto}
                    alt={individual.name}
                    className="h-16 w-16 rounded-full object-cover border-2 border-white/40 shadow-lg"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {individual.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Camera badge — always visible */}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow hover:bg-teal-400 transition-colors"
                  title="Upload photo"
                >
                  {photoUploading
                    ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera className="h-3.5 w-3.5 text-white" />
                  }
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Name + details */}
              <div className="flex-1 min-w-0">
                <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest">{individual.rank}</p>
                <h1 className="text-white text-2xl font-bold leading-tight mt-0.5">{individual.name}</h1>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-teal-100 text-sm font-mono">{individual.serviceNumber}</span>
                  {individual.unit?.name && (
                    <span className="text-white/80 text-xs bg-white/15 px-2 py-0.5 rounded-full">{individual.unit.name}</span>
                  )}
                </div>
              </div>

              {/* Medical category badge */}
              <div className="flex-shrink-0 text-right">
                {(() => {
                  const cat = individual.medicalCategory || individual.fitnessStatus;
                  const badgeBg =
                    ['1A','1B'].includes(cat) ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30'
                    : ['2','3'].includes(cat) ? 'bg-amber-400/20 text-amber-100 border border-amber-400/30'
                    : cat === '4' ? 'bg-orange-400/20 text-orange-100 border border-orange-400/30'
                    : 'bg-red-400/20 text-red-100 border border-red-400/30';
                  return (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shadow-lg ${badgeBg}`}>
                      <Shield className="h-4 w-4" />
                      {latestShapeCode ?? getCategoryStyle(cat).label}
                    </div>
                  );
                })()}
                <div className="text-teal-100 text-xs mt-2 flex items-center justify-end gap-1">
                  <RefreshCw className={`h-3 w-3 ${updating ? 'animate-spin' : ''}`} />
                  {updating ? 'Updating...' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SECTION 1 — STAT CARDS ROW
        ═══════════════════════════════════════════════ */}
        {individual && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[  
              {
                label: 'Medical Category',
                value: latestShapeCode ?? getCategoryStyle(individual.medicalCategory || individual.fitnessStatus).label,
                sub: latestShapeCode ? `${getCategoryStyle(individual.medicalCategory).label}` : 'Current SHAPE category',
                accent: (
                  ['1A','1B'].includes(individual.medicalCategory) ? 'fit'
                  : ['2','3'].includes(individual.medicalCategory) ? 'monitor'
                  : individual.medicalCategory === '5' ? 'critical' : 'monitor'
                ) as any,
                icon: <HeartPulse className="h-5 w-5" />,
                iconClass: ['1A','1B'].includes(individual.medicalCategory) ? 'bg-emerald-50 text-emerald-600' : ['2','3'].includes(individual.medicalCategory) ? 'bg-amber-50 text-amber-600' : individual.medicalCategory === '4' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-500',
                barClass: ['1A','1B'].includes(individual.medicalCategory) ? 'bg-emerald-400' : ['2','3'].includes(individual.medicalCategory) ? 'bg-amber-400' : individual.medicalCategory === '4' ? 'bg-orange-400' : 'bg-red-400',
              },
              {
                label: 'Medical Visits',
                value: String(clinicVisits.length),
                sub: 'Total clinic records',
                icon: <Stethoscope className="h-5 w-5" />,
                iconClass: 'bg-sky-50 text-sky-600',
                barClass: 'bg-sky-400',
              },
              {
                label: 'Annual Exams',
                value: String(exams.length),
                sub: latestExam ? `Last: ${new Date(latestExam.examDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'No exam recorded',
                icon: <ClipboardList className="h-5 w-5" />,
                iconClass: 'bg-violet-50 text-violet-600',
                barClass: 'bg-violet-400',
              },
              {
                label: 'Active Injuries',
                value: String(activeInjuries.length),
                sub: activeInjuries.length === 0 ? 'None on record' : 'Under treatment',
                accent: (activeInjuries.length > 0 ? 'monitor' : undefined) as any,
                icon: <AlertTriangle className="h-5 w-5" />,
                iconClass: activeInjuries.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400',
                barClass: activeInjuries.length > 0 ? 'bg-amber-400' : 'bg-gray-200',
              },
            ].map((s, i) => (
              <div key={i} className="glass-card p-5 hover:-translate-y-0.5 overflow-hidden relative">
                {/* subtle top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.barClass} rounded-t-2xl opacity-70`} />
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconClass}`}>{s.icon}</div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</span>
                </div>
                <p className={`text-2xl font-bold ${s.accent === 'fit' ? 'text-emerald-600' : s.accent === 'monitor' ? 'text-amber-600' : s.accent === 'critical' ? 'text-red-600' : 'text-gray-900'}`}>{s.value}</p>
                {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SECTION 2 — HEALTH OVERVIEW (demographics + metrics)
        ═══════════════════════════════════════════════ */}
        {individual && (
          <div className="glass-card hover:-translate-y-0.5 hover:shadow-xl">
            <HealthOverviewCard 
              individual={individual}
              latestVitals={latestVitals || undefined}
              latestExam={latestExam || undefined}
              activeInjuries={activeInjuries}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SECTION 3 — RISK FLAGS + ALLERGIES
        ═══════════════════════════════════════════════ */}
        {(riskFlags.length > 0 || allergies.some((a) => a.status === 'active')) && (
          <div className="glass-card p-5 space-y-4">
            {riskFlags.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-red-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">Risk Flags</h2>
                  <span className="ml-1 text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-semibold">{riskFlags.length} alert{riskFlags.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {riskFlags.map((flag, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                      flag.level === 'critical' ? 'bg-red-50/60 border-red-100' : 'bg-amber-50/60 border-amber-100'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${flag.level === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                      <div>
                        <p className={`text-sm font-semibold ${flag.level === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>{flag.label}</p>
                        <p className={`text-xs mt-0.5 ${flag.level === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>{flag.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Active allergy pills */}
            {allergies.some((a) => a.status === 'active') && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-red-500 mb-2">Known Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {allergies.filter((a) => a.status === 'active').map((a) => (
                    <span key={a.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                        a.severity === 'life_threatening' ? 'bg-red-900 text-white border-red-700 animate-pulse'
                        : a.severity === 'severe' ? 'bg-red-100 text-red-800 border-red-300'
                        : a.severity === 'moderate' ? 'bg-orange-100 text-orange-800 border-orange-300'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}
                    >
                      <Shield className="h-3 w-3 flex-shrink-0" />
                      {a.allergen}
                      <span className="opacity-60">({a.severity.replace(/_/g, ' ')})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SECTION 4 — MEDICAL EXAMINATIONS (AME + PME)
        ═══════════════════════════════════════════════ */}
        {individual && (
          <div className="glass-card hover:-translate-y-0.5 hover:shadow-xl overflow-hidden">
            <AnnualExamSection 
              individual={individual}
              exams={exams}
              latestVitals={latestVitals || undefined}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SECTION 5 — VITALS MONITORING
        ═══════════════════════════════════════════════ */}
        {individual && (
          <div className="glass-card hover:-translate-y-0.5 hover:shadow-xl overflow-hidden">
            <VitalsMonitoringSection 
              individual={individual}
              vitalsData={vitals}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SECTION 6 — WEIGHT TREND + MEDICATIONS
        ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {individual && (
            <div className="xl:col-span-3 glass-card hover:-translate-y-0.5 hover:shadow-xl overflow-hidden">
              <WeightTrendChart individual={individual} vitalsData={vitals} />
            </div>
          )}

          <div className="glass-card p-6 xl:col-span-2 hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                <Pill className="h-4 w-4 text-violet-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Medications</h2>
            </div>
            {activePrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-gray-400 gap-2">
                <Pill className="h-8 w-8 text-gray-200" />
                <span>No prescriptions on record.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {activePrescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-150">
                    <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Pill className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{rx.drugName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{rx.dose} · {rx.frequency} · {rx.durationDays}d · {rx.route}</p>
                      {rx.instructions && <p className="text-xs text-gray-400 italic mt-1 leading-snug">{rx.instructions}</p>}
                    </div>
                  </div>
                ))}
                {pastPrescriptions.length > 0 && (
                  <p className="text-xs text-gray-400 pt-1 text-center">+{pastPrescriptions.length} older prescriptions in history</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 7 — MEDICAL HISTORY TIMELINE
        ═══════════════════════════════════════════════ */}
        <div className="glass-card hover:-translate-y-0.5 hover:shadow-xl overflow-hidden">
          <MedicalHistoryTimeline medicalHistory={history} />
        </div>

        {/* ═══════════════════════════════════════════════
            SECTION 8 — INJURIES CARD (clickable → dialog)
        ═══════════════════════════════════════════════ */}
        {injuries.length > 0 && (
          <>
            <div
              className="glass-card-hover p-6"
              onClick={() => setInjuriesDialogOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setInjuriesDialogOpen(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">Injury History</h2>
                  <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">{injuries.length} record{injuries.length > 1 ? 's' : ''}</span>
                </div>
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  View Details <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Summary preview — first 2 injuries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...injuries]
                  .sort((a, b) => new Date(b.injuryDate).getTime() - new Date(a.injuryDate).getTime())
                  .slice(0, 2)
                  .map((inj) => (
                    <div key={inj.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                      inj.recoveryStatus === 'RECOVERED' ? 'bg-gray-50 border-gray-100' : 'bg-amber-50/50 border-amber-100'
                    }`}>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        inj.recoveryStatus === 'RECOVERED' ? 'bg-gray-200 text-gray-500' : 'bg-amber-200 text-amber-700'
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{inj.injuryType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{inj.bodyPartAffected}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        inj.recoveryStatus === 'RECOVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inj.recoveryStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                {injuries.length > 2 && (
                  <p className="text-xs text-gray-400 col-span-full text-center pt-1">
                    +{injuries.length - 2} more — click to view all
                  </p>
                )}
              </div>
            </div>

            {/* ── Injuries Dialog ────────────────────────── */}
            {injuriesDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setInjuriesDialogOpen(false)}
                />
                {/* Dialog panel */}
                <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col glass-card shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Injury History</h2>
                      <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">{injuries.length} records</span>
                    </div>
                    <button
                      onClick={() => setInjuriesDialogOpen(false)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Scrollable list */}
                  <div className="overflow-y-auto flex-1 p-5 space-y-3">
                    {[...injuries]
                      .sort((a, b) => new Date(b.injuryDate).getTime() - new Date(a.injuryDate).getTime())
                      .map((inj) => (
                        <div key={inj.id} className={`flex items-start gap-4 p-4 rounded-xl border ${
                          inj.recoveryStatus === 'RECOVERED' ? 'bg-gray-50 border-gray-100' : 'bg-amber-50/50 border-amber-100'
                        }`}>
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            inj.recoveryStatus === 'RECOVERED' ? 'bg-gray-200 text-gray-500' : 'bg-amber-200 text-amber-700'
                          }`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-gray-900">{inj.injuryType.replace(/_/g, ' ')}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inj.recoveryStatus === 'RECOVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {inj.recoveryStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                              <span><span className="text-gray-400">Body Part:</span> {inj.bodyPartAffected}</span>
                              <span><span className="text-gray-400">Cause:</span> {inj.injuryCause.replace(/_/g, ' ')}</span>
                              <span><span className="text-gray-400">Date:</span> {new Date(inj.injuryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              {inj.recorderName && (
                                <span><span className="text-gray-400">Logged by:</span> {inj.recorderName}</span>
                              )}
                            </div>
                            {inj.notes && (
                              <p className="text-xs text-gray-400 italic mt-2 leading-snug border-t border-gray-100 pt-2">{inj.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </DashboardShell>
  );
}

function resizeToBase64(file: File, maxPx: number): Promise<string> {
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
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

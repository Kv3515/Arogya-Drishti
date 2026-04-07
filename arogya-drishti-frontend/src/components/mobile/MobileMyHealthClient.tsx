'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Camera,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Home,
  Pill,
  RefreshCw,
  Shield,
  Stethoscope,
} from 'lucide-react';
import {
  api,
  type Allergy,
  type Individual,
} from '@/lib/api';
import {
  AnnualExamSection,
  HealthOverviewCard,
  MedicalHistoryTimeline,
  VitalsMonitoringSection,
  WeightTrendChart,
} from '@/components/health';
import { useAuth } from '@/contexts/AuthContext';
import { useHealthDataPolling } from '@/hooks';
import { formatShapeCode, getCategoryStyle } from '@/components/doctor/DoctorExamCard';

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

function sectionScroll(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function dashboardPathForRole(role?: string | null): string {
  switch (role) {
    case 'medical_officer':
    case 'paramedic':
      return '/dashboard/doctor';
    case 'commander':
      return '/dashboard/commander';
    case 'super_admin':
      return '/dashboard/admin';
    default:
      return '/dashboard/me';
  }
}

export function MobileMyHealthClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [devServiceNumber, setDevServiceNumber] = useState('SVC-00001');
  const [committedServiceNumber, setCommittedServiceNumber] = useState('SVC-00001');
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const effectiveServiceNumber = user?.serviceNumber ?? (DEV_BYPASS ? committedServiceNumber : null);

  const {
    data: { individual, history, vitals, prescriptions, exams, injuries },
    loading,
    updating,
    error,
    lastUpdated,
    refetch,
  } = useHealthDataPolling({
    serviceNumber: effectiveServiceNumber || '',
    enabled: !!effectiveServiceNumber && !authLoading,
    pollingInterval: 30000,
  });

  useEffect(() => {
    if (!authLoading && !user && !DEV_BYPASS) {
      router.replace('/');
      return;
    }

    if (!authLoading && user && user.role !== 'individual' && !DEV_BYPASS) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!effectiveServiceNumber) return;
    api.listAllergies(effectiveServiceNumber)
      .then((res) => setAllergies(res.data ?? []))
      .catch(() => {});
  }, [effectiveServiceNumber]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
      </div>
    );
  }

  if (!user && !DEV_BYPASS) {
    return null;
  }

  if (!effectiveServiceNumber) {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
        <div className="mx-auto max-w-md space-y-5">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-100">
            <p className="text-sm font-semibold">No linked service record</p>
            <p className="mt-1 text-sm text-amber-100/75">This account is not linked to an individual health record yet.</p>
          </div>
          {DEV_BYPASS && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-xs font-bold tracking-[0.24em] text-teal-300 uppercase">Dev mode</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={devServiceNumber}
                  onChange={(e) => setDevServiceNumber(e.target.value)}
                  className="flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-teal-400"
                  placeholder="SVC-00001"
                />
                <button
                  onClick={() => setCommittedServiceNumber(devServiceNumber)}
                  className="rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  Open
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
        <div className="mx-auto max-w-md space-y-5">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
            <p className="text-base font-semibold">Unable to load health record</p>
            <p className="mt-1 text-sm text-white/70">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const latestVitals = vitals[0] ?? null;
  const latestExam = exams[0] ?? null;
  const activePrescriptions = prescriptions.slice(0, 10);
  const activeInjuries = injuries.filter((inj) => inj.recoveryStatus !== 'RECOVERED');
  const clinicVisits = history.filter((item) => item.visitType !== 'ANNUAL_EXAM');
  const displayPhoto = heroPhoto ?? individual?.photoUrl ?? null;
  const latestShapeCode = latestExam
    ? formatShapeCode(latestExam.shapeS ?? null, latestExam.shapeH ?? null, latestExam.shapeA ?? null, latestExam.shapeP ?? null, latestExam.shapeE ?? null)
    : null;
  const category = individual?.medicalCategory || individual?.fitnessStatus || '';
  const categoryStyle = getCategoryStyle(category);
  const riskFlags: Array<{ label: string; detail: string; level: 'critical' | 'warn' }> = [];

  if (latestVitals?.systolicBp && latestVitals.systolicBp >= 140) {
    riskFlags.push({ label: 'Elevated BP', detail: `${latestVitals.systolicBp}/${latestVitals.diastolicBp} mmHg`, level: 'critical' });
  } else if (latestVitals?.systolicBp && latestVitals.systolicBp >= 120) {
    riskFlags.push({ label: 'Pre-hypertension', detail: `${latestVitals.systolicBp}/${latestVitals.diastolicBp} mmHg`, level: 'warn' });
  }
  if (latestVitals?.spo2Percent && latestVitals.spo2Percent < 95) {
    riskFlags.push({ label: 'Low SpO₂', detail: `${latestVitals.spo2Percent}%`, level: 'critical' });
  }
  if (individual?.medicalCategory === '5' || individual?.fitnessStatus === 'CRITICAL') {
    riskFlags.push({ label: 'Critical Medical Category', detail: 'Cat 5 — requires review', level: 'critical' });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
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
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.20),_transparent_32%),linear-gradient(180deg,#07111f_0%,#0b1728_28%,#eef4f7_28%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-teal-300">Arogya Drishti</p>
            <h1 className="text-base font-semibold">My Health</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/80"
              aria-label="Refresh health data"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/dashboard/me"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80"
            >
              Desktop
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-28 pt-4">
        {DEV_BYPASS && !user?.serviceNumber && (
          <div className="mb-4 rounded-3xl border border-amber-300/50 bg-amber-50 p-4 text-amber-900 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Dev mode</p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={devServiceNumber}
                onChange={(e) => setDevServiceNumber(e.target.value)}
                className="flex-1 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
                placeholder="SVC-00001"
              />
              <button
                onClick={() => setCommittedServiceNumber(devServiceNumber)}
                className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Open
              </button>
            </div>
          </div>
        )}

        {individual && (
          <section id="section-health" className="relative overflow-hidden rounded-[28px] border border-white/20 bg-[linear-gradient(135deg,#0F766E_0%,#14B8A6_48%,#06B6D4_100%)] p-5 text-white shadow-2xl shadow-cyan-950/25">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 75% 35%, white 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
            <div className="relative flex items-start gap-4">
              <div className="relative shrink-0">
                {displayPhoto ? (
                  <img src={displayPhoto} alt={individual.name} className="h-16 w-16 rounded-3xl border-2 border-white/35 object-cover shadow-lg" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-white/35 bg-white/15 text-2xl font-bold shadow-lg">
                    {individual.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-950/85 shadow-lg"
                >
                  {photoUploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-4 w-4" />}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-100">{individual.rank}</p>
                <h2 className="mt-1 text-2xl font-bold leading-tight">{individual.name}</h2>
                <p className="mt-1 text-sm text-white/85">{individual.serviceNumber}</p>
                {individual.unit?.name && (
                  <p className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">{individual.unit.name}</p>
                )}
              </div>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-teal-100">Category</p>
                <p className="mt-1 text-lg font-bold">{latestShapeCode ?? categoryStyle.label}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-teal-100">Updated</p>
                <p className="mt-1 text-sm font-semibold">{lastUpdated ? lastUpdated.toLocaleTimeString() : 'Just now'}</p>
              </div>
            </div>
          </section>
        )}

        {individual && (
          <section className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Category', value: latestShapeCode ?? category, icon: HeartPulse, tone: 'text-emerald-600 bg-emerald-50' },
              { label: 'Clinic Visits', value: String(clinicVisits.length), icon: Stethoscope, tone: 'text-sky-600 bg-sky-50' },
              { label: 'Exams', value: String(exams.length), icon: ClipboardList, tone: 'text-violet-600 bg-violet-50' },
              { label: 'Injuries', value: String(activeInjuries.length), icon: AlertTriangle, tone: activeInjuries.length ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-100' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        {individual && (
          <section id="section-overview" className="mt-4 rounded-[28px] shadow-sm">
            <div className="glass-card overflow-hidden">
              <HealthOverviewCard
                individual={individual as Individual}
                latestVitals={latestVitals || undefined}
                latestExam={latestExam || undefined}
                activeInjuries={activeInjuries}
              />
            </div>
          </section>
        )}

        {(riskFlags.length > 0 || allergies.some((item) => item.status === 'active')) && (
          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Risk flags and allergies</h3>
                <p className="text-xs text-slate-500">Highlights that need attention</p>
              </div>
            </div>

            {riskFlags.length > 0 && (
              <div className="mt-4 space-y-2">
                {riskFlags.map((flag) => (
                  <div key={`${flag.label}-${flag.detail}`} className={`rounded-2xl border p-3 ${flag.level === 'critical' ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50'}`}>
                    <p className={`text-sm font-semibold ${flag.level === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>{flag.label}</p>
                    <p className={`mt-0.5 text-xs ${flag.level === 'critical' ? 'text-red-500' : 'text-amber-600'}`}>{flag.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {allergies.some((item) => item.status === 'active') && (
              <div className="mt-4 flex flex-wrap gap-2">
                {allergies.filter((item) => item.status === 'active').map((item) => (
                  <span key={item.id} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${item.severity === 'life_threatening' ? 'border-red-700 bg-red-900 text-white' : item.severity === 'severe' ? 'border-red-300 bg-red-100 text-red-800' : item.severity === 'moderate' ? 'border-orange-300 bg-orange-100 text-orange-800' : 'border-yellow-300 bg-yellow-100 text-yellow-800'}`}>
                    {item.allergen}
                    <span className="opacity-70">{item.severity.replace(/_/g, ' ')}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {individual && (
          <section id="section-exams" className="mt-4 overflow-hidden rounded-[28px] shadow-sm">
            <div className="glass-card overflow-hidden">
              <AnnualExamSection individual={individual} exams={exams} latestVitals={latestVitals || undefined} />
            </div>
          </section>
        )}

        {individual && (
          <section id="section-vitals" className="mt-4 overflow-hidden rounded-[28px] shadow-sm">
            <div className="glass-card overflow-hidden">
              <VitalsMonitoringSection individual={individual} vitalsData={vitals} />
            </div>
          </section>
        )}

        <section id="section-meds" className="mt-4 space-y-4">
          {individual && (
            <div className="overflow-hidden rounded-[28px] shadow-sm">
              <div className="glass-card overflow-hidden">
                <WeightTrendChart individual={individual} vitalsData={vitals} />
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Pill className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Medications</h3>
                <p className="text-xs text-slate-500">Current prescription list</p>
              </div>
            </div>

            {activePrescriptions.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">No prescriptions on record.</div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {activePrescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{rx.drugName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{rx.dose} · {rx.frequency} · {rx.durationDays}d · {rx.route}</p>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                    </div>
                    {rx.instructions && <p className="mt-2 text-xs italic text-slate-500">{rx.instructions}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="section-history" className="mt-4 overflow-hidden rounded-[28px] shadow-sm">
          <div className="glass-card overflow-hidden">
            <MedicalHistoryTimeline medicalHistory={history} />
          </div>
        </section>

        {injuries.length > 0 && (
          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Injury history</h3>
                <p className="text-xs text-slate-500">All recorded injuries</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {[...injuries]
                .sort((a, b) => new Date(b.injuryDate).getTime() - new Date(a.injuryDate).getTime())
                .map((injury) => (
                  <div key={injury.id} className={`rounded-2xl border p-3 ${injury.recoveryStatus === 'RECOVERED' ? 'border-slate-200 bg-slate-50' : 'border-amber-100 bg-amber-50/70'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{injury.injuryType.replace(/_/g, ' ')}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{injury.bodyPartAffected} · {injury.injuryCause.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${injury.recoveryStatus === 'RECOVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {injury.recoveryStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{new Date(injury.injuryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    {injury.notes && <p className="mt-2 text-xs italic text-slate-500">{injury.notes}</p>}
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {[
            { id: 'section-health', label: 'Home', icon: Home },
            { id: 'section-vitals', label: 'Vitals', icon: Activity },
            { id: 'section-meds', label: 'Meds', icon: Pill },
            { id: 'section-history', label: 'History', icon: ClipboardList },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => sectionScroll(item.id)}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-teal-600"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
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
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
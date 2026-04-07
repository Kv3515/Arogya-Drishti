'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Weight, ChevronDown, ChevronUp, Users, HeartPulse, ShieldCheck, TrendingUp, ShieldAlert } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { PatientListPanel } from '@/components/doctor/PatientListPanel';
import { PatientDetailHeader } from '@/components/doctor/PatientDetailHeader';
import { DoctorExamCard } from '@/components/doctor/DoctorExamCard';
import { DoctorVisitCard } from '@/components/doctor/DoctorVisitCard';
import { MedicationsSection } from '@/components/doctor/MedicationsSection';
import { InjuriesSection } from '@/components/doctor/InjuriesSection';
import { AllergySection } from '@/components/doctor/AllergySection';
import { FitnessCertificate } from '@/components/doctor/FitnessCertificate';
import { WeightTrendChart } from '@/components/health/WeightTrendChart';
import { StatCard } from '@/components/StatCard';
import { StaggerGrid } from '@/components/ui/StaggerGrid';
import { ECGHero } from '@/components/vitals/ECGHero';
import { api, type Individual, type MedicalHistory, type VitalsLog, type AnnualMedicalExam, type Allergy } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function ExpandableSection({
  title, icon, badge, children, defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors duration-150 text-left"
        style={{ borderBottom: open ? '1px solid rgba(203,213,225,0.5)' : 'none' }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg border flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: '#f8fafc', borderColor: 'rgba(203,213,225,0.7)' }}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {badge && (
            <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default function DoctorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<Individual | null>(null);
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [vitals, setVitals] = useState<VitalsLog[]>([]);
  const [exams, setExams] = useState<AnnualMedicalExam[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [showWeightTrend, setShowWeightTrend] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Dashboard KPI state — in a real implementation these come from API
  // For now using computed values that update when patients load
  const [dashboardStats] = useState({
    totalPatients: 0,
    fitCount: 0,
    monitorCount: 0,
    criticalCount: 0,
  });

  // Auth guard
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, user]);

  // Auto-select patient from ?patient=<serviceNumber> query param (set by global search)
  useEffect(() => {
    if (authLoading || !user) return;
    const sn = new URLSearchParams(window.location.search).get('patient');
    if (!sn) return;
    api.getIndividual(sn)
      .then((ind) => { if (ind) selectPatient(ind); })
      .catch(() => {});
    // Clear query param without triggering navigation
    const url = new URL(window.location.href);
    url.searchParams.delete('patient');
    window.history.replaceState({}, '', url.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const selectPatient = async (ind: Individual) => {
    setSelected(ind);
    setDetailLoading(true);
    setShowWeightTrend(false);
    try {
      const [hist, v, ex, allerg] = await Promise.all([
        api.listMedicalHistory(ind.serviceNumber),
        api.listVitals(ind.serviceNumber),
        api.listAnnualExams(ind.serviceNumber),
        api.listAllergies(ind.serviceNumber),
      ]);
      setHistory(hist.data ?? []);
      setVitals(v.data ?? []);
      setExams(ex.data ?? []);
      setAllergies(allerg.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <svg className="h-12 w-12 animate-spin text-brand-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9 2h6v6h6v6h-6v6H9v-6H3V8h6z" />
        </svg>
        <p className="text-sm text-gray-400 font-medium">Loading patient records…</p>
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-5 pb-8">

        {/* ── DASHBOARD KPI HEADER ─────────────────────────────── */}
        <div className="space-y-4">
          {/* KPI Stats row */}
          <StaggerGrid columns="grid-cols-2 xl:grid-cols-4" gap="gap-4" staggerMs={80}>
            <StatCard
              label="Total Patients"
              value={dashboardStats.totalPatients}
              sub="Under care"
              accent="teal"
              hero
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Fit"
              value={dashboardStats.fitCount}
              sub="Cleared for duty"
              accent="fit"
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <StatCard
              label="Monitor"
              value={dashboardStats.monitorCount}
              sub="Requires follow-up"
              accent="monitor"
              icon={<HeartPulse className="h-5 w-5" />}
            />
            <StatCard
              label="Critical"
              value={dashboardStats.criticalCount}
              sub="Immediate attention"
              accent="critical"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </StaggerGrid>

          {/* ECG Hero strip */}
          <ECGHero
            heartRate={72}
            status="fit"
            lastUpdated="System Live"
            className="animate-fade-in"
          />
        </div>

        {/* ── PATIENT LIST — top, compact when a patient is selected ── */}
        <PatientListPanel
          onSelect={selectPatient}
          selectedId={selected?.id}
          compact={!!selected}
        />

        {/* ── NO PATIENT SELECTED ────────────────────── */}
        {!selected && (
          <div className="flex flex-col items-center justify-center glass-card py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-blue-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Select a patient above</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Click any patient chip or row to load their records</p>
          </div>
        )}

        {/* ── PATIENT DETAIL ─────────────────────────── */}
        {selected && (
          <>
            {detailLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-gray-100/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-5">

                {/* 1. Hero + exhaustive details */}
                <PatientDetailHeader patient={selected} latestExam={exams[0] ?? null} latestVitals={vitals[0] ?? null} />

                {/* Print-only fitness certificate (hidden on screen, visible on print) */}
                <FitnessCertificate patient={selected} latestExam={exams[0] ?? null} latestVitals={vitals[0] ?? null} />

                {/* 2. AME / PME entry card */}
                <DoctorExamCard
                  individual={selected}
                  exams={exams}
                  onExamAdded={(ex) => setExams((prev) => [ex, ...prev])}
                />

                {/* 3. Medical visit form */}
                <DoctorVisitCard
                  serviceNumber={selected.serviceNumber}
                  history={history}
                  vitals={vitals}
                  allergies={allergies}
                  onRecordAdded={(r) => setHistory((prev) => [r, ...prev])}
                  onVitalsUpdated={(v) => setVitals((prev) => [v, ...prev])}
                />

                {/* 4. Weight trend quick-view */}
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setShowWeightTrend((v) => !v)}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all duration-150 shadow-sm ${
                      showWeightTrend
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:shadow-md'
                    }`}
                  >
                    <Weight className="h-4 w-4" />
                    {showWeightTrend ? 'Hide' : 'Show'} Weight Trend
                  </button>
                </div>
                {showWeightTrend && (
                  <div className="glass-card overflow-hidden">
                    <WeightTrendChart
                      individual={selected}
                      vitalsData={vitals}
                    />
                  </div>
                )}

                {/* Allergy record */}
                <ExpandableSection
                  title="Allergies"
                  icon={<ShieldAlert className="h-4 w-4 text-red-500" />}
                  badge={allergies.filter((a) => a.status === 'active').length > 0 ? `${allergies.filter((a) => a.status === 'active').length} active` : undefined}
                  defaultOpen={allergies.some((a) => a.severity === 'life_threatening')}
                >
                  <AllergySection
                    serviceNumber={selected.serviceNumber}
                    initialAllergies={allergies}
                    onAllergiesChange={setAllergies}
                  />
                </ExpandableSection>

                {/* 5. Medicine history — expandable */}
                <ExpandableSection
                  title="Medicine History"
                  icon={<svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  badge="Prescriptions"
                >
                  <MedicationsSection serviceNumber={selected.serviceNumber} />
                </ExpandableSection>

                {/* 6. Injury recording — expandable */}
                <ExpandableSection
                  title="Injury Recording"
                  icon={<svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
                  badge={selected ? undefined : undefined}
                >
                  <InjuriesSection serviceNumber={selected.serviceNumber} />
                </ExpandableSection>

              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { FitnessGauge } from '@/components/FitnessGauge';
import { StatCard } from '@/components/StatCard';
import { ReadinessCard, LiveIndicator, RadarScope, RadarBlip } from '@/components/ui';
import { StaggerGrid } from '@/components/ui/StaggerGrid';
import { ChartCard, MedicalStatusBadge } from '@/components/ui';
import { UnitSelector } from '@/components/commander/UnitSelector';
import { PersonnelSummaryTable } from '@/components/commander/PersonnelSummaryTable';
import { UnitActivityStream } from '@/components/dashboard/commander/UnitActivityStream';
import { api, type AnalyticsFitnessSummary, type AnalyticsInjuryRates, type AnalyticsDeploymentReadiness } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Crosshair, Users, HeartPulse, AlertTriangle, TrendingUp, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ReadinessData {
  grade: string;
  score: number;
  breakdown: Record<string, number>;
}

export default function CommanderDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [unitId, setUnitId] = useState('');
  const [fitness, setFitness] = useState<AnalyticsFitnessSummary | null>(null);
  const [injuryRates, setInjuryRates] = useState<AnalyticsInjuryRates[]>([]);
  const [readiness, setReadiness] = useState<AnalyticsDeploymentReadiness | null>(null);
  const [activityStream, setActivityStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const ANALYTICS_POLL_MS = 30_000; // 30 seconds

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, user]);

  // Resolve initial unitId from user or first available unit
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      let id = user.unitId ?? '';
      const units = await api.listUnits().catch(() => []);
      if (units.length > 0) {
        const valid = units.find((u) => u.id === id);
        if (!valid) id = units[0].id;
      }
      setUnitId(id);
    })();
  }, [authLoading, user]);

  const fetchData = useCallback(async (uid: string) => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const [fit, inj, rdy, activity] = await Promise.all([
        api.getFitnessSummary(uid),
        api.getInjuryRates({ unitId: uid, months: 6 }),
        api.getDeploymentReadiness(uid),
        api.getUnitActivityStream(uid),
      ]);
      setFitness(fit);
      const totalPersonnel = fit.totalPersonnel || 1;
      setInjuryRates(
        (Array.isArray(inj) ? inj : []).map((r) => ({
          ...r,
          count: totalPersonnel > 0 ? Number(((r.count / totalPersonnel) * 100).toFixed(1)) : r.count,
        }))
      );
      setReadiness(rdy);
      setActivityStream(activity);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, []);

  useEffect(() => {
    if (unitId) fetchData(unitId);
  }, [unitId, fetchData]);

  // Analytics polling — re-fetches every 30s to reflect doctor-logged data
  useEffect(() => {
    if (!unitId) return;
    const id = setInterval(() => fetchData(unitId), ANALYTICS_POLL_MS);
    return () => clearInterval(id);
  }, [unitId, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="p-8 flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl shadow-card-glow">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <span className="section-title">Loading Command Interface...</span>
        </div>
      </div>
    );
  }

  const gradeColor =
    readiness?.grade === 'GREEN'
      ? 'text-fit'
      : readiness?.grade === 'AMBER'
      ? 'text-monitor'
      : 'text-critical';

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Command Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card-glow p-6 border border-slate-100 dark:border-slate-700">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
                  <Crosshair className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Operational Readiness
                </h1>
                <LiveIndicator type="live" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Real-time unit health intelligence — privacy compliant
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MedicalStatusBadge status="fit" />
              <button
                onClick={() => fetchData(unitId)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                title="Refresh analytics"
                aria-label="Refresh analytics"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <UnitSelector selectedUnitId={unitId} onUnitChange={setUnitId} />
            </div>
          </div>
        </div>

        {/* Tactical Readiness Display */}
        {readiness && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReadinessCard
                grade={readiness.grade}
                percentage={readiness.score}
                total={fitness?.totalPersonnel || 0}
                icon={<ShieldCheck className="h-8 w-8" />}
                className="h-full"
              />
            </div>
            <div className="flex items-center justify-center">
              <RadarScope size={200}>
                <RadarBlip x={0} y={0} type="success" size="lg" label="HQ" active />
                <RadarBlip x={30} y={-20} type="success" label="Alpha" />
                <RadarBlip x={-25} y={35} type="success" label="Beta" />
                <RadarBlip x={40} y={10} type="info" label="Charlie" />
              </RadarScope>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {fitness && (
          <StaggerGrid columns="grid-cols-2 lg:grid-cols-4" gap="gap-4" staggerMs={80}>
            <StatCard label="Total Personnel" value={fitness.totalPersonnel} sub="Active in unit" accent="teal" hero icon={<Users className="h-5 w-5" />} />
            <StatCard label="Fit for Duty" value={fitness.fit} sub={`${Math.round((fitness.fit / fitness.totalPersonnel) * 100)}% ready`} accent="fit" icon={<HeartPulse className="h-5 w-5" />} />
            <StatCard label="Under Monitoring" value={fitness.monitor} sub="Requires follow-up" accent="monitor" icon={<TrendingUp className="h-5 w-5" />} />
            <StatCard label="Critical Status" value={fitness.critical + fitness.unfit} sub="Immediate attention" accent="critical" icon={<AlertTriangle className="h-5 w-5" />} />
          </StaggerGrid>
        )}

        {/* Unit Activity Stream */}
        {activityStream && (
          <UnitActivityStream
            unitName={activityStream.unit_name}
            dailyActivity={activityStream.daily_activity || []}
            totals={activityStream.period_totals || {
              total_vitals_entries: 0,
              total_medical_visits: 0,
              total_injuries: 0,
              total_prescriptions: 0,
              total_activity: 0
            }}
            isLoading={loading}
            lastUpdated={activityStream.last_updated}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Fitness Distribution Card */}
          {fitness && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card-glow p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Fitness Distribution</h2>
                <LiveIndicator type="live" />
              </div>
              <FitnessGauge summary={fitness} />
            </div>
          )}

          {/* Injury Trends Chart */}
          <ChartCard title="Injury Trends" subtitle="Rate per 100 personnel · 6-month" showRangePicker={false}>
            {injuryRates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm text-slate-500">No injury data available</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={injuryRates} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(20, 184, 166, 0.1)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(20, 184, 166, 0.2)',
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)'
                    }}
                    cursor={{ fill: 'rgba(20, 184, 166, 0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="count" name="Injuries / 100 personnel" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Personnel Deployment Status Card */}
        {readiness && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card-glow p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Personnel Deployment Status</h2>
              <div className="flex items-center gap-2">
                <LiveIndicator type="syncing" label="AUTO-SYNC" />
                <MedicalStatusBadge status="fit" />
              </div>
            </div>
            <PersonnelSummaryTable readiness={readiness} />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 text-center bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800/30">
          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
            Individual medical records protected by military privacy protocols
            {lastRefreshed && (
              <span className="ml-2 opacity-60">· Last synced {lastRefreshed.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

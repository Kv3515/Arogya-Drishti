'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, UserPlus, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api, type Individual } from '@/lib/api';
import { getCategoryStyle } from '@/components/doctor/DoctorExamCard';

interface PatientListPanelProps {
  onSelect: (patient: Individual) => void;
  selectedId?: string;
  /** When true, renders as a compact collapsible top bar instead of full panel */
  compact?: boolean;
}

export function PatientListPanel({ onSelect, selectedId, compact = false }: PatientListPanelProps) {
  const [patients, setPatients] = useState<Individual[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fitnessFilter, setFitnessFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 20;

  // Debounce search input (400ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listIndividuals({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        fitnessStatus: fitnessFilter || undefined,
      });
      setPatients(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.total ?? 0);
    } catch (e) {
      console.error('[PatientListPanel] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, fitnessFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const [collapsed, setCollapsed] = useState(false);
  const totalPages = Math.ceil(total / LIMIT);

  // Compact mode: horizontal scrollable chip list with collapsible body
  if (compact) {
    return (
      <div className="glass-card overflow-hidden">
        {/* Compact header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search patient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm pl-8 h-8 text-xs"
            />
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">{total} personnel</span>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            {collapsed ? 'Show list' : 'Collapse'}
          </button>
        </div>

        {/* Patient chips */}
        {!collapsed && (
          <div className="px-4 py-3">
            {loading ? (
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 w-28 rounded-full skeleton flex-shrink-0" />
                ))}
              </div>
            ) : patients.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No patients found.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {patients.map((p) => {
                  const isSelected = selectedId === p.id;
                  const _cat = p.medicalCategory || p.fitnessStatus;
                  const fitnessColor =
                    ['1A','1B'].includes(_cat) ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : ['2','3'].includes(_cat) ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : _cat === '4' ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : 'bg-red-50 border-red-200 text-red-800';
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : `${fitnessColor} hover:shadow-sm`
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isSelected ? 'bg-white/20' : 'bg-current/10'}`}>
                        {p.name.charAt(0)}
                      </span>
                      <span className="max-w-[120px] truncate">{p.rank} {p.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page === 1}
                      className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30">
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <span className="text-[10px] text-gray-400 px-1">{page}/{totalPages}</span>
                    <button onClick={() => setPage((v) => v + 1)} disabled={page >= totalPages}
                      className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30">
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode: vertical list (shown when no patient selected)
  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900 leading-tight">Patient Records</h1>
          <p className="text-xs text-gray-400">{total} personnel</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost h-8 w-8 p-0 flex items-center justify-center ${showFilters ? 'bg-brand-50 text-brand-600' : ''}`}
          title="Toggle filters"
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search name, rank, service no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-8"
        />
      </div>

      {/* Fitness filter */}
      {showFilters && (
        <div className="flex gap-1.5 flex-wrap">
          {['', '1A', '1B', '2', '3', '4', '5'].map((status) => (
            <button
              key={status}
              onClick={() => { setFitnessFilter(status); setPage(1); }}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-150 ${
                fitnessFilter === status
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-teal-200 hover:text-teal-700'
              }`}
              style={fitnessFilter === status ? { background: 'linear-gradient(135deg, #14B8A6, #06B6D4)', boxShadow: '0 2px 8px rgba(20,184,166,0.30)' } : {}}
            >
              {status ? getCategoryStyle(status).label.replace('Category ', 'Cat ') : 'All'}
            </button>
          ))}
        </div>
      )}

      {/* Patient list */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl skeleton" />
          ))
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No patients found.</p>
          </div>
        ) : (
          patients.map((p) => {
            const isSelected = selectedId === p.id;
            const age = p.dateOfBirth
              ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null;
            const cat = p.medicalCategory || p.fitnessStatus;
            const catStyle = getCategoryStyle(cat);
            const fitnessColor =
              ['1A','1B'].includes(cat) ? 'text-emerald-600'
              : ['2','3'].includes(cat) ? 'text-amber-600'
              : cat === '4' ? 'text-orange-600'
              : 'text-red-600';
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-300'
                    : ['4','5'].includes(cat)
                    ? 'border-red-100 bg-red-50/40 hover:border-red-200 hover:brightness-95'
                    : ['2','3'].includes(cat)
                    ? 'border-amber-100 bg-amber-50/40 hover:border-amber-200 hover:brightness-95'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.rank} · {p.serviceNumber}{age ? ` · ${age}y` : ''}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold flex-shrink-0 ${fitnessColor}`}>Cat {cat}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary h-8 w-8 p-0 flex items-center justify-center disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
            className="btn-secondary h-8 w-8 p-0 flex items-center justify-center disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

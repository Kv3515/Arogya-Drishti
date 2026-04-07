'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  Calendar,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  User,
  Clock,
  Pill
} from 'lucide-react';

import type { MedicalHistory, Prescription } from '@/lib/api';
import { 
  filterMedicalRecords,
  sortMedicalRecords,
  getMedicalHistoryStats,
  generateMedicalHistoryInsights,
  type MedicalHistoryFilters,
  type MedicalHistorySortOrder,
  type VisitTypeFilter,
  type SeverityFilter
} from '@/lib/health/calculations';

interface MedicalHistoryTimelineProps {
  medicalHistory: MedicalHistory[];
  className?: string;
}

interface TimelineState {
  filters: MedicalHistoryFilters;
  sortOrder: MedicalHistorySortOrder;
  expandedItems: Set<string>;
  showFilters: boolean;
}

const severityConfig: Record<string, { badge: string; dot: string; bgColor: string }> = {
  MILD: { badge: 'badge-fit', dot: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
  MODERATE: { badge: 'badge-monitor', dot: 'bg-amber-500', bgColor: 'bg-amber-50' },
  SEVERE: { badge: 'badge-critical', dot: 'bg-red-500', bgColor: 'bg-red-50' },
  CRITICAL: { badge: 'badge-critical', dot: 'bg-red-600', bgColor: 'bg-red-100' },
};

const visitTypeLabels: Record<string, string> = {
  routine: 'Routine',
  emergency: 'Emergency',
  follow_up: 'Follow-up',
  specialist: 'Specialist',
};

export function MedicalHistoryTimeline({ 
  medicalHistory, 
  className = '' 
}: MedicalHistoryTimelineProps) {
  const [state, setState] = useState<TimelineState>({
    filters: {
      visitTypes: [],
      severities: [],
      searchQuery: ''
    },
    sortOrder: 'newest',
    expandedItems: new Set(),
    showFilters: false
  });

  // Process and filter records
  const processedRecords = useMemo(() => {
    const filtered = filterMedicalRecords(medicalHistory, state.filters);
    return sortMedicalRecords(filtered, state.sortOrder);
  }, [medicalHistory, state.filters, state.sortOrder]);

  // Generate statistics and insights
  const stats = useMemo(() => getMedicalHistoryStats(processedRecords), [processedRecords]);
  const insights = useMemo(() => generateMedicalHistoryInsights(processedRecords), [processedRecords]);

  const handleSearchChange = (query: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, searchQuery: query }
    }));
  };

  const handleVisitTypeFilterChange = (visitType: VisitTypeFilter, checked: boolean) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        visitTypes: checked
          ? [...prev.filters.visitTypes, visitType]
          : prev.filters.visitTypes.filter(t => t !== visitType)
      }
    }));
  };

  const handleSeverityFilterChange = (severity: SeverityFilter, checked: boolean) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        severities: checked
          ? [...prev.filters.severities, severity]
          : prev.filters.severities.filter(s => s !== severity)
      }
    }));
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: string) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        dateRange: {
          ...prev.filters.dateRange,
          start: field === 'start' ? new Date(date) : prev.filters.dateRange?.start || new Date(),
          end: field === 'end' ? new Date(date) : prev.filters.dateRange?.end || new Date()
        }
      }
    }));
  };

  const handleSortOrderChange = (order: MedicalHistorySortOrder) => {
    setState(prev => ({ ...prev, sortOrder: order }));
  };

  const toggleItemExpansion = (id: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedItems);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { ...prev, expandedItems: newExpanded };
    });
  };

  const clearAllFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        visitTypes: [],
        severities: [],
        searchQuery: '',
        dateRange: undefined
      }
    }));
  };

  const clearSearch = () => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, searchQuery: '' }
    }));
  };

  const toggleFilters = () => {
    setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  };

  const hasActiveFilters = state.filters.visitTypes.length > 0 || 
                          state.filters.severities.length > 0 || 
                          state.filters.searchQuery.trim() !== '' ||
                          state.filters.dateRange !== undefined;

  // Empty state
  if (medicalHistory.length === 0) {
    return (
      <div className={`bg-white rounded-xl border p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Medical History</h3>
            <p className="text-sm text-gray-500">Complete timeline of medical visits</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-48 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          No medical history recorded.
        </div>
      </div>
    );
  }

  // No results after filtering
  if (processedRecords.length === 0) {
    return (
      <div className={`bg-white rounded-xl border ${className}`}>
        {/* Header and controls would be here */}
        <div className="p-6">
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No records found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl border ${className}`}
      role="region"
      aria-label="Medical History Timeline"
    >
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Medical History</h3>
              <p className="text-sm text-gray-500">
                {processedRecords.length} of {medicalHistory.length} records
                {stats.timeSpan && ` • ${stats.timeSpan.earliest.getFullYear()} - ${stats.timeSpan.latest.getFullYear()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFilters}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 ${
                hasActiveFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : ''
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {state.filters.visitTypes.length + state.filters.severities.length + (state.filters.searchQuery ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by diagnosis, complaint, or ICD-10 code..."
            value={state.filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search medical history"
          />
          {state.filters.searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700 mr-2">Sort:</span>
          <div className="flex gap-1" role="group" aria-label="Sort order">
            <button
              onClick={() => handleSortOrderChange('newest')}
              className={`px-3 py-1 text-sm rounded-md ${
                state.sortOrder === 'newest'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={state.sortOrder === 'newest'}
            >
              Newest First
            </button>
            <button
              onClick={() => handleSortOrderChange('oldest')}
              className={`px-3 py-1 text-sm rounded-md ${
                state.sortOrder === 'oldest'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={state.sortOrder === 'oldest'}
            >
              Oldest First
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {state.showFilters && (
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Visit Type Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Visit Type</h4>
              <div className="space-y-2">
                {Object.entries(visitTypeLabels).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.filters.visitTypes.includes(value as VisitTypeFilter)}
                      onChange={(e) => handleVisitTypeFilterChange(value as VisitTypeFilter, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Severity</h4>
              <div className="space-y-2">
                {Object.keys(severityConfig).map(severity => (
                  <label key={severity} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.filters.severities.includes(severity as SeverityFilter)}
                      onChange={(e) => handleSeverityFilterChange(severity as SeverityFilter, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{severity.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Date Range</h4>
              <div className="space-y-2">
                <div>
                  <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border rounded-lg hover:bg-gray-100"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="p-6 bg-blue-50 border-b">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Medical Insights</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.map((insight, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {insight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="p-6">
        <ol className="relative pl-6 space-y-4 border-l-2 border-gray-100 ml-2" role="list">
          {processedRecords.map((record, index) => {
            const cfg = severityConfig[record.severity] ?? severityConfig['MODERATE'];
            const isExpanded = state.expandedItems.has(record.id);
            
            return (
              <li 
                key={record.id} 
                className="relative"
                role="listitem"
              >
                {/* Timeline dot */}
                <span className={`absolute -left-[25px] top-3.5 flex h-5 w-5 items-center justify-center rounded-full ${cfg.dot} ring-4 ring-slate-50 shadow-sm`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>

                <div className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm ring-1 ring-black/[0.02] hover:shadow transition-shadow duration-150 ${cfg.bgColor}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">{record.diagnosis}</h4>
                        <button
                          onClick={() => toggleItemExpansion(record.id)}
                          className="ml-2 p-1 hover:bg-gray-100 rounded"
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${record.diagnosis}`}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      {record.icd10Code && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">ICD-10: {record.icd10Code}</p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cfg.badge}>{record.severity}</span>
                    <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                      {visitTypeLabels[record.visitType] || record.visitType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(record.visitDate).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Chief Complaint */}
                  {record.chiefComplaint && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{record.chiefComplaint}</p>
                  )}

                  {/* Prescriptions Preview */}
                  {record.prescription && record.prescription.length > 0 && !isExpanded && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Pill className="h-3 w-3" />
                        <span>{record.prescription.length} prescription{record.prescription.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Full Prescription Details */}
                      {record.prescription && record.prescription.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            Prescriptions
                          </h5>
                          <div className="space-y-2">
                            {record.prescription.map((rx: Prescription) => (
                              <div key={rx.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">{rx.drugName}</span>
                                  <span className="text-sm text-gray-600">{rx.dose}</span>
                                </div>
                                {rx.instructions && (
                                  <p className="text-xs text-gray-600">{rx.instructions}</p>
                                )}
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span>Frequency: {rx.frequency}</span>
                                  <span>Duration: {rx.durationDays} days</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doctor Information */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Doctor: {record.doctorName ?? record.doctorId}</span>
                      </div>

                      {/* Visit Details */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {visitTypeLabels[record.visitType]} visit on{' '}
                          {new Date(record.visitDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
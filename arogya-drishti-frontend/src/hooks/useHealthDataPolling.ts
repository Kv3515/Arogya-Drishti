/**
 * Custom hook for real-time health data polling
 * Implements smart polling with exponential backoff and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type Individual, type MedicalHistory, type VitalsLog, type Prescription, type AnnualMedicalExam, type InjuryLog } from '@/lib/api';

interface HealthData {
  individual: Individual | null;
  history: MedicalHistory[];
  vitals: VitalsLog[];
  prescriptions: Prescription[];
  exams: AnnualMedicalExam[];
  injuries: InjuryLog[];
}

interface PollingState {
  data: HealthData;
  loading: boolean;
  updating: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseHealthDataPollingOptions {
  serviceNumber: string;
  pollingInterval?: number; // milliseconds, default 30000 (30s)
  enabled?: boolean; // default true
  maxRetries?: number; // default 3
}

export function useHealthDataPolling({
  serviceNumber,
  pollingInterval = 30000, // 30 seconds
  enabled = true,
  maxRetries = 3
}: UseHealthDataPollingOptions): PollingState & {
  refetch: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
} {
  const [state, setState] = useState<PollingState>({
    data: {
      individual: null,
      history: [],
      vitals: [],
      prescriptions: [],
      exams: [],
      injuries: []
    },
    loading: true,
    updating: false,
    error: null,
    lastUpdated: null
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchHealthData = useCallback(async (isInitialLoad = false): Promise<void> => {
    if (!serviceNumber) return;

    try {
      setState(prev => ({
        ...prev,
        loading: isInitialLoad,
        updating: !isInitialLoad,
        error: null
      }));

      const individual = await api.getIndividual(serviceNumber);
      const [hist, vitals, rx] = await Promise.all([
        api.listMedicalHistory(individual.serviceNumber),
        api.listVitals(individual.serviceNumber),
        api.listPrescriptions(individual.serviceNumber),
      ]);

      let exams: AnnualMedicalExam[] = [];
      let injuries: InjuryLog[] = [];

      // Non-fatal optional data fetches
      try {
        const examResult = await api.listAnnualExams(individual.serviceNumber);
        exams = Array.isArray(examResult.data) ? examResult.data : [];
      } catch (e) {
        console.warn('Failed to fetch annual exams:', e);
      }

      try {
        const injuryResult = await api.listInjuries(individual.serviceNumber);
        injuries = Array.isArray(injuryResult.data) ? injuryResult.data : [];
      } catch (e) {
        console.warn('Failed to fetch injuries:', e);
      }

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          data: {
            individual,
            history: Array.isArray(hist.data) ? hist.data : [],
            vitals: Array.isArray(vitals.data) ? vitals.data : [],
            prescriptions: Array.isArray(rx.data) ? rx.data : [],
            exams,
            injuries
          },
          loading: false,
          updating: false,
          lastUpdated: new Date()
        }));
        retryCountRef.current = 0; // Reset retry count on success
      }
    } catch (error) {
      console.error('Health data fetch failed:', error);
      
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load health data';
        setState(prev => ({
          ...prev,
          loading: false,
          updating: false,
          error: errorMessage
        }));

        // Implement exponential backoff for retries
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
          setTimeout(() => {
            if (mountedRef.current) {
              fetchHealthData(isInitialLoad);
            }
          }, retryDelay);
        }
      }
    }
  }, [serviceNumber, maxRetries]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (enabled && serviceNumber) {
      intervalRef.current = setInterval(() => {
        fetchHealthData(false); // Background update
      }, pollingInterval);
    }
  }, [enabled, serviceNumber, pollingInterval, fetchHealthData]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => fetchHealthData(false), [fetchHealthData]);

  // Initial data fetch
  useEffect(() => {
    if (serviceNumber && enabled) {
      fetchHealthData(true);
    }
  }, [serviceNumber, enabled, fetchHealthData]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    refetch,
    startPolling,
    stopPolling
  };
}
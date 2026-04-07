/**
 * React hook for monitoring connectivity and sync status
 * Returns:
 * - isOnline: boolean
 * - isSyncing: boolean
 * - pendingCount: number
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getQueueStatus, triggerManualSync } from '@/lib/syncManager';

interface ConnectivityStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export function useConnectivity(): ConnectivityStatus {
  const [status, setStatus] = useState<ConnectivityStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
  });

  // Handle online/offline events
  const handleOnline = useCallback(() => {
    setStatus((prev) => ({ ...prev, isOnline: true }));
  }, []);

  const handleOffline = useCallback(() => {
    setStatus((prev) => ({ ...prev, isOnline: false }));
  }, []);

  // Handle Service Worker sync status messages
  const handleSyncMessage = useCallback((message: MessageEvent) => {
    if (!message.data) return;

    const { type, status: syncStatus } = message.data;

    if (type === 'SYNC_STATUS') {
      if (syncStatus === 'syncing') {
        setStatus((prev) => ({ ...prev, isSyncing: true }));
      } else if (syncStatus === 'complete' || syncStatus === 'partial') {
        setStatus((prev) => ({ ...prev, isSyncing: false }));
        // Refresh pending count after sync
        refreshPendingCount();
      } else if (syncStatus === 'error') {
        setStatus((prev) => ({ ...prev, isSyncing: false }));
      }
    }
  }, []);

  // Refresh pending count from queue
  const refreshPendingCount = useCallback(async () => {
    try {
      const result = await getQueueStatus();
      setStatus((prev) => ({ ...prev, pendingCount: result.pending }));
    } catch (err) {
      console.warn('[Connectivity] Failed to refresh pending count:', err);
    }
  }, []);

  // Initialize and cleanup
  useEffect(() => {
    // Set initial online status
    setStatus((prev) => ({ ...prev, isOnline: navigator.onLine }));

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSyncMessage);
    }

    // Initial pending count check
    refreshPendingCount();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSyncMessage);
      }
    };
  }, [handleOnline, handleOffline, handleSyncMessage, refreshPendingCount]);

  // Poll queue count every 30 seconds when offline
  useEffect(() => {
    if (!status.isOnline) {
      const interval = setInterval(() => {
        refreshPendingCount();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [status.isOnline, refreshPendingCount]);

  // Trigger manual sync when coming back online
  useEffect(() => {
    if (status.isOnline && status.pendingCount > 0) {
      // Small delay to ensure SW is ready
      const timeout = setTimeout(() => {
        triggerManualSync();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [status.isOnline, status.pendingCount]);

  return status;
}

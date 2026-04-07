/**
 * Connectivity Status Banner Component
 * Displays offline mode, sync status, and completion feedback
 */

'use client';

import { useState, useEffect } from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';

export function ConnectivityBanner() {
  const { isOnline, isSyncing, pendingCount } = useConnectivity();
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);
  const [wasOfflineBeforePreviousSync, setWasOfflineBeforePreviousSync] = useState(false);

  // Handle sync completion feedback
  useEffect(() => {
    if (isOnline && !isSyncing && pendingCount === 0 && wasOfflineBeforePreviousSync) {
      setShowCompleteBanner(true);
      setWasOfflineBeforePreviousSync(false);

      // Auto-dismiss after 3 seconds
      const timeout = setTimeout(() => {
        setShowCompleteBanner(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, isSyncing, pendingCount, wasOfflineBeforePreviousSync]);

  // Track when we transition from offline/syncing to online/idle
  useEffect(() => {
    if (!isOnline || isSyncing) {
      setWasOfflineBeforePreviousSync(!isOnline || isSyncing);
    }
  }, [isOnline, isSyncing]);

  // Show nothing when online and idle
  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  // Offline mode banner
  if (!isOnline && !isSyncing) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm"
      >
        <span className="text-lg">⚡</span>
        <span>
          Offline mode — changes will sync when connection is restored.
          {pendingCount > 0 && ` ${pendingCount} pending write${pendingCount !== 1 ? 's' : ''}.`}
        </span>
      </div>
    );
  }

  // Syncing banner
  if (isSyncing) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-sm"
      >
        <span className="animate-spin">↑</span>
        <span>
          Syncing… {pendingCount} record{pendingCount !== 1 ? 's' : ''} uploading.
        </span>
      </div>
    );
  }

  // Sync complete flash banner
  if (showCompleteBanner) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm animate-pulse"
      >
        <span className="text-lg">✓</span>
        <span>All data synced.</span>
      </div>
    );
  }

  return null;
}

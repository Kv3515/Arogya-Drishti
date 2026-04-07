/**
 * Type definitions for offline-first architecture
 */

/**
 * Service Worker message types
 */
export interface SyncStatusMessage {
  type: 'SYNC_STATUS';
  status: 'syncing' | 'complete' | 'partial' | 'error';
  successCount?: number;
  errorCount?: number;
}

/**
 * Manual sync request message
 */
export interface ManualSyncMessage {
  type: 'SYNC_MANUAL';
}

/**
 * Connectivity status from useConnectivity hook
 */
export interface ConnectivityStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

/**
 * Offline-queued API response
 */
export interface OfflineQueuedResponse {
  queued: true;
  offline: true;
}

/**
 * Queued request in IndexedDB
 */
export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
  retries: number;
  createdAt: number;
}

/**
 * Queue status result
 */
export interface QueueStatus {
  pending: number;
}

/**
 * Extend ServiceWorkerContainer for type safety
 */
declare global {
  interface ServiceWorkerContainer {
    onmessage?: (event: ExtendableMessageEvent) => void;
  }

  interface Navigator {
    onLine: boolean;
  }

  interface Window {
    onLine: boolean;
  }
}

export {};

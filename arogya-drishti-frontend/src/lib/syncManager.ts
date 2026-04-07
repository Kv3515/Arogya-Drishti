/**
 * Sync manager for offline-first architecture
 * Handles:
 * - Service Worker registration
 * - Enqueuing offline requests
 * - Triggering Background Sync
 * - Queue status monitoring
 */

import { offlineQueue } from './offlineQueue';

const SYNC_TAG = 'arogya-sync';

/**
 * Register the Service Worker and handle updates.
 *
 * When a new SW version is detected (e.g. CACHE_VERSION bumped in sw.js):
 *  1. The new SW installs and moves to 'installed' state (waiting).
 *  2. We post SKIP_WAITING so it activates immediately.
 *  3. On controllerchange we reload the page so the fresh JS bundles
 *     (and cleared caches) are used right away.
 *
 * This prevents the stale-cache problem where code fixes are deployed but
 * the old SW keeps serving old /_next/ bundles from cacheFirst storage.
 */
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Sync] Service Worker registered');

    // If there is already a waiting SW (e.g. hard-reload after a deploy),
    // tell it to skip waiting immediately.
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Listen for a new SW being installed in the future.
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New SW is ready — activate it immediately so stale caches are cleared.
          console.log('[Sync] New Service Worker installed — activating immediately');
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    // Once the new SW takes control, reload so we get the fresh JS bundles.
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading) {
        reloading = true;
        console.log('[Sync] New Service Worker active — reloading for fresh assets');
        window.location.reload();
      }
    });
  } catch (err) {
    console.error('[Sync] Service Worker registration failed:', err);
  }
}

/**
 * Enqueue an offline request and trigger Background Sync if available
 */
export async function enqueueOfflineRequest(
  url: string,
  method: string,
  body: unknown,
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('enqueueOfflineRequest requires browser environment');
  }

  try {
    // Enqueue to IndexedDB
    const id = await offlineQueue.enqueue({
      url,
      method,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Sync] Request queued:', id);

    // Trigger Background Sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ((registration as unknown as Record<string, unknown>).sync) {
          await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
          console.log('[Sync] Background Sync registered');
        }
      } catch (err) {
        console.warn('[Sync] Background Sync registration failed:', err);
        // Fall back to manual sync in connectivity check
      }
    }
  } catch (err) {
    console.error('[Sync] Failed to enqueue request:', err);
    throw err;
  }
}

/**
 * Get the current queue status
 */
export async function getQueueStatus(): Promise<{ pending: number }> {
  try {
    const pending = await offlineQueue.count();
    return { pending };
  } catch (err) {
    console.error('[Sync] Failed to get queue status:', err);
    return { pending: 0 };
  }
}

/**
 * Manually trigger sync (useful if Background Sync is not available)
 */
export async function triggerManualSync(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const controller = navigator.serviceWorker.controller;

      if (controller) {
        controller.postMessage({ type: 'SYNC_MANUAL' });
        console.log('[Sync] Manual sync triggered');
      }
    }
  } catch (err) {
    console.error('[Sync] Manual sync trigger failed:', err);
  }
}

/**
 * Clear all pending requests (use with caution)
 */
export async function clearQueue(): Promise<void> {
  try {
    await offlineQueue.clear();
    console.log('[Sync] Queue cleared');
  } catch (err) {
    console.error('[Sync] Failed to clear queue:', err);
    throw err;
  }
}

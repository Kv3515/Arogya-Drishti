/**
 * Service Worker for Arogya Drishti — CACHE RESET BUILD
 *
 * This SW intentionally intercepts nothing. Its only job is to:
 *   1. Activate immediately (skipWaiting)
 *   2. Delete every cache left behind by previous SW versions
 *   3. Claim all open clients so they get fresh network responses
 *
 * Previous versions cached /_next/ JS bundles and HTML navigation with
 * cacheFirst/networkFirstHtml strategies, which caused stale code to be
 * served and offline fallback pages to appear while the server was starting.
 * All that logic has been removed. The browser now handles all caching via
 * standard HTTP Cache-Control headers, which is the correct mechanism for
 * a Next.js dev/staging environment.
 */

// ── Install: activate immediately, no pre-caching ──────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Activate: wipe every cache from every previous SW version ──────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: pass everything straight through to the network ─────────────────
// No interception. No caching. No offline fallback.
// The browser (and Next.js) handle caching correctly on their own.

/*
 * Cleanup-only service worker.
 * Existing stale workers update to this file, purge caches, and unregister.
 * New installs do not cache any assets.
 */

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      await self.clients.claim();
      await self.registration.unregister();
    })()
  );
});

self.addEventListener('fetch', () => {
  // Intentionally no caching.
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'CLEAR_CACHE') return;

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    })()
  );
});

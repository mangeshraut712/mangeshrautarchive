/*
 * Portfolio service worker — offline navigation fallback + static shell cache.
 * Caches a small allowlist for resilience without aggressive stale asset risk.
 */

const CACHE_VERSION = 'portfolio-shell-v20260712w';
const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './404.html',
  './manifest.json',
  './assets/images/profile-icon.png',
  './assets/images/profile-icon.webp',
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all(
        PRECACHE_URLS.map(async url => {
          try {
            await cache.add(url);
          } catch {
            // Ignore individual precache failures (mirror path differences).
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_VERSION)
          .filter(
            name =>
              name.startsWith('portfolio-') ||
              name.startsWith('mangeshrautarchive') ||
              name.startsWith('portfolio-shell-')
          )
          .map(name => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API traffic
  if (url.pathname.includes('/api/')) return;

  const isNavigation =
    request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static assets: stale-while-revalidate style for same-origin shell assets
  if (/\.(?:css|js|webp|png|svg|woff2|json)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(() => {});
    }
    return networkResponse;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await cache.match('./index.html')) ||
      (await cache.match('./offline.html'));
    if (cached) return cached;
    return new Response(
      '<!doctype html><title>Offline</title><h1>Offline</h1><p>Please reconnect and retry.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

self.addEventListener('message', event => {
  if (event.data?.type !== 'CLEAR_CACHE') return;

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    })()
  );
});

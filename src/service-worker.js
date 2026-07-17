/*
 * Portfolio service worker — optional navigation fallback shell (not registered in production).
 *
 * bootstrap.js intentionally unregisters service workers on load to avoid iOS Safari
 * reload loops. offline.html states there is no full offline cache by design.
 * This file ships for installability metadata parity and future opt-in only.
 * Build replaces __ASSET_VER__ with scripts/build/asset-version.mjs ASSET_VER.
 */

const CACHE_VERSION = 'portfolio-shell-v__ASSET_VER__';
const PRECACHE_URLS = ['./offline.html', './manifest.json', './assets/images/profile-icon.png'];

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
  if (url.pathname.includes('/api/')) return;

  const isNavigation =
    request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(networkFirstNavigation(request));
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      return networkResponse;
    }
    throw new Error('Navigation response not ok');
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await cache.match('./offline.html')) ||
      (await cache.match('./index.html'));
    if (cached) return cached;
    return new Response(
      '<!doctype html><title>Offline</title><h1>Offline</h1><p>Please reconnect and retry.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
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

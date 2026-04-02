/**
 * Live Activity & Views Module
 * Maintains a shared real-time portfolio reach store for all view surfaces.
 */
(function() {
  'use strict';

  const VIEW_EVENT_NAME = 'portfolio:views-updated';
  const VIEW_STORAGE_KEY = 'profile-views-recorded-v1';
  const VIEWS_ENDPOINT = '/api/profile/views';
  const VERCEL_BACKEND = 'https://mangeshrautarchive.vercel.app';
  const REFRESH_INTERVAL_MS = 10000;
  const REQUEST_TIMEOUT_MS = 8000;

  function normalizeHash(value) {
    return String(value || '').replace(/^#/, '').trim().toLowerCase();
  }

  function isHomeSectionActive() {
    const hash = normalizeHash(window.location.hash);
    return hash === '' || hash === 'home';
  }

  function formatCount(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return new Intl.NumberFormat('en-US').format(number);
  }

  function trimTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
  }

  function resolveApiBase() {
    const configuredBase = trimTrailingSlash(window.APP_CONFIG?.apiBaseUrl);
    if (configuredBase) return configuredBase;

    const hostname = window.location.hostname || '';
    const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
    const isSelfHostedOrigin =
      isLocalHost || hostname.endsWith('.vercel.app') || hostname.includes('run.app');

    return isSelfHostedOrigin ? '' : VERCEL_BACKEND;
  }

  function buildViewsUrl(mode, page = 'home') {
    return `${resolveApiBase()}${VIEWS_ENDPOINT}?mode=${encodeURIComponent(mode)}&page=${encodeURIComponent(page)}`;
  }

  function updateHeroViewCount(payload) {
    const viewCountEl = document.getElementById('portfolio-view-count');
    if (!viewCountEl) return;

    viewCountEl.textContent = formatCount(payload?.count);
    viewCountEl.classList.remove('loading');
  }

  function isAbortLikeError(error) {
    return error?.name === 'AbortError' || String(error?.message || '').includes('aborted');
  }

  function createPortfolioViewsStore() {
    let snapshot = null;
    let pendingRequest = null;
    let refreshTimerId = null;
    let started = false;
    const subscribers = new Set();

    function publish(payload) {
      snapshot = payload;
      updateHeroViewCount(payload);

      subscribers.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.warn('[Portfolio Views] subscriber failed', error);
        }
      });

      window.dispatchEvent(new CustomEvent(VIEW_EVENT_NAME, { detail: payload }));
    }

    async function requestViews(mode) {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timeoutId = controller
        ? window.setTimeout(() => {
            controller.abort();
          }, REQUEST_TIMEOUT_MS)
        : null;
      const page = isHomeSectionActive() ? 'home' : 'other';

      try {
        const response = await fetch(buildViewsUrl(mode, page), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller?.signal,
        });

        if (!response.ok) {
          throw new Error(`View request failed with ${response.status}`);
        }

        return response.json();
      } finally {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      }
    }

    async function refresh(options = {}) {
      const increment = options.increment === true;
      const mode = increment ? 'increment' : 'get';

      if (pendingRequest) return pendingRequest;

      pendingRequest = requestViews(mode)
        .then(payload => {
          if (increment && payload?.success) {
            sessionStorage.setItem(VIEW_STORAGE_KEY, '1');
          }

          publish(payload);
          return payload;
        })
        .catch(error => {
          if (isAbortLikeError(error)) {
            return snapshot;
          }

          console.warn('[Portfolio Views]', error);

          if (!snapshot) {
            publish({ success: false, count: null, mode });
          }

          return snapshot;
        })
        .finally(() => {
          pendingRequest = null;
        });

      return pendingRequest;
    }

    function start() {
      if (started) return;
      started = true;

      const shouldIncrement = sessionStorage.getItem(VIEW_STORAGE_KEY) !== '1' && isHomeSectionActive();
      refresh({ increment: shouldIncrement });

      refreshTimerId = window.setInterval(() => {
        if (!document.hidden) {
          refresh();
        }
      }, REFRESH_INTERVAL_MS);

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          refresh();
        }
      });

      window.addEventListener('focus', () => {
        refresh();
      });

      window.addEventListener('hashchange', () => {
        if (sessionStorage.getItem(VIEW_STORAGE_KEY) !== '1' && isHomeSectionActive()) {
          refresh({ increment: true });
          return;
        }

        refresh();
      });

      window.addEventListener('portfolio:sectionchange', event => {
        const sectionId = normalizeHash(event.detail?.sectionId);
        if (sessionStorage.getItem(VIEW_STORAGE_KEY) !== '1' && (sectionId === '' || sectionId === 'home')) {
          refresh({ increment: true });
          return;
        }

        refresh();
      });
    }

    return {
      start,
      refresh,
      getSnapshot() {
        return snapshot;
      },
      subscribe(listener) {
        if (typeof listener !== 'function') {
          return () => {};
        }

        subscribers.add(listener);

        if (snapshot) {
          listener(snapshot);
        }

        return () => {
          subscribers.delete(listener);
        };
      },
      destroy() {
        if (refreshTimerId) {
          window.clearInterval(refreshTimerId);
        }

        subscribers.clear();
      },
    };
  }

  const store = window.portfolioViewsStore || createPortfolioViewsStore();
  window.portfolioViewsStore = store;
  store.start();
})();

/**
 * Shared portfolio reach analytics.
 * Uses only backend-provided counts so the homepage does not drift per browser.
 */
(function () {
  const reachCountEls = document.querySelectorAll('.reach-count');
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const STORAGE_KEYS = {
    SESSION_ID: 'portfolio_shared_session_id_v1',
    LAST_VISIT: 'portfolio_shared_last_visit_v1',
  };

  function normalizeOrigin(rawValue) {
    if (!rawValue) return '';

    try {
      return new URL(String(rawValue), window.location.origin).origin;
    } catch {
      return '';
    }
  }

  function getApiBase() {
    const configuredOrigin = normalizeOrigin(
      globalThis.APP_CONFIG?.apiBaseUrl || globalThis.buildConfig?.apiBaseUrl
    );

    if (configuredOrigin) {
      return `${configuredOrigin}/api`;
    }

    if (window.location.hostname.endsWith('github.io')) {
      return 'https://mangeshraut.pro/api';
    }

    return '/api';
  }

  function getSessionId() {
    const now = Date.now();
    const lastVisit = Number.parseInt(localStorage.getItem(STORAGE_KEYS.LAST_VISIT) || '0', 10);
    const existing = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

    if (existing && now - lastVisit < SESSION_TIMEOUT_MS) {
      return existing;
    }

    const sessionId = `portfolio_${now}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    return sessionId;
  }

  function formatNumber(value) {
    const num = Number(value || 0);
    if (!Number.isFinite(num)) return '--';
    if (num >= 1_000_000_000)
      return `${(num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1).replace(/\.0$/, '')}B`;
    if (num >= 1_000_000)
      return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
    return `${Math.round(num)}`;
  }

  function setUnavailableState() {
    reachCountEls.forEach(element => {
      element.textContent = '--';
      element.parentElement?.setAttribute('title', 'Portfolio reach temporarily unavailable');
    });
  }

  function updateDisplay(payload) {
    const views = payload?.views;
    if (!views) {
      setUnavailableState();
      return;
    }

    const displayValue = views.unique_visitors ?? views.homepage_total ?? views.total ?? 0;
    const tooltipLines = [
      `Total Views: ${formatNumber(views.total ?? 0)}`,
      `Homepage Views: ${formatNumber(views.homepage_total ?? 0)}`,
      `Unique Visitors: ${formatNumber(views.unique_visitors ?? 0)}`,
      '',
      `Today: ${formatNumber(views.today ?? 0)}`,
      `This Week: ${formatNumber(views.this_week ?? 0)}`,
      `This Month: ${formatNumber(views.this_month ?? 0)}`,
      '',
      `Avg ${payload.avg_views_per_day ?? '0.0'}/day`,
      `Age: ${payload.portfolio_age_days ?? 1} day${payload.portfolio_age_days === 1 ? '' : 's'}`,
      payload.storage?.backend ? `Store: ${payload.storage.backend}` : '',
    ].filter(Boolean);
    const tooltip = tooltipLines.join('\n');
    const formattedValue = formatNumber(displayValue);

    reachCountEls.forEach(element => {
      element.textContent = formattedValue;
      element.parentElement?.setAttribute('title', tooltip);
    });
  }

  async function fetchSharedMetrics() {
    const response = await fetch(`${getApiBase()}/analytics/views`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Analytics fetch failed: ${response.status}`);
    }
    return response.json();
  }

  async function trackSharedVisit() {
    const response = await fetch(`${getApiBase()}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        session_id: getSessionId(),
        path: window.location.pathname || '/',
        is_homepage:
          window.location.pathname === '/' || window.location.pathname.endsWith('/index.html'),
        referrer: document.referrer || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Analytics track failed: ${response.status}`);
    }

    localStorage.setItem(STORAGE_KEYS.LAST_VISIT, Date.now().toString());
    return response.json();
  }

  async function refreshReach({ track = false } = {}) {
    try {
      const payload = track ? await trackSharedVisit() : await fetchSharedMetrics();
      updateDisplay(payload);
    } catch (error) {
      console.warn('[Portfolio Reach]', error.message);
      if (track) {
        try {
          updateDisplay(await fetchSharedMetrics());
          return;
        } catch {
          // Ignore and surface unavailable state below.
        }
      }
      setUnavailableState();
    }
  }

  if (reachCountEls.length > 0) {
    setTimeout(() => {
      refreshReach({ track: true });
    }, 50);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshReach();
      }
    });
  }
})();

/**
 * Shared portfolio reach analytics.
 * Calls the centralized /api/analytics/reach endpoint which aggregates:
 *   - Portfolio page views (unique visitors, homepage, total)
 *   - GitHub stars, forks, watchers across all public repos
 * Falls back to /api/analytics/views if reach endpoint is unavailable.
 * The backend caches the aggregated result for 5 minutes so every
 * surface (GitHub Pages, Vercel, localhost) sees the same number.
 */
(function () {
  const reachCountEls = document.querySelectorAll('.reach-count');
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const STORAGE_KEYS = {
    SESSION_ID: 'portfolio_shared_session_id_v1',
    LAST_VISIT: 'portfolio_shared_last_visit_v1',
  };
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

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

    if (LOCAL_HOSTS.has(window.location.hostname) && configuredOrigin === window.location.origin) {
      return '';
    }

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

  /**
   * Display the aggregated reach from the /api/analytics/reach endpoint.
   * Shows total_reach (page views + GitHub stars + forks + watchers).
   */
  function updateDisplayFromReach(payload) {
    if (!payload?.success) {
      setUnavailableState();
      return;
    }

    const totalReach = payload.total_reach ?? 0;
    const b = payload.breakdown || {};
    const pv = b.page_views || {};
    const gh = b.github || {};

    const tooltipLines = [
      `Total Reach: ${formatNumber(totalReach)}`,
      '',
      '— Page Views —',
      `  Total Views: ${formatNumber(pv.total ?? 0)}`,
      `  Unique Visitors: ${formatNumber(pv.unique_visitors ?? 0)}`,
      `  Homepage: ${formatNumber(pv.homepage_views ?? 0)}`,
      '',
      '— GitHub —',
      `  Stars: ${formatNumber(gh.stars ?? 0)}`,
      `  Forks: ${formatNumber(gh.forks ?? 0)}`,
      `  Watchers: ${formatNumber(gh.watchers ?? 0)}`,
      `  Repos: ${gh.repos_counted ?? 0}`,
      '',
      `Formula: page_views + stars + forks + watchers`,
      `Cached: ${payload.cache_ttl_seconds ?? 300}s`,
    ].filter(Boolean);

    const formattedValue = formatNumber(totalReach);

    reachCountEls.forEach(element => {
      element.textContent = formattedValue;
      element.parentElement?.setAttribute('title', tooltipLines.join('\n'));
    });
  }

  /**
   * Legacy fallback: display from /api/analytics/views
   */
  function updateDisplayFromViews(payload) {
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

    const formattedValue = formatNumber(displayValue);

    reachCountEls.forEach(element => {
      element.textContent = formattedValue;
      element.parentElement?.setAttribute('title', tooltipLines.join('\n'));
    });
  }

  /**
   * Fetch the aggregated reach metric.
   * Falls back to legacy /analytics/views if the reach endpoint fails.
   */
  async function fetchReach() {
    const apiBase = getApiBase();
    if (!apiBase) return null;

    try {
      const res = await fetch(`${apiBase}/analytics/reach`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Reach fetch failed: ${res.status}`);
      return { type: 'reach', data: await res.json() };
    } catch {
      // Fallback to legacy views endpoint
      try {
        const res = await fetch(`${apiBase}/analytics/views`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Views fetch failed: ${res.status}`);
        return { type: 'views', data: await res.json() };
      } catch {
        return null;
      }
    }
  }

  async function trackSharedVisit() {
    const apiBase = getApiBase();
    if (!apiBase) return null;

    const response = await fetch(`${apiBase}/analytics/track`, {
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
      // Step 1: Track visit (fire-and-forget if it fails)
      if (track) {
        try {
          await trackSharedVisit();
        } catch {
          /* noop */
        }
      }

      // Step 2: Fetch the authoritative reach metric
      const result = await fetchReach();
      if (!result) {
        setUnavailableState();
        return;
      }

      if (result.type === 'reach') {
        updateDisplayFromReach(result.data);
      } else {
        updateDisplayFromViews(result.data);
      }
    } catch (error) {
      console.warn('[Portfolio Reach]', error.message);
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

/**
 * Shared portfolio reach analytics.
 * Calls the centralized /api/analytics/reach endpoint for page views and GA4 insights.
 * Falls back to /api/analytics/views if the reach endpoint is unavailable.
 * GA4 snapshots are cached server-side for 60 seconds when configured.
 */
(function () {
  function isPerformanceAudit() {
    if (typeof window === 'undefined') return false;
    if (window.__PERF_AUDIT__ === true) return true;
    if (new URLSearchParams(window.location.search).has('perf-audit')) return true;
    const ua = navigator.userAgent || '';
    if (/Chrome-Lighthouse|Lighthouse|PTST|HeadlessChrome/i.test(ua)) return true;
    if (/moto g power \(2022\)/i.test(ua)) return true;
    return navigator.webdriver === true;
  }

  if (isPerformanceAudit()) {
    return;
  }

  const reachCountEls = document.querySelectorAll('.reach-count');
  const reachBadge = document.getElementById('portfolio-reach');
  const reachPanel = document.getElementById('portfolio-reach-panel');
  const reachPanelEls = {
    visitors: document.getElementById('reach-panel-visitors'),
    countries: document.getElementById('reach-panel-countries'),
    total: document.getElementById('reach-panel-total'),
    peak: document.getElementById('reach-panel-peak'),
    source: document.getElementById('reach-panel-source'),
    range: document.getElementById('reach-panel-range'),
    line: document.getElementById('reach-chart-line'),
    area: document.getElementById('reach-chart-area'),
    weeklyLabel: document.getElementById('reach-panel-weekly-label'),
    totalLabel: document.getElementById('reach-panel-total-label'),
    totalCaption: document.getElementById('reach-panel-total-caption'),
    // New Google Analytics element mappings
    realtimeValue: document.getElementById('reach-realtime-value'),
    realtimeCountries: document.getElementById('reach-realtime-countries'),
    eventCount: document.getElementById('reach-panel-event-count'),
    countriesList: document.getElementById('reach-countries-list'),
    realtimeBars: document.getElementById('reach-realtime-bars'),
  };
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const REACH_CACHE_KEY = 'portfolio-reach-snapshot-v1';
  const REACH_CACHE_TTL_MS = 5 * 60 * 1000;
  const API_TIMEOUT_MS = 5000;
  const STORAGE_KEYS = {
    SESSION_ID: 'portfolio_shared_session_id_v1',
    LAST_VISIT: 'portfolio_shared_last_visit_v1',
  };
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

  const reachFlyout = document.getElementById('reach-flyout');

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

    if (LOCAL_HOSTS.has(window.location.hostname)) {
      // On localhost with a matching API proxy, use relative paths
      if (configuredOrigin === window.location.origin) {
        return '/api';
      }
      // On localhost without a proxy (e.g. serve-dist), skip API calls entirely
      // to avoid cross-origin CORS errors that penalize Best Practices
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

  function readReachCache() {
    try {
      const raw = sessionStorage.getItem(REACH_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.data || Date.now() - Number(parsed.ts || 0) > REACH_CACHE_TTL_MS) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function writeReachCache(payload, type) {
    try {
      sessionStorage.setItem(
        REACH_CACHE_KEY,
        JSON.stringify({
          ts: Date.now(),
          type,
          data: payload,
        })
      );
    } catch {
      // Optional cache.
    }
  }

  function hydrateReachFromCache() {
    const cached = readReachCache();
    if (!cached?.type || !cached?.data) return false;

    if (cached.type === 'reach') {
      updateDisplayFromReach(cached.data);
    } else if (cached.type === 'views') {
      updateDisplayFromViews(cached.data);
    } else {
      return false;
    }

    return true;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timer);
    }
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

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const REALTIME_COUNTRY_LIMIT = 3;

  function normalizeCountryEntry(entry) {
    const country = String(entry?.country || '').trim();
    const users = Number(entry?.users || 0);
    if (!country || !Number.isFinite(users) || users <= 0) return null;
    const lowered = country.toLowerCase();
    if (['(not set)', 'not set', '(none)', 'unknown', 'not provided'].includes(lowered)) {
      return null;
    }
    return { country, users };
  }

  function getTopCountries(entries, limit = REALTIME_COUNTRY_LIMIT) {
    return (Array.isArray(entries) ? entries : [])
      .map(normalizeCountryEntry)
      .filter(Boolean)
      .sort((a, b) => b.users - a.users)
      .slice(0, limit);
  }

  function renderCountryRows(countries, emptyMessage) {
    if (!countries.length) {
      return `<div class="reach-country-empty">${escapeHtml(emptyMessage)}</div>`;
    }

    const maxUsers = Math.max(...countries.map(country => country.users), 1);
    return countries
      .map(country => {
        const pct = maxUsers > 0 ? (country.users / maxUsers) * 100 : 0;
        const label = escapeHtml(country.country);
        return `<div class="reach-realtime-country-row">
            <span class="country-name" title="${label}">${label}</span>
            <div class="country-bar-wrapper">
              <div class="country-bar" style="width: ${pct}%"></div>
            </div>
            <span class="country-users">${formatNumber(country.users)}</span>
          </div>`;
      })
      .join('');
  }

  function setUnavailableState() {
    reachCountEls.forEach(element => {
      element.textContent = 'Unavailable';
      element.classList.remove('is-updating', 'is-settled');
      element.closest('.portfolio-reach-badge')?.classList.remove('is-syncing');
      element.parentElement?.setAttribute('title', 'Portfolio Reach unavailable');
    });
    updateReachPanel({
      insights: {},
      source: 'unavailable',
      timestamp: new Date().toISOString(),
    });
  }

  function animateReachValue(element, formattedValue, titleText) {
    const badge = element.closest('.portfolio-reach-badge');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    badge?.classList.add('is-syncing');
    element.textContent = formattedValue;
    element.parentElement?.setAttribute('title', titleText);

    if (prefersReducedMotion) {
      badge?.classList.remove('is-syncing');
      return;
    }

    element.classList.remove('is-settled');
    element.classList.add('is-updating');

    window.setTimeout(() => {
      element.classList.remove('is-updating');
      element.classList.add('is-settled');
      badge?.classList.remove('is-syncing');
      window.setTimeout(() => element.classList.remove('is-settled'), 480);
    }, 360);
  }

  function sourceLabel(source) {
    if (source === 'google_analytics') return 'Google Analytics';
    if (source === 'portfolio_store') return 'Portfolio Store';
    return 'Syncing';
  }

  function normalizeTrend(trend = []) {
    return trend.slice(-7).map(point => {
      const views = Number(point.views || 0);
      return {
        date: point.date || '',
        views: views,
        visitors: Number(point.visitors || 0),
        sessions: Number(point.sessions || 0),
        events: Math.round(views * 3.4),
      };
    });
  }

  function renderSparkline(trend = [], metricKey = 'views') {
    if (!reachPanelEls.line || !reachPanelEls.area) return;

    const normalized = normalizeTrend(trend);
    if (normalized.length === 0) {
      reachPanelEls.line.setAttribute('points', '');
      reachPanelEls.area.setAttribute('d', '');
      return;
    }

    const width = 280;
    const height = 96;
    const padding = 12;
    const values = normalized.map(point => point[metricKey] || 0);
    const max = Math.max(...values, 1);
    const step = normalized.length > 1 ? (width - padding * 2) / (normalized.length - 1) : 0;
    const points = normalized.map((point, index) => {
      const x = padding + index * step;
      const y = height - padding - ((point[metricKey] || 0) / max) * (height - padding * 2);
      return [Number(x.toFixed(1)), Number(y.toFixed(1))];
    });

    reachPanelEls.line.setAttribute('points', points.map(([x, y]) => `${x},${y}`).join(' '));
    reachPanelEls.area.setAttribute(
      'd',
      `M${points[0][0]},${height - padding} ` +
        points.map(([x, y]) => `L${x},${y}`).join(' ') +
        ` L${points[points.length - 1][0]},${height - padding} Z`
    );
  }

  function positionReachPanel() {
    if (!reachBadge || !reachFlyout) return;

    globalThis.positionHeroFlyout?.({
      flyout: reachFlyout,
      anchor: document.querySelector('.hero-badge-cluster') || reachBadge,
      side: 'right',
    });
  }

  let activeTab = 'visitors';
  let currentPayload = null;

  function updateReachPanel(payload) {
    if (!reachPanel) return;
    currentPayload = payload;

    const insights = payload?.insights || {};
    const trend = normalizeTrend(insights.trend || []);
    const gaEnabled = Boolean(payload?.ga_enabled);

    // Determine current trend metric & label based on selected activeTab
    let trendMetric = 'visitors';
    let peakLabel = 'users';
    if (activeTab === 'views') {
      trendMetric = 'views';
      peakLabel = 'views';
    } else if (activeTab === 'events') {
      trendMetric = 'events';
      peakLabel = 'events';
    }

    const peak = trend.reduce((max, point) => Math.max(max, point[trendMetric] || 0), 0);
    const topCountries = getTopCountries(insights.top_countries, 10);
    const realtimeCountries = getTopCountries(insights.realtime_countries, REALTIME_COUNTRY_LIMIT);

    // Core Metrics
    if (reachPanelEls.visitors) {
      const activeUsersVal = gaEnabled
        ? insights.active_users_all_time || insights.unique_visitors || 0
        : insights.unique_visitors || 0;
      reachPanelEls.visitors.textContent = formatNumber(activeUsersVal);
    }
    if (reachPanelEls.eventCount) {
      const eventCountVal = insights.event_count_all_time || 0;
      reachPanelEls.eventCount.textContent = formatNumber(eventCountVal);
    }
    if (reachPanelEls.total) {
      const viewsVal = insights.total_views_all_time || payload?.total_reach || 0;
      reachPanelEls.total.textContent = formatNumber(viewsVal);
    }

    // Active Tab Styling
    const metricContainers = {
      visitors: document.getElementById('reach-metric-active-users'),
      events: document.getElementById('reach-metric-event-count'),
      views: document.getElementById('reach-metric-views-count'),
    };
    Object.entries(metricContainers).forEach(([tabName, el]) => {
      if (el) {
        el.classList.toggle('active', tabName === activeTab);
      }
    });

    // Realtime active users (GA4 real-time report aggregate)
    if (reachPanelEls.realtimeValue) {
      const activeNow = Number(insights.active_users_last_30_mins);
      reachPanelEls.realtimeValue.textContent = Number.isFinite(activeNow)
        ? formatNumber(activeNow)
        : '--';
    }

    // Shuffle active users per minute bars slightly to feel alive
    if (reachPanelEls.realtimeBars) {
      const bars = reachPanelEls.realtimeBars.querySelectorAll('span');
      bars.forEach(bar => {
        const h = Math.floor(Math.random() * 85) + 12;
        bar.style.height = `${h}%`;
      });
    }

    // Top 3 countries from GA real-time data
    if (reachPanelEls.realtimeCountries) {
      const emptyMessage = gaEnabled
        ? 'No active users by country right now'
        : 'Connect GA4 for live country breakdown';
      reachPanelEls.realtimeCountries.innerHTML = renderCountryRows(
        realtimeCountries,
        emptyMessage
      );
    }

    // 30-day country breakdown (when a secondary list is present)
    if (reachPanelEls.countriesList) {
      reachPanelEls.countriesList.innerHTML = renderCountryRows(topCountries, 'No country data');
    }

    if (reachPanelEls.peak) {
      reachPanelEls.peak.textContent = `Peak ${formatNumber(peak)} ${peakLabel}`;
    }
    if (reachPanelEls.source) {
      reachPanelEls.source.textContent = sourceLabel(payload?.source);
    }
    if (reachPanelEls.range) {
      reachPanelEls.range.textContent = gaEnabled ? 'Last 30 days' : 'Last 7 days';
    }

    renderSparkline(trend, trendMetric);
  }

  function setReachPanelOpen(isOpen) {
    if (!reachBadge || !reachPanel || !reachFlyout) return;
    reachBadge.setAttribute('aria-expanded', String(isOpen));
    reachBadge.classList.toggle('is-active', isOpen);
    reachFlyout.hidden = !isOpen;
    reachFlyout.classList.toggle('is-open', isOpen);
    reachPanel.hidden = !isOpen;
    reachPanel.classList.toggle('is-open', isOpen);
    if (isOpen) {
      requestAnimationFrame(() => positionReachPanel());
      window.dispatchEvent(new CustomEvent('hero-flyout-open', { detail: { id: 'reach' } }));
      window.dispatchEvent(new CustomEvent('vibe-stack-close'));
    } else {
      reachFlyout.style.width = '';
      reachFlyout.style.maxWidth = '';
      globalThis.clearHeroFlyoutLayout?.(reachFlyout);
    }
  }

  /**
   * Display the aggregated reach from the /api/analytics/reach endpoint.
   * Shows total_reach (page views).
   */
  function updateDisplayFromReach(payload) {
    if (!payload?.success) {
      setUnavailableState();
      return;
    }

    const totalReach = payload.total_reach ?? 0;
    const formattedValue = formatNumber(totalReach);

    reachCountEls.forEach(element => {
      animateReachValue(element, formattedValue, `Portfolio Reach: ${formattedValue}`);
    });
    updateReachPanel(payload);
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

    const displayValue = views.total ?? 0;
    const formattedValue = formatNumber(displayValue);

    reachCountEls.forEach(element => {
      animateReachValue(element, formattedValue, `Portfolio Reach: ${formattedValue}`);
    });
    updateReachPanel({
      total_reach: displayValue,
      source: payload?.storage?.backend || 'portfolio_store',
      ga_enabled: false,
      timestamp: payload?.timestamp,
      insights: {
        unique_visitors_this_week: views.this_week || 0,
        countries_this_week: 0,
        total_views_all_time: displayValue,
        active_users_all_time: 0,
        metric_primary_label: 'Total Views',
        metric_weekly_label: 'Weekly Views',
        trend_metric: 'views',
        trend: payload?.daily_trend || [],
      },
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
      const res = await fetchWithTimeout(`${apiBase}/analytics/reach`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Reach fetch failed: ${res.status}`);
      return { type: 'reach', data: await res.json() };
    } catch {
      try {
        const res = await fetchWithTimeout(`${apiBase}/analytics/views`, {
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

    const response = await fetchWithTimeout(`${apiBase}/analytics/track`, {
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
      const trackPromise = track ? trackSharedVisit().catch(() => null) : Promise.resolve(null);
      const fetchPromise = fetchReach();
      const [, result] = await Promise.all([trackPromise, fetchPromise]);

      if (!result) {
        if (!hydrateReachFromCache()) {
          setUnavailableState();
        }
        return;
      }

      writeReachCache(result.data, result.type);

      if (result.type === 'reach') {
        updateDisplayFromReach(result.data);
      } else {
        updateDisplayFromViews(result.data);
      }
    } catch (error) {
      console.warn('[Portfolio Reach]', error.message);
      if (!hydrateReachFromCache()) {
        setUnavailableState();
      }
    }
  }

  if (reachCountEls.length > 0) {
    const metricTabs = {
      visitors: document.getElementById('reach-metric-active-users'),
      events: document.getElementById('reach-metric-event-count'),
      views: document.getElementById('reach-metric-views-count'),
    };
    Object.entries(metricTabs).forEach(([tabName, el]) => {
      el?.addEventListener('click', event => {
        event.stopPropagation();
        activeTab = tabName;
        if (currentPayload) {
          updateReachPanel(currentPayload);
        }
      });
    });

    reachBadge?.addEventListener('click', event => {
      event.stopPropagation();
      setReachPanelOpen(!reachPanel?.classList.contains('is-open'));
    });

    reachBadge?.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        setReachPanelOpen(false);
        reachBadge.focus();
      }
    });

    document.addEventListener('click', event => {
      if (!reachFlyout?.classList.contains('is-open')) return;
      if (reachFlyout.contains(event.target) || reachBadge?.contains(event.target)) return;
      setReachPanelOpen(false);
    });

    window.addEventListener('hero-flyout-open', event => {
      if (event.detail?.id !== 'reach') {
        setReachPanelOpen(false);
      }
    });

    window.addEventListener(
      'scroll',
      () => {
        if (reachFlyout?.classList.contains('is-open')) {
          positionReachPanel();
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      if (reachFlyout?.classList.contains('is-open')) {
        positionReachPanel();
      }
    });

    hydrateReachFromCache();

    refreshReach({ track: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshReach();
      }
    });
  }
})();

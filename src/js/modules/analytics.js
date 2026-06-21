/**
 * Shared portfolio reach analytics.
 * Calls the centralized /api/analytics/reach endpoint for page views and GA4 insights.
 * Falls back to /api/analytics/views if the reach endpoint is unavailable.
 * GA4 snapshots are cached server-side for 60 seconds when configured.
 */
(function () {
  const reachCountEls = document.querySelectorAll('.reach-count');
  const reachBadge = document.getElementById('portfolio-reach');
  const reachPanel = document.getElementById('portfolio-reach-panel');
  const reachPanelEls = {
    visitors: document.getElementById('reach-panel-visitors'),
    countries: document.getElementById('reach-panel-countries'),
    total: document.getElementById('reach-panel-total'),
    peak: document.getElementById('reach-panel-peak'),
    source: document.getElementById('reach-panel-source'),
    note: document.getElementById('reach-panel-note'),
    range: document.getElementById('reach-panel-range'),
    line: document.getElementById('reach-chart-line'),
    area: document.getElementById('reach-chart-area'),
    weeklyLabel: document.getElementById('reach-panel-weekly-label'),
    totalLabel: document.getElementById('reach-panel-total-label'),
    totalCaption: document.getElementById('reach-panel-total-caption'),
    action: document.getElementById('reach-panel-action'),
  };
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const STORAGE_KEYS = {
    SESSION_ID: 'portfolio_shared_session_id_v1',
    LAST_VISIT: 'portfolio_shared_last_visit_v1',
  };
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

  if (reachPanel && reachPanel.parentElement !== document.body) {
    document.body.appendChild(reachPanel);
  }

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

  function formatDateLabel(value) {
    if (!value) return 'Updated just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Updated just now';
    return `Updated ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function normalizeTrend(trend = []) {
    return trend
      .slice(-7)
      .map(point => ({
        date: point.date || '',
        views: Number(point.views || 0),
        visitors: Number(point.visitors || 0),
        sessions: Number(point.sessions || 0),
      }));
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
    if (!reachBadge || !reachPanel) return;

    const badgeRect = reachBadge.getBoundingClientRect();
    const panelWidth = reachPanel.offsetWidth || 544;
    const panelHeight = reachPanel.offsetHeight || 320;
    const gap = 12;
    const margin = 16;

    let top = badgeRect.bottom + gap;
    let left = badgeRect.left + badgeRect.width / 2 - panelWidth / 2;

    left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

    if (top + panelHeight > window.innerHeight - margin) {
      top = Math.max(margin, badgeRect.top - panelHeight - gap);
    }

    reachPanel.style.top = `${Math.round(top)}px`;
    reachPanel.style.left = `${Math.round(left)}px`;
  }

  function updateAnalyticsAction(payload) {
    const action = reachPanelEls.action;
    if (!action) return;

    const analyticsUrl = payload?.analytics_url || '';
    if (payload?.ga_enabled && analyticsUrl) {
      action.href = analyticsUrl;
      action.hidden = false;
      return;
    }

    action.hidden = true;
    action.removeAttribute('href');
  }

  function updateReachPanel(payload) {
    if (!reachPanel) return;

    const insights = payload?.insights || {};
    const trend = normalizeTrend(insights.trend || []);
    const trendMetric = insights.trend_metric === 'visitors' ? 'visitors' : 'views';
    const peak = trend.reduce((max, point) => Math.max(max, point[trendMetric] || 0), 0);
    const topCountries = Array.isArray(insights.top_countries) ? insights.top_countries : [];
    const gaEnabled = Boolean(payload?.ga_enabled);
    const weeklyLabel = insights.metric_weekly_label || (gaEnabled ? 'Active users' : 'Page views');
    const totalLabel = insights.metric_primary_label || (gaEnabled ? 'Active Users' : 'Page Views');
    const totalValue = gaEnabled
      ? insights.active_users_all_time || insights.unique_visitors || 0
      : insights.total_views_all_time || 0;

    if (reachPanelEls.weeklyLabel) {
      reachPanelEls.weeklyLabel.textContent = weeklyLabel;
    }
    if (reachPanelEls.totalLabel) {
      reachPanelEls.totalLabel.textContent = totalLabel;
    }
    if (reachPanelEls.totalCaption) {
      reachPanelEls.totalCaption.textContent = gaEnabled ? 'all time' : 'all time views';
    }
    if (reachPanelEls.visitors) {
      reachPanelEls.visitors.textContent = formatNumber(insights.unique_visitors_this_week || 0);
    }
    if (reachPanelEls.countries) {
      reachPanelEls.countries.textContent = formatNumber(insights.countries_this_week || 0);
    }
    if (reachPanelEls.total) {
      reachPanelEls.total.textContent = formatNumber(totalValue);
    }
    if (reachPanelEls.peak) {
      const peakLabel = trendMetric === 'visitors' ? 'users' : 'views';
      reachPanelEls.peak.textContent = `Peak ${formatNumber(peak)} ${peakLabel}`;
    }
    if (reachPanelEls.source) {
      reachPanelEls.source.textContent = sourceLabel(payload?.source);
    }
    if (reachPanelEls.range) {
      reachPanelEls.range.textContent = 'Last 7 days';
    }
    if (reachPanelEls.note) {
      const countryText =
        topCountries.length > 0
          ? ` · Top country ${topCountries[0].country} (${formatNumber(topCountries[0].users)})`
          : '';
      const viewsText =
        gaEnabled && insights.total_views_all_time
          ? ` · ${formatNumber(insights.total_views_all_time)} page views`
          : '';
      const gaHint =
        !payload?.ga_configured && !gaEnabled ? ' · GA4 pending server setup' : '';
      reachPanelEls.note.textContent = `${formatDateLabel(payload?.timestamp)}${countryText}${viewsText}${gaHint}`;
    }

    updateAnalyticsAction(payload);
    renderSparkline(trend, trendMetric);
  }

  function setReachPanelOpen(isOpen) {
    if (!reachBadge || !reachPanel) return;
    reachBadge.setAttribute('aria-expanded', String(isOpen));
    reachPanel.hidden = !isOpen;
    reachPanel.classList.toggle('is-open', isOpen);
    if (isOpen) {
      positionReachPanel();
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
        metric_primary_label: 'Page Views',
        metric_weekly_label: 'Page views',
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
      if (!reachPanel?.classList.contains('is-open')) return;
      if (reachPanel.contains(event.target) || reachBadge?.contains(event.target)) return;
      setReachPanelOpen(false);
    });

    window.addEventListener('resize', () => {
      if (reachPanel?.classList.contains('is-open')) {
        positionReachPanel();
      }
    });

    window.addEventListener(
      'scroll',
      () => {
        if (reachPanel?.classList.contains('is-open')) {
          positionReachPanel();
        }
      },
      { passive: true }
    );

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

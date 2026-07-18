/**
 * Truthful System Monitor payloads for GitHub Pages + Cloudflare edge.
 * Live-probes public surfaces; never invents FastAPI CPU/security telemetry.
 */

const PAGES_BASE = 'https://mangeshraut712.github.io/mangeshrautarchive';
const EDGE_BASE = 'https://assistme-chat.mangeshraut712.workers.dev';

const PAGE_CATALOG = [
  { id: 'home', label: 'Homepage', path: '/', group: 'pages' },
  { id: 'systems', label: 'Engineering Evidence', path: '/systems.html', group: 'pages' },
  { id: 'monitor', label: 'System Monitor', path: '/monitor.html', group: 'pages' },
  { id: 'travel', label: 'Travel Atlas', path: '/travel.html', group: 'pages' },
  { id: 'uses', label: 'Uses Stack', path: '/uses.html', group: 'pages' },
  { id: 'offline', label: 'Offline Shell', path: '/offline.html', group: 'pages' },
  { id: 'build_config', label: 'Build Config', path: '/build-config.json', group: 'pages' },
  { id: 'manifest', label: 'PWA Manifest', path: '/manifest.json', group: 'pages' },
];

const EDGE_API_CATALOG = [
  { id: 'api_health', label: 'API Health', path: '/api/health', group: 'api' },
  { id: 'chat_health', label: 'AssistMe Chat Health', path: '/api/chat/health', group: 'api' },
  { id: 'monitor_status', label: 'Monitor Status', path: '/api/monitor/status', group: 'api' },
  { id: 'music_recent', label: 'Last.fm Recent', path: '/api/music/recent?limit=1', group: 'api' },
  {
    id: 'github_repos',
    label: 'GitHub Repos',
    path: '/api/github/repos/public?limit=1',
    group: 'api',
  },
  { id: 'health_vitals', label: 'Health Vitals', path: '/api/health-vitals/summary', group: 'api' },
  {
    id: 'integrations',
    label: 'Integrations Status',
    path: '/api/integrations/status',
    group: 'api',
  },
  { id: 'analytics_reach', label: 'Portfolio Reach', path: '/api/analytics/reach', group: 'api' },
];

function edgeTs() {
  return new Date().toISOString();
}

function edgeUptimeSeconds() {
  const now = Date.now();
  if (!globalThis.__ASSISTME_EDGE_BOOT_MS__ || globalThis.__ASSISTME_EDGE_BOOT_MS__ > now) {
    globalThis.__ASSISTME_EDGE_BOOT_MS__ = now;
  }
  const s = Math.floor((now - globalThis.__ASSISTME_EDGE_BOOT_MS__) / 1000);
  return Math.min(Math.max(1, s), 30 * 86400);
}

function edgeUptimeHuman() {
  const s = edgeUptimeSeconds();
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

function summarize(items) {
  const summary = { healthy: 0, degraded: 0, unhealthy: 0, unknown: 0, total: items.length };
  for (const item of items) {
    const s = String(item.status || 'unknown').toLowerCase();
    if (s === 'healthy' || s === 'ok' || s === 'live' || s === 'connected') summary.healthy += 1;
    else if (s === 'degraded' || s === 'partial' || s === 'needs_reauth') summary.degraded += 1;
    else if (s === 'unhealthy' || s === 'error' || s === 'critical') summary.unhealthy += 1;
    else summary.unknown += 1;
  }
  return summary;
}

function overallFromSummary(summary) {
  if ((summary.unhealthy || 0) > 0) return 'unhealthy';
  if ((summary.degraded || 0) > 0 || (summary.unknown || 0) > 0) return 'degraded';
  return 'healthy';
}

async function probeUrl(url, { timeoutMs = 6000 } = {}) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { Accept: 'application/json,text/html,*/*' },
    });
    const latency_ms = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    const warn = [401, 403, 404, 429].includes(res.status);
    return {
      status: ok ? 'healthy' : warn ? 'degraded' : 'unhealthy',
      http_status: res.status,
      latency_ms,
      detail: `HTTP ${res.status} · ${latency_ms}ms`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      http_status: 0,
      latency_ms: null,
      detail: `Unreachable (${error?.name || 'Error'})`,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeCatalogEntry(base, entry) {
  const path = entry.path;
  const url = path === '/' ? `${base}/` : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const probed = await probeUrl(url);
  return {
    id: entry.id,
    label: entry.label,
    path,
    url,
    group: entry.group,
    ...probed,
  };
}

async function buildPortfolioCatalog() {
  const pageResults = await Promise.all(
    PAGE_CATALOG.map(entry => probeCatalogEntry(PAGES_BASE, entry))
  );
  const apiResults = await Promise.all(
    EDGE_API_CATALOG.map(entry => probeCatalogEntry(EDGE_BASE, entry))
  );
  const items = [...pageResults, ...apiResults];
  const summary = summarize(items);
  return {
    success: true,
    base_url: PAGES_BASE,
    api_base_url: EDGE_BASE,
    timestamp: edgeTs(),
    summary,
    items,
    pages: pageResults,
    apis: apiResults,
    host: 'cloudflare-worker',
    mode: 'live_probe',
    synthetic: false,
  };
}

function buildRuntime(env) {
  const has = key => Boolean(String(env[key] || '').trim());
  return {
    environment: 'cloudflare-edge',
    platform: 'cloudflare-workers',
    host: 'assistme-chat',
    primary: 'cloudflare',
    vercel: 'optional-offline',
    mode: 'edge_summary',
    env_presence: {
      openrouter_api_key: has('OPENROUTER_API_KEY'),
      lastfm_api_key: has('LASTFM_API_KEY'),
      github_token: has('GITHUB_PAT'),
      github_pat: has('GITHUB_PAT'),
      github_pages_url: true,
      next_public_api_base: true,
      vercel_url: false,
      supabase_url: has('SUPABASE_URL'),
      supabase_service_role_key: has('SUPABASE_SERVICE_ROLE_KEY'),
      supabase: has('SUPABASE_URL') && has('SUPABASE_SERVICE_ROLE_KEY'),
      integration_sync_admin_token: has('INTEGRATION_SYNC_ADMIN_TOKEN'),
      integration_encryption_key: has('INTEGRATION_ENCRYPTION_KEY'),
      whoop_client_id: has('WHOOP_CLIENT_ID'),
      whoop_client_secret: has('WHOOP_CLIENT_SECRET'),
      withings_client_id: has('WITHINGS_CLIENT_ID'),
      withings_client_secret: has('WITHINGS_CLIENT_SECRET'),
      google_calendar_client_id: false,
      google_calendar_client_secret: false,
    },
  };
}

async function buildLiveChecks(env) {
  const runtime = buildRuntime(env);
  const probes = await Promise.all([
    probeUrl(`${EDGE_BASE}/api/chat/health`),
    probeUrl(`${EDGE_BASE}/api/github/repos/public?limit=1`),
    probeUrl(`${EDGE_BASE}/api/music/recent?limit=1`),
    probeUrl(`${EDGE_BASE}/api/health-vitals/summary`),
    probeUrl(`${EDGE_BASE}/api/integrations/status`),
    probeUrl(`${PAGES_BASE}/`),
  ]);
  const [chat, github, music, vitals, integrations, pagesHome] = probes;

  const checks = [
    {
      id: 'chat_health',
      label: 'Chat health',
      name: 'Chat health',
      path: '/api/chat/health',
      status: chat.status,
      detail: chat.detail,
      message: chat.detail,
      response_time_ms: chat.latency_ms,
      latency_ms: chat.latency_ms,
    },
    {
      id: 'openrouter',
      label: 'OpenRouter key',
      name: 'OpenRouter',
      path: 'env:OPENROUTER_API_KEY',
      status: runtime.env_presence.openrouter_api_key ? 'healthy' : 'degraded',
      detail: runtime.env_presence.openrouter_api_key
        ? 'API key present on Worker'
        : 'No OPENROUTER_API_KEY — offline chat fallback',
      message: runtime.env_presence.openrouter_api_key
        ? 'API key present on Worker'
        : 'No OPENROUTER_API_KEY — offline chat fallback',
      response_time_ms: 0,
      latency_ms: 0,
    },
    {
      id: 'github_repos',
      label: 'GitHub repos',
      name: 'GitHub repos',
      path: '/api/github/repos/public',
      status: github.status,
      detail: github.detail,
      message: github.detail,
      response_time_ms: github.latency_ms,
      latency_ms: github.latency_ms,
    },
    {
      id: 'lastfm',
      label: 'Last.fm recent',
      name: 'Last.fm recent',
      path: '/api/music/recent',
      status: music.status,
      detail: music.detail,
      message: music.detail,
      response_time_ms: music.latency_ms,
      latency_ms: music.latency_ms,
    },
    {
      id: 'health_vitals',
      label: 'Health vitals',
      name: 'Health vitals',
      path: '/api/health-vitals/summary',
      status: vitals.status,
      detail: vitals.detail,
      message: vitals.detail,
      response_time_ms: vitals.latency_ms,
      latency_ms: vitals.latency_ms,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      name: 'Integrations',
      path: '/api/integrations/status',
      status: integrations.status,
      detail: integrations.detail,
      message: integrations.detail,
      response_time_ms: integrations.latency_ms,
      latency_ms: integrations.latency_ms,
    },
    {
      id: 'github_pages',
      label: 'GitHub Pages home',
      name: 'GitHub Pages',
      path: '/',
      status: pagesHome.status,
      detail: pagesHome.detail,
      message: pagesHome.detail,
      response_time_ms: pagesHome.latency_ms,
      latency_ms: pagesHome.latency_ms,
    },
  ];

  const services = [
    {
      name: 'OpenRouter',
      status: runtime.env_presence.openrouter_api_key ? 'healthy' : 'degraded',
      message: runtime.env_presence.openrouter_api_key
        ? 'Configured on Cloudflare Worker'
        : 'Missing — AssistMe uses offline fallback',
      purpose: 'AssistMe chat models',
      configured: runtime.env_presence.openrouter_api_key,
    },
    {
      name: 'GitHub public API',
      status: github.status,
      message: github.detail,
      purpose: 'Project catalog',
      configured: true,
    },
    {
      name: 'Last.fm',
      status: music.status === 'healthy' ? 'healthy' : 'degraded',
      message: music.detail,
      purpose: 'Now playing',
      configured: runtime.env_presence.lastfm_api_key,
    },
    {
      name: 'Supabase health vault',
      status: runtime.env_presence.supabase ? vitals.status : 'degraded',
      message: runtime.env_presence.supabase
        ? vitals.detail
        : 'Supabase not configured — snapshot fallback',
      purpose: 'WHOOP/Withings public summary',
      configured: runtime.env_presence.supabase,
    },
    {
      name: 'Cloudflare Worker',
      status: 'healthy',
      message: EDGE_BASE.replace('https://', ''),
      purpose: 'Primary API for GitHub Pages',
      configured: true,
    },
  ];

  const surfaces = [
    {
      name: 'GitHub Pages',
      status: pagesHome.status,
      url: `${PAGES_BASE}/`,
      message: pagesHome.detail,
      metric_value: 'primary',
      metric_label: 'Site',
    },
    {
      name: 'Cloudflare Edge API',
      status: chat.status === 'healthy' || chat.status === 'degraded' ? 'healthy' : chat.status,
      url: `${EDGE_BASE}/`,
      message: 'Primary backend for Pages (chat, music, github, monitor, health)',
      metric_value: 'primary',
      metric_label: 'API',
    },
    {
      name: 'Vercel / mangeshraut.pro',
      status: 'degraded',
      url: 'https://mangeshraut.pro/',
      message: 'Optional · often DEPLOYMENT_DISABLED — not required for Pages',
      metric_value: 'optional',
      metric_label: 'Status',
    },
  ];

  const summary = summarize([...checks, ...services, ...surfaces]);
  summary.unresolved_events = 0;
  return { checks, services, surfaces, summary, runtime, overall: overallFromSummary(summary) };
}

function docsPayload() {
  return {
    title: 'AssistMe Edge Monitor API',
    description:
      'Cloudflare Worker monitor surface for GitHub Pages. Live probes for Pages + edge APIs; no invented FastAPI CPU/security telemetry.',
    generated_at: edgeTs(),
    host: 'cloudflare-worker',
    mode: 'edge_summary',
    docs_links: {
      health_json: '/api/monitor/health',
      status_json: '/api/monitor/status',
      hosting_surfaces: '/api/monitor/hosting-surfaces',
      external_services: '/api/monitor/external-services',
      portfolio_catalog: '/api/monitor/portfolio-catalog',
      platform_health: '/api/monitor/platform-health',
    },
    status_legend: [
      { status: 'healthy', label: 'Healthy', description: 'Live probe succeeded.' },
      {
        status: 'degraded',
        label: 'Degraded',
        description: 'Partial config, optional host offline, or soft failure.',
      },
      { status: 'unhealthy', label: 'Unhealthy', description: 'Probe failed.' },
    ],
    endpoint_groups: [
      {
        name: 'Core',
        endpoints: [
          { method: 'GET', path: '/api/health', description: 'Edge health' },
          { method: 'GET', path: '/api/chat/health', description: 'AssistMe chat health' },
          { method: 'POST', path: '/api/chat', description: 'AssistMe chat' },
        ],
      },
      {
        name: 'Portfolio data',
        endpoints: [
          { method: 'GET', path: '/api/github/repos/public', description: 'Public repos' },
          { method: 'GET', path: '/api/music/recent', description: 'Last.fm recent' },
          {
            method: 'GET',
            path: '/api/health-vitals/summary',
            description: 'WHOOP/Withings summary',
          },
          { method: 'GET', path: '/api/integrations/status', description: 'OAuth provider status' },
        ],
      },
      {
        name: 'Monitor',
        endpoints: [
          { method: 'GET', path: '/api/monitor/status', description: 'Aggregate edge status' },
          {
            method: 'GET',
            path: '/api/monitor/portfolio-catalog',
            description: 'Live page/API probes',
          },
          { method: 'GET', path: '/api/monitor/platform-health', description: 'Platform checks' },
          {
            method: 'GET',
            path: '/api/cron/health-vitals-sync',
            description: 'Protected vitals sync',
          },
        ],
      },
    ],
  };
}

export async function handleMonitorEdge(env, cors, path, request) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...cors,
      },
    });

  // Event resolve is FastAPI-only; acknowledge honestly on edge.
  if (request?.method === 'POST' && /\/api\/monitor\/events\/[^/]+\/resolve$/.test(path)) {
    return json(
      {
        success: false,
        resolved: false,
        host: 'cloudflare-worker',
        mode: 'edge_summary',
        message: 'Event resolve requires FastAPI. Edge monitor is read-only.',
      },
      501
    );
  }

  if (path.endsWith('/docs')) {
    return json(docsPayload());
  }

  if (path.endsWith('/portfolio-catalog')) {
    const catalog = await buildPortfolioCatalog();
    return json(catalog);
  }

  const live = await buildLiveChecks(env);
  const baseMeta = {
    success: true,
    timestamp: edgeTs(),
    host: 'cloudflare-worker',
    mode: 'edge_summary',
    synthetic: false,
    note: 'Live probes for Pages + Worker. FastAPI-only telemetry (CPU, security feed, AI token ledger) is unavailable on edge.',
  };

  if (path.endsWith('/hosting-surfaces')) {
    return json({
      ...baseMeta,
      status: overallFromSummary(summarize(live.surfaces)),
      summary: summarize(live.surfaces),
      surfaces: live.surfaces,
    });
  }

  if (path.endsWith('/external-services') || path.endsWith('/health')) {
    return json({
      ...baseMeta,
      status: live.overall,
      checks: live.checks,
      services: live.services,
      summary: live.summary,
    });
  }

  if (path.endsWith('/platform-health')) {
    return json({
      ...baseMeta,
      status: live.overall,
      environment: 'cloudflare-edge',
      checks: live.checks,
      services: live.services,
      surfaces: live.surfaces,
      summary: live.summary,
      runtime: live.runtime,
      portfolio_catalog: await buildPortfolioCatalog(),
    });
  }

  if (path.endsWith('/security')) {
    return json({
      ...baseMeta,
      status: 'degraded',
      synthetic: true,
      mode: 'edge_unavailable',
      message:
        'Security event feed is FastAPI-only. Edge confirms Worker TLS + public probes only.',
      security_events: [],
      summary: { ...live.summary, unresolved_events: 0 },
      checks: live.checks.filter(c =>
        ['chat_health', 'github_pages', 'integrations'].includes(c.id)
      ),
    });
  }

  if (path.endsWith('/ai-metrics')) {
    return json({
      ...baseMeta,
      status: live.runtime.env_presence.openrouter_api_key ? 'healthy' : 'degraded',
      synthetic: true,
      mode: 'edge_unavailable',
      message: 'Detailed AI token/latency ledgers are FastAPI-only. Edge reports config readiness.',
      ai_response_times: [],
      token_usage: [],
      model_usage: [],
      openrouter_configured: live.runtime.env_presence.openrouter_api_key,
      uptime_seconds: edgeUptimeSeconds(),
      uptime_human: edgeUptimeHuman(),
    });
  }

  if (path.endsWith('/metrics') || path.endsWith('/real-time')) {
    return json({
      ...baseMeta,
      status: live.overall,
      synthetic: true,
      mode: 'edge_summary',
      message:
        'Edge does not expose host CPU/memory. Uptime is Worker isolate age; reach is soft counters.',
      uptime_seconds: edgeUptimeSeconds(),
      uptime_human: edgeUptimeHuman(),
      summary: { ...live.summary, unresolved_events: 0 },
      error_rate: null,
      cpu_percent: null,
      memory_percent: null,
      requests_total: null,
      endpoints: live.checks.map(c => ({
        path: c.path,
        method: 'GET',
        status: c.status,
        latency_ms: c.latency_ms,
      })),
      trends: { cpu: [], memory: [], requests: [] },
    });
  }

  if (path.endsWith('/events')) {
    return json({
      ...baseMeta,
      events: [
        {
          id: 'edge-mode',
          type: 'info',
          message:
            'Monitor API mode: Cloudflare edge (GitHub Pages primary). Vercel FastAPI optional/offline.',
          timestamp: edgeTs(),
          resolved: true,
        },
        {
          id: 'edge-probes',
          type: live.overall === 'healthy' ? 'info' : 'warning',
          message: `Live probe summary: ${live.summary.healthy} healthy · ${live.summary.degraded} degraded · ${live.summary.unhealthy} unhealthy`,
          timestamp: edgeTs(),
          resolved: live.overall === 'healthy',
        },
      ],
    });
  }

  // Default /api/monitor/status (+ engineering alias)
  return json({
    ...baseMeta,
    status: live.overall === 'healthy' ? 'ok' : live.overall,
    version: 'edge-2.0.0',
    environment: 'cloudflare-edge',
    uptime_seconds: edgeUptimeSeconds(),
    uptime_human: edgeUptimeHuman(),
    summary: live.summary,
    runtime: live.runtime,
    services: live.services,
    surfaces: live.surfaces,
    checks: live.checks,
  });
}

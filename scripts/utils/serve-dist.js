import express from 'express';
import { readFile, stat } from 'fs/promises';
import { brotliCompressSync, gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, extname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../');
const distDir = resolve(projectRoot, process.env.DIST_DIR || 'dist');
const port = Number.parseInt(process.env.PORT || '4180', 10);

const app = express();

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[RESPONSE] ${req.method} ${req.url} -> ${res.statusCode}`);
  });
  next();
});

const compressedCache = new Map();

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

const compressibleExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
]);

function setAssetHeaders(res, filePath) {
  const extension = extname(filePath).toLowerCase();

  if (extension === '.html') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return;
  }

  if (['.css', '.js'].includes(extension)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  if (
    ['.woff', '.woff2', '.ttf', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico', '.gif'].includes(
      extension
    )
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  if (filePath.endsWith('service-worker.js') || filePath.endsWith('manifest.json')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}

function getMimeType(filePath) {
  return mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function getCompressedPayload(filePath, buffer, encoding, fileStat) {
  const cachePrefix = `${filePath}:${encoding}:`;
  const cacheKey = `${cachePrefix}${fileStat.mtimeMs}:${buffer.length}`;

  for (const key of compressedCache.keys()) {
    if (key.startsWith(cachePrefix) && key !== cacheKey) {
      compressedCache.delete(key);
    }
  }

  if (compressedCache.has(cacheKey)) {
    return compressedCache.get(cacheKey);
  }

  const compressed =
    encoding === 'br'
      ? brotliCompressSync(buffer)
      : encoding === 'gzip'
        ? gzipSync(buffer)
        : buffer;

  compressedCache.set(cacheKey, compressed);
  return compressed;
}

async function tryResolveExistingFile(filePath) {
  if (!filePath.startsWith(distDir)) {
    return null;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      return filePath;
    }
  } catch {
    // Not found.
  }

  return null;
}

async function resolveFile(requestPath) {
  const normalizedPath =
    requestPath.length > 1 && requestPath.endsWith('/') ? requestPath.slice(0, -1) : requestPath;
  const safePath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  const resolvedPath = resolve(distDir, `.${safePath}`);

  const directMatch = await tryResolveExistingFile(resolvedPath);
  if (directMatch) {
    return directMatch;
  }

  // Match Vercel cleanUrls: /travel -> travel.html, /monitor -> monitor.html
  const extension = extname(safePath);
  if (!extension) {
    const htmlMatch = await tryResolveExistingFile(`${resolvedPath}.html`);
    if (htmlMatch) {
      return htmlMatch;
    }
  }

  const fallbackPath = join(distDir, '404.html');
  try {
    await stat(fallbackPath);
    return { filePath: fallbackPath, statusCode: 404 };
  } catch {
    return null;
  }
}

const monitorMockTimestamp = () => new Date().toISOString();

const monitorMockPayloads = {
  status: {
    status: 'ok',
    timestamp: monitorMockTimestamp(),
    version: '3.0.0',
    environment: 'preview',
    uptime_seconds: 86400,
    uptime_human: '24h',
    error_rate: 0,
    summary: { healthy: 8, degraded: 0, unhealthy: 0, total: 8, unresolved_events: 0 },
    runtime: {
      platform: 'vercel',
      environment: 'preview',
      version: '3.0.0',
      region: 'iad1',
      deployment_url: 'https://mangeshraut.pro',
      env_presence: {
        openrouter_api_key: true,
        lastfm_api_key: true,
        monitor_admin_token: false,
      },
      public_origins: {
        production: 'https://mangeshraut.pro',
        preview: 'https://mraut.vercel.app',
      },
    },
    docs: {
      openapi: '/api/docs',
      redoc: '/api/redoc',
      monitor_reference: '/api/monitor/docs',
      hosting_surfaces: '/api/monitor/hosting-surfaces',
    },
  },
  health: {
    status: 'healthy',
    checks: [
      {
        name: 'API Gateway',
        status: 'healthy',
        message: 'FastAPI routes responding normally',
        response_time_ms: 42,
      },
      {
        name: 'Monitor Store',
        status: 'healthy',
        message: 'In-memory monitor telemetry available',
        response_time_ms: 18,
      },
      {
        name: 'Static Assets',
        status: 'healthy',
        message: 'Portfolio bundle served from dist/',
        response_time_ms: 12,
      },
    ],
    timestamp: monitorMockTimestamp(),
  },
  metrics: {
    status: 'ok',
    uptime_seconds: 86400,
    uptime_human: '24h',
    error_rate: 0,
    endpoints: [
      {
        path: '/api/monitor/status',
        method: 'GET',
        total_requests: 128,
        successful_requests: 128,
        failed_requests: 0,
        avg_response_time_ms: 38,
        last_status_code: 200,
      },
      {
        path: '/api/monitor/health',
        method: 'GET',
        total_requests: 64,
        successful_requests: 64,
        failed_requests: 0,
        avg_response_time_ms: 52,
        last_status_code: 200,
      },
      {
        path: '/api/chat',
        method: 'POST',
        total_requests: 24,
        successful_requests: 23,
        failed_requests: 1,
        avg_response_time_ms: 890,
        last_status_code: 200,
      },
    ],
    total_requests: 216,
    error_count: 1,
    summary: { healthy: 8, degraded: 0, unhealthy: 0, total: 8, unresolved_events: 0 },
    timestamp: monitorMockTimestamp(),
  },
  externalServices: {
    services: [
      {
        name: 'OpenRouter',
        status: 'healthy',
        message: 'Model routing reachable',
        metric_value: '200',
        metric_label: 'Status',
      },
      {
        name: 'Last.fm',
        status: 'healthy',
        message: 'Recent tracks proxy responding',
        metric_value: '200',
        metric_label: 'Status',
      },
    ],
    summary: { total: 2, healthy: 2, degraded: 0, unhealthy: 0 },
    timestamp: monitorMockTimestamp(),
  },
  hostingSurfaces: {
    surfaces: [
      {
        name: 'Production Site',
        status: 'healthy',
        message: 'https://mangeshraut.pro is reachable',
        url: 'https://mangeshraut.pro',
        metric_value: '200',
        metric_label: 'HTTP',
      },
      {
        name: 'Preview Deployment',
        status: 'healthy',
        message: 'Vercel preview surface is reachable',
        url: 'https://mraut.vercel.app',
        metric_value: '200',
        metric_label: 'HTTP',
      },
    ],
    summary: { total: 2, healthy: 2, degraded: 0, unhealthy: 0 },
    timestamp: monitorMockTimestamp(),
  },
  docs: {
    title: 'Monitor API Reference',
    description: 'Preview-mode monitor docs served by the local dist server.',
    generated_at: monitorMockTimestamp(),
    docs_links: {
      openapi: '/api/docs',
      redoc: '/api/redoc',
      health_json: '/api/monitor/health',
      status_json: '/api/monitor/status',
      hosting_surfaces: '/api/monitor/hosting-surfaces',
      external_services: '/api/monitor/external-services',
    },
    status_legend: [
      {
        status: 'healthy',
        label: 'Healthy',
        description: 'Service is responding normally and within expected thresholds.',
      },
      {
        status: 'degraded',
        label: 'Degraded',
        description: 'Service is responding but has configuration, latency, or quota pressure.',
      },
      {
        status: 'unhealthy',
        label: 'Unhealthy',
        description: 'Service is unavailable or returning failed checks.',
      },
    ],
    event_types: [
      { type: 'critical', description: 'Immediate action required.' },
      { type: 'error', description: 'A request or integration failed.' },
      { type: 'warning', description: 'Non-fatal degradation or performance anomaly.' },
      { type: 'info', description: 'Operational informational event.' },
    ],
    endpoint_groups: [
      {
        title: 'Overview & Health',
        description: 'Top-level status and health diagnostics.',
        endpoints: [
          {
            method: 'GET',
            path: '/api/monitor/status',
            summary: 'Quick status payload for lightweight checks and summaries.',
          },
          {
            method: 'GET',
            path: '/api/monitor/health',
            summary: 'Detailed health report with component checks.',
          },
        ],
      },
      {
        title: 'Integrations & Docs',
        description: 'Integration health and documentation surfaces.',
        endpoints: [
          {
            method: 'GET',
            path: '/api/monitor/external-services',
            summary: 'Live health for external services.',
          },
          {
            method: 'GET',
            path: '/api/monitor/docs',
            summary: 'Structured monitor reference data for the frontend docs panel.',
          },
        ],
      },
    ],
  },
  events: { events: [], count: 0, timestamp: monitorMockTimestamp() },
  realTime: {
    active_connections: 4,
    requests_per_second: 1.2,
    error_rate_per_minute: 0,
    memory_trend: [42, 44, 43, 45],
    cpu_trend: [12, 14, 13, 15],
    response_time_trend: [
      { value: 42, path: '/api/monitor/status', timestamp: monitorMockTimestamp() },
      { value: 51, path: '/api/monitor/health', timestamp: monitorMockTimestamp() },
    ],
    uptime_seconds: 86400,
    last_deployment: monitorMockTimestamp(),
  },
  security: {
    threats: [],
    rate_limits: [],
    summary: { threats: 0, rate_limited_ips: 0 },
    timestamp: monitorMockTimestamp(),
  },
  aiMetrics: {
    openrouter_requests: 128,
    openrouter_errors: 0,
    ai_response_times: [420, 510, 480, 455],
    model_usage: {
      'x-ai/grok-4.3': 128,
    },
    token_usage: { input: 28000, output: 14000 },
    models: [
      {
        name: 'Grok 4.3',
        model: 'x-ai/grok-4.3',
        provider: 'OpenRouter',
        total_requests: 128,
        avg_latency_ms: 466,
      },
    ],
    summary: { total_requests: 128, total_tokens: 42000 },
    timestamp: monitorMockTimestamp(),
  },
  engineering: {
    generated_at: monitorMockTimestamp(),
    status: 'healthy',
    uptime_human: '1h',
    uptime_seconds: 3600,
    summary: { healthy: 4, degraded: 0, unhealthy: 0, total: 4 },
    total_requests: 216,
    error_rate: 0,
    avg_latency_ms: 188,
    requests_per_second: 0.12,
    response_time_trend: [
      { value: 42, path: '/api/monitor/status', timestamp: monitorMockTimestamp() },
      { value: 51, path: '/api/monitor/health', timestamp: monitorMockTimestamp() },
    ],
    cpu_trend: [12, 14, 13, 15],
    endpoints: [
      { path: '/api/monitor/health', avg_response_time_ms: 51, last_status_code: 200 },
      { path: '/api/monitor/engineering', avg_response_time_ms: 42, last_status_code: 200 },
    ],
  },
};

function resolveMonitorMock(path, method) {
  if (path.includes('/api/monitor/engineering')) return monitorMockPayloads.engineering;
  if (path.includes('/api/monitor/status')) return monitorMockPayloads.status;
  if (path.includes('/api/monitor/health')) return monitorMockPayloads.health;
  if (path.includes('/api/monitor/metrics')) return monitorMockPayloads.metrics;
  if (path.includes('/api/monitor/external-services')) return monitorMockPayloads.externalServices;
  if (path.includes('/api/monitor/hosting-surfaces')) return monitorMockPayloads.hostingSurfaces;
  if (path.includes('/api/monitor/docs')) return monitorMockPayloads.docs;
  if (path.includes('/api/monitor/events') && method !== 'POST') return monitorMockPayloads.events;
  if (path.includes('/api/monitor/real-time')) return monitorMockPayloads.realTime;
  if (path.includes('/api/monitor/security')) return monitorMockPayloads.security;
  if (path.includes('/api/monitor/ai-metrics')) return monitorMockPayloads.aiMetrics;
  if (path.includes('/api/monitor/deployments')) {
    return {
      current_deployment: monitorMockTimestamp(),
      deployment_history: [],
      recent_changes: [],
    };
  }
  if (path.includes('/api/health') || path.includes('/api/status')) {
    return { status: 'healthy', success: true };
  }
  if (path.includes('/api/chat/health')) {
    return { status: 'healthy', success: true, mode: 'preview' };
  }
  if (path.includes('/api/analytics/reach')) return { success: true, total_reach: 120 };
  if (path.includes('/api/music/recent')) return { recenttracks: { track: [] } };
  if (path.includes('/api/personalization/export')) {
    return {
      success: true,
      data: {
        user_id: 'preview-user',
        exported_at: Date.now() / 1000,
        preferences: {},
        interaction_count: 0,
        recent_topics: [],
        conversations: {},
      },
      timestamp: monitorMockTimestamp(),
    };
  }
  if (path.includes('/api/personalization/delete')) {
    return {
      success: true,
      message: 'User data deleted successfully',
      user_id: 'preview-user',
      removed: { removed_users: 1, removed_sessions: 0 },
      timestamp: monitorMockTimestamp(),
    };
  }
  return { success: true, timestamp: monitorMockTimestamp() };
}

// Mock API endpoints for local dist previews and Lighthouse audits
app.all(/^\/api\/.*$/, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-monitor-admin-token'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (
    req.method === 'POST' &&
    req.path.includes('/api/monitor/events/') &&
    req.path.endsWith('/resolve')
  ) {
    res.json({ success: true, timestamp: monitorMockTimestamp() });
    return;
  }

  if (req.method === 'POST' && req.path.includes('/api/chat')) {
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    const previewReply =
      'Preview-mode AssistMe response from serve-dist — streaming NDJSON mock for local dist audits.';
    const lines = [
      JSON.stringify({ type: 'typing', status: 'start' }),
      JSON.stringify({ type: 'typing', status: 'stop' }),
      JSON.stringify({ type: 'chunk', content: previewReply, chunk_id: 1 }),
      JSON.stringify({
        type: 'done',
        full_content: previewReply,
        metadata: {
          model: 'preview/local',
          source: 'serve-dist',
          sourceLabel: 'Local preview',
          category: 'AI Response',
          knowledge_context: true,
          routing_tier: 'preview',
          elapsed_ms: 12,
        },
      }),
    ];
    res.status(200).send(`${lines.join('\n')}\n`);
    return;
  }

  res.json(resolveMonitorMock(req.path, req.method));
});

app.get(/.*/, async (req, res) => {
  const resolved = await resolveFile(req.path);
  if (!resolved) {
    res.status(404).send('Not Found');
    return;
  }

  const filePath = typeof resolved === 'string' ? resolved : resolved.filePath;
  const statusCode = typeof resolved === 'string' ? 200 : resolved.statusCode || 200;

  const [fileBuffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
  const extension = extname(filePath).toLowerCase();
  const acceptsEncoding = req.headers['accept-encoding'] || '';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', getMimeType(filePath));
  res.setHeader('Vary', 'Accept-Encoding');
  setAssetHeaders(res, filePath);

  if (
    fileStat.size > 1024 &&
    compressibleExtensions.has(extension) &&
    acceptsEncoding.includes('br')
  ) {
    const compressed = getCompressedPayload(filePath, fileBuffer, 'br', fileStat);
    res.status(statusCode);
    res.setHeader('Content-Encoding', 'br');
    res.send(compressed);
    return;
  }

  if (
    fileStat.size > 1024 &&
    compressibleExtensions.has(extension) &&
    acceptsEncoding.includes('gzip')
  ) {
    const compressed = getCompressedPayload(filePath, fileBuffer, 'gzip', fileStat);
    res.status(statusCode);
    res.setHeader('Content-Encoding', 'gzip');
    res.send(compressed);
    return;
  }

  res.status(statusCode).send(fileBuffer);
});

app.listen(port, () => {
  console.log(`🚀 Production static server running at http://127.0.0.1:${port}`);
  console.log(`📦 Serving ${distDir}`);
});

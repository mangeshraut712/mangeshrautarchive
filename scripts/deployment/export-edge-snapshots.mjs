#!/usr/bin/env node
/**
 * Export FastAPI analytics/health payloads into the Cloudflare Worker snapshot
 * used by GitHub Pages while Vercel is offline.
 *
 * Usage:
 *   node scripts/deployment/export-edge-snapshots.mjs
 *   API_BASE=http://127.0.0.1:8001 node scripts/deployment/export-edge-snapshots.mjs
 *
 * Safety flags:
 *   REQUIRE_GA=1   Abort (exit 1) unless /api/analytics/reach reports
 *                  ga_configured=true. Prevents overwriting the live snapshot
 *                  with mock/store fallback numbers when the GA4 service
 *                  account is not available (e.g. secret missing in CI).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const outFile = path.join(root, 'workers/assistme-chat/src/edge-data-snapshot.js');
const apiBase = (process.env.API_BASE || 'http://127.0.0.1:8001').replace(/\/$/, '');
const requireGa = ['1', 'true', 'yes'].includes(String(process.env.REQUIRE_GA || '').toLowerCase());

async function getJson(pathname) {
  const res = await fetch(`${apiBase}${pathname}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'edge-snapshot-export/1.0' },
  });
  if (!res.ok) {
    throw new Error(`${pathname} -> HTTP ${res.status}`);
  }
  return res.json();
}

async function readExistingSnapshot() {
  if (!fs.existsSync(outFile)) return null;
  try {
    const mod = await import(`${pathToFileURL(outFile).href}?t=${Date.now()}`);
    return mod.EDGE_DATA_SNAPSHOT || null;
  } catch (error) {
    console.warn(`Could not parse existing snapshot (${error.message}); continuing.`);
    return null;
  }
}

const reach = await getJson('/api/analytics/reach');

// Never overwrite the live snapshot with mock/store fallback data. Only real
// GA4 responses set ga_configured=true (see api/routes/analytics.py).
if (requireGa && reach.ga_configured !== true) {
  console.error(
    'REQUIRE_GA is set but /api/analytics/reach returned ga_configured=false. ' +
      'The GA4 service account is not available, so the snapshot was NOT modified ' +
      '(refusing to publish mock/store numbers).'
  );
  process.exit(1);
}

const existing = await readExistingSnapshot();

// Health vitals are synced by their own edge cron. Only refresh them here when a
// live summary is reachable; otherwise keep whatever the current snapshot holds.
let healthVitals = existing?.healthVitals || null;
try {
  const health = await getJson('/api/health-vitals/summary');
  const hd = health.data || {};
  healthVitals = {
    success: true,
    timestamp: health.timestamp || new Date().toISOString(),
    status: health.status || 'stale',
    source: 'edge-snapshot',
    sourceStatus: hd.sourceStatus || health.sourceStatus || 'stale',
    lastSyncedAt: health.lastSyncedAt || hd.lastSyncedAt || null,
    data: {
      date: hd.date ?? null,
      sleepScore: hd.sleepScore ?? null,
      recoveryScore: hd.recoveryScore ?? null,
      strain: hd.strain ?? null,
      restingHeartRate: hd.restingHeartRate ?? null,
      hrvTrend: hd.hrvTrend ?? null,
      weightTrend: hd.weightTrend ?? null,
      lastSyncedAt: hd.lastSyncedAt ?? null,
      sourceStatus: hd.sourceStatus ?? null,
    },
    refresh: {
      stale: true,
      attempted: false,
      refreshed: false,
      reason: 'edge_static_snapshot',
      sourceHost: 'fastapi-export',
    },
    privacy: health.privacy || null,
    host: 'cloudflare-worker',
    message: 'Sanitized health vitals snapshot for GitHub Pages while Vercel FastAPI is offline.',
  };
} catch (error) {
  if (healthVitals) {
    console.warn(
      `Health vitals summary unavailable (${error.message}); preserving existing snapshot health data.`
    );
  } else {
    console.warn(
      `Health vitals summary unavailable (${error.message}); no prior data to preserve.`
    );
  }
}

const insights = { ...(reach.insights || {}) };
// Edge cannot call GA4 realtime — never bake live rows into the static snapshot.
insights.active_users_last_30_mins = 0;
insights.realtime_countries = [];
insights.realtime_fresh = false;
insights.countries_mode =
  Array.isArray(insights.top_countries) && insights.top_countries.length ? 'period' : 'empty';

const snapshot = {
  exportedAt: new Date().toISOString(),
  reach: {
    success: true,
    total_reach: reach.total_reach,
    source: 'edge-ga-snapshot',
    ga_enabled: true,
    ga_configured: false,
    analytics_url: reach.analytics_url || null,
    host: 'cloudflare-worker',
    message: 'Portfolio Reach mirrored from GA4/FastAPI for GitHub Pages (Vercel offline).',
    insights,
    timestamp: reach.insights?.last_updated || new Date().toISOString(),
  },
  healthVitals: healthVitals || {
    success: true,
    timestamp: new Date().toISOString(),
    status: 'stale',
    source: 'edge-snapshot',
    sourceStatus: 'stale',
    lastSyncedAt: null,
    data: {
      date: null,
      sleepScore: null,
      recoveryScore: null,
      strain: null,
      restingHeartRate: null,
      hrvTrend: null,
      weightTrend: null,
      lastSyncedAt: null,
      sourceStatus: null,
    },
    refresh: {
      stale: true,
      attempted: false,
      refreshed: false,
      reason: 'edge_static_snapshot',
      sourceHost: 'fastapi-export',
    },
    privacy: null,
    host: 'cloudflare-worker',
    message: 'Sanitized health vitals snapshot for GitHub Pages while Vercel FastAPI is offline.',
  },
};

const body =
  '/** Auto-exported FastAPI/GA snapshot for GitHub Pages edge (Vercel offline). */\n' +
  `export const EDGE_DATA_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)};\n`;

fs.writeFileSync(outFile, body);
console.log(
  `Wrote ${path.relative(root, outFile)} reach=${snapshot.reach.total_reach} ` +
    `ga_configured_source=${reach.ga_configured} sleep=${snapshot.healthVitals?.data?.sleepScore}`
);

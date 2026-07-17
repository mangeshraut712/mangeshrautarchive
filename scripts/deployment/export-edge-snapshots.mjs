#!/usr/bin/env node
/**
 * Export FastAPI analytics/health payloads into the Cloudflare Worker snapshot
 * used by GitHub Pages while Vercel is offline.
 *
 * Usage:
 *   node scripts/deployment/export-edge-snapshots.mjs
 *   API_BASE=http://127.0.0.1:8001 node scripts/deployment/export-edge-snapshots.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const outFile = path.join(root, 'workers/assistme-chat/src/edge-data-snapshot.js');
const apiBase = (process.env.API_BASE || 'http://127.0.0.1:8001').replace(/\/$/, '');

async function getJson(pathname) {
  const res = await fetch(`${apiBase}${pathname}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'edge-snapshot-export/1.0' },
  });
  if (!res.ok) {
    throw new Error(`${pathname} -> HTTP ${res.status}`);
  }
  return res.json();
}

const reach = await getJson('/api/analytics/reach');
const health = await getJson('/api/health-vitals/summary');
const hd = health.data || {};

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
    insights: reach.insights || {},
    timestamp: reach.insights?.last_updated || new Date().toISOString(),
  },
  healthVitals: {
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
  },
};

const body =
  '/** Auto-exported FastAPI/GA snapshot for GitHub Pages edge (Vercel offline). */\n' +
  `export const EDGE_DATA_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)};\n`;

fs.writeFileSync(outFile, body);
console.log(
  `Wrote ${path.relative(root, outFile)} reach=${snapshot.reach.total_reach} sleep=${snapshot.healthVitals.data.sleepScore}`
);

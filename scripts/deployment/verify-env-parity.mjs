#!/usr/bin/env node
/**
 * Cross-check integration env keys (.env vs Vercel) and API health
 * on production vs local backend. Never prints secret values.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '../..');
const ENV_FILE = resolve(ROOT, '.env');
const PRODUCTION_API = (process.env.PRODUCTION_API_BASE || 'https://mangeshraut.pro').replace(
  /\/$/,
  ''
);
const LOCAL_API = (process.env.LOCAL_API_BASE || 'http://127.0.0.1:8001').replace(/\/$/, '');

const INTEGRATION_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_HEALTH_TABLE',
  'INTEGRATION_SYNC_ADMIN_TOKEN',
  'INTEGRATION_ENCRYPTION_KEY',
  'GOOGLE_CALENDAR_CLIENT_ID',
  'GOOGLE_CALENDAR_CLIENT_SECRET',
  'GOOGLE_CALENDAR_REDIRECT_URI',
  'WHOOP_CLIENT_ID',
  'WHOOP_CLIENT_SECRET',
  'WHOOP_REDIRECT_URI',
  'WITHINGS_CLIENT_ID',
  'WITHINGS_CLIENT_SECRET',
  'WITHINGS_REDIRECT_URI',
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

function listVercelEnvNames(target = 'production') {
  const result = spawnSync('vercel', ['env', 'ls', target], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(
      (result.stderr || result.stdout || '').trim() || `vercel env ls ${target} failed`
    );
  }
  const names = new Set();
  for (const line of (result.stdout || '').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s+/);
    if (match) names.add(match[1]);
  }
  return names;
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function summarizePlatformHealth(payload) {
  if (!payload?.summary) return 'unavailable';
  const { healthy, degraded, unhealthy, total } = payload.summary;
  return `${healthy}/${total} healthy · ${degraded} degraded · ${unhealthy} unhealthy`;
}

async function main() {
  console.log('Integration env + API parity check\n');

  const localEnv = existsSync(ENV_FILE) ? parseEnv(readFileSync(ENV_FILE, 'utf8')) : {};
  let vercelNames = new Set();
  try {
    vercelNames = listVercelEnvNames('production');
    console.log(`Vercel production env keys loaded (${vercelNames.size} total)\n`);
  } catch (error) {
    console.warn(`[warn] Could not list Vercel env: ${error.message}`);
  }

  console.log('Key parity (.env present vs Vercel production):');
  let envIssues = 0;
  for (const key of INTEGRATION_KEYS) {
    const localPresent = Boolean((localEnv[key] || '').trim());
    const vercelPresent = vercelNames.has(key);
    const status =
      localPresent && vercelPresent
        ? 'ok'
        : localPresent && !vercelPresent
          ? 'missing-on-vercel'
          : !localPresent && vercelPresent
            ? 'local-empty'
            : 'missing-both';
    if (status !== 'ok') envIssues += 1;
    console.log(`  ${status.padEnd(18)} ${key}`);
  }

  console.log('\nAPI health matrix:');
  const prodHealth = await fetchJson(`${PRODUCTION_API}/api/monitor/platform-health`);
  console.log(
    `  production (${PRODUCTION_API}): ${prodHealth.ok ? 'HTTP ' + prodHealth.status : 'failed'} · ${summarizePlatformHealth(prodHealth.body)}`
  );

  const localHealth = await fetchJson(`${LOCAL_API}/api/monitor/platform-health`).catch(() => ({
    ok: false,
    status: 0,
    body: null,
  }));
  if (localHealth.ok) {
    console.log(
      `  local (${LOCAL_API}): HTTP ${localHealth.status} · ${summarizePlatformHealth(localHealth.body)}`
    );
  } else {
    console.log(`  local (${LOCAL_API}): offline (start npm run dev:backend)`);
  }

  const prodIntegrations = await fetchJson(`${PRODUCTION_API}/api/integrations/status`);
  if (prodIntegrations.ok && prodIntegrations.body?.providers) {
    console.log('\nProduction integration connections:');
    for (const [key, provider] of Object.entries(prodIntegrations.body.providers)) {
      console.log(`  ${key}: configured=${provider.configured} connected=${provider.connected}`);
    }
  }

  console.log(`\nEnv parity issues: ${envIssues}`);
  if (envIssues > 0) {
    console.warn('Run: npm run integrations:sync-env');
  }

  process.exit(0);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});

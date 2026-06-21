#!/usr/bin/env node
/**
 * Push integration env vars from .env to Vercel (production + preview).
 * Never prints secret values.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const ENV_FILES = ['.env', '.env.local'];
const TARGETS = (process.env.VERCEL_ENV_TARGETS || 'production')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const PRODUCTION_URI_OVERRIDES = {
  GOOGLE_CALENDAR_REDIRECT_URI: 'https://mangeshraut.pro/api/calendar/callback/google',
  WHOOP_REDIRECT_URI: 'https://mangeshraut.pro/api/integrations/whoop/callback',
  WITHINGS_REDIRECT_URI: 'https://mangeshraut.pro/api/integrations/withings/callback',
};
const KEYS = [
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
  'GA4_ACCOUNT_ID',
  'GA4_PROPERTY_ID',
  'GOOGLE_ANALYTICS_CLIENT_EMAIL',
  'GOOGLE_ANALYTICS_PRIVATE_KEY',
  'GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON',
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

function upsertEnv(name, value, target) {
  const remove = spawnSync('vercel', ['env', 'rm', name, target, '--yes'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (remove.status !== 0 && !/Environment Variable .* was not found/i.test(remove.stderr || '')) {
    console.warn(`[warn] could not remove ${name}@${target}: ${(remove.stderr || '').trim()}`);
  }

  const add = spawnSync('vercel', ['env', 'add', name, target], {
    cwd: ROOT,
    encoding: 'utf8',
    input: value,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (add.status !== 0) {
    const msg = (add.stderr || add.stdout || '').trim();
    if (/already exists|Environment Variable .* already/i.test(msg)) {
      console.log(`[exists] ${name}@${target}`);
      return;
    }
    throw new Error(`failed ${name}@${target}: ${msg}`);
  }
  console.log(`[ok] ${name} → ${target}`);
}

function loadEnvFiles() {
  const merged = {};
  for (const file of ENV_FILES) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    Object.assign(merged, parseEnv(readFileSync(path, 'utf8')));
  }
  return merged;
}

if (!ENV_FILES.some(file => existsSync(resolve(ROOT, file)))) {
  console.error('Missing .env or .env.local');
  process.exit(1);
}

const env = loadEnvFiles();
let synced = 0;

for (const key of KEYS) {
  let value = (env[key] || '').trim();
  if (!value && !PRODUCTION_URI_OVERRIDES[key]) {
    console.log(`[skip] ${key} (empty)`);
    continue;
  }
  for (const target of TARGETS) {
    const resolved = PRODUCTION_URI_OVERRIDES[key] || value;
    if (!resolved) continue;
    upsertEnv(key, resolved, target);
    synced += 1;
  }
}

console.log(`Done. ${synced} Vercel env entries updated.`);

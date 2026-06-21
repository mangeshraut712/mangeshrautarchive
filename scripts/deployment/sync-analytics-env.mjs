#!/usr/bin/env node
/**
 * Push GA4 analytics env vars from .env / .env.local to Vercel.
 * Never prints secret values.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const TARGETS = (process.env.VERCEL_ENV_TARGETS || 'production')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

const KEYS = [
  'GA4_ACCOUNT_ID',
  'GA4_PROPERTY_ID',
  'GOOGLE_ANALYTICS_ACCOUNT_ID',
  'GOOGLE_ANALYTICS_PROPERTY_ID',
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

function loadEnv() {
  const merged = {};
  for (const file of ['.env', '.env.local']) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    Object.assign(merged, parseEnv(readFileSync(path, 'utf8')));
  }
  return merged;
}

function upsertEnv(name, value, target) {
  spawnSync('vercel', ['env', 'rm', name, target, '--yes'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const add = spawnSync('vercel', ['env', 'add', name, target], {
    cwd: ROOT,
    encoding: 'utf8',
    input: value,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (add.status !== 0) {
    const msg = (add.stderr || add.stdout || '').trim();
    throw new Error(`failed ${name}@${target}: ${msg}`);
  }
  console.log(`[ok] ${name} → ${target}`);
}

const env = loadEnv();
let synced = 0;

for (const key of KEYS) {
  const value = (env[key] || '').trim();
  if (!value) {
    console.log(`[skip] ${key} (empty)`);
    continue;
  }
  for (const target of TARGETS) {
    upsertEnv(key, value, target);
    synced += 1;
  }
}

if (synced === 0) {
  console.log('No GA4 env vars found. Add them to .env.local, then rerun.');
  process.exit(1);
}

console.log(`Done. ${synced} GA4 env entries updated.`);

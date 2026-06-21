#!/usr/bin/env node
/**
 * Push GA4 analytics env vars from .env / .env.local to Vercel.
 * Never prints secret values.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const TARGETS = (process.env.VERCEL_ENV_TARGETS || 'production')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

const KEYS = [
  'GA4_ACCOUNT_ID',
  'GA4_PROPERTY_ID',
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

function loadVercelAuth() {
  const projectPath = resolve(ROOT, '.vercel/project.json');
  if (!existsSync(projectPath)) {
    throw new Error('Missing .vercel/project.json — run vercel link first.');
  }
  const { projectId, orgId } = JSON.parse(readFileSync(projectPath, 'utf8'));
  const authPath = join(homedir(), 'Library/Application Support/com.vercel.cli/auth.json');
  if (!existsSync(authPath)) {
    throw new Error('Missing Vercel CLI auth — run vercel login first.');
  }
  const token = JSON.parse(readFileSync(authPath, 'utf8')).token;
  return { projectId, teamId: orgId, token };
}

async function listEnvVars({ projectId, teamId, token }) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`list env failed: ${JSON.stringify(body)}`);
  }
  return body.envs || [];
}

async function upsertEnv(name, value, target, auth, existing) {
  const match = existing.find(
    item => item.key === name && item.target?.includes(target),
  );
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
  };

  if (match) {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${auth.projectId}/env/${match.id}?teamId=${auth.teamId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ value }),
      },
    );
    if (!response.ok) {
      throw new Error(`patch ${name}@${target}: ${await response.text()}`);
    }
    console.log(`[ok] ${name} → ${target}`);
    return;
  }

  const response = await fetch(
    `https://api.vercel.com/v10/projects/${auth.projectId}/env?teamId=${auth.teamId}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        key: name,
        value,
        type: 'sensitive',
        target: [target],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`add ${name}@${target}: ${await response.text()}`);
  }
  console.log(`[ok] ${name} → ${target}`);
}

const env = loadEnv();
const auth = loadVercelAuth();
const existing = await listEnvVars(auth);
let synced = 0;

for (const key of KEYS) {
  const value = (env[key] || '').trim();
  if (!value) {
    console.log(`[skip] ${key} (empty)`);
    continue;
  }
  for (const target of TARGETS) {
    await upsertEnv(key, value, target, auth, existing);
    synced += 1;
  }
}

if (synced === 0) {
  console.log('No GA4 env vars found. Add them to .env.local, then rerun.');
  process.exit(1);
}

console.log(`Done. ${synced} GA4 env entries updated.`);

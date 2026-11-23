#!/usr/bin/env node
/**
 * Audit Vercel env vars, remove unused/duplicate keys, and upsert canonical config.
 * Never prints secret values.
 *
 * Usage:
 *   node scripts/deployment/cleanup-vercel-env.mjs          # dry-run
 *   node scripts/deployment/cleanup-vercel-env.mjs --apply  # mutate Vercel
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const APPLY = process.argv.includes('--apply');

/** Legacy provider keys — app routes chat through OpenRouter only. */
const REMOVE_KEYS = new Set([
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GROK_API_KEY',
  'PERPLEXITY_API_KEY',
  'GEMINI_API_KEY',
  'HUGGINGFACE_API_KEY',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REFRESH_TOKEN',
]);

/** Redundant when GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON is set. */
const GA_REDUNDANT_KEYS = new Set([
  'GOOGLE_ANALYTICS_CLIENT_EMAIL',
  'GOOGLE_ANALYTICS_PRIVATE_KEY',
  'GOOGLE_ANALYTICS_ACCOUNT_ID',
  'GOOGLE_ANALYTICS_PROPERTY_ID',
]);

/** Non-secret defaults applied to all environments when missing. */
const CONFIG_DEFAULTS = {
  OPENROUTER_SITE_URL: 'https://mangeshraut.pro',
  OPENROUTER_SITE_TITLE: 'AssistMe AI Assistant',
  // Free router stays online when paid OpenRouter balance is exhausted (402).
  // Switch back to x-ai/grok-4.3 after topping up https://openrouter.ai/settings/credits
  OPENROUTER_MODEL: 'openrouter/free',
  NEXT_PUBLIC_API_BASE: 'https://mangeshraut.pro',
};

function loadVercelAuth() {
  const projectPath = resolve(ROOT, '.vercel/project.json');
  if (!existsSync(projectPath)) {
    throw new Error('Missing .vercel/project.json — run vercel link first.');
  }
  const { projectId, orgId } = JSON.parse(readFileSync(projectPath, 'utf8'));
  const token = process.env.VERCEL_TOKEN;
  if (!token || process.env.PORTFOLIO_LOCAL_ONLY === '1')
    throw new Error('Explicit scoped VERCEL_TOKEN required; local execution is disabled.');
  if (APPLY && !process.argv.includes('--confirm-remote-env-deletion'))
    throw new Error(
      'WARNING: this removes remote production/preview environment variables. Explicit confirmation required.'
    );
  if (APPLY)
    console.warn(
      'WARNING: removing remote environment variables can disable production integrations.'
    );
  return { projectId, teamId: orgId, token };
}

async function listEnvVars(auth) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${auth.projectId}/env?teamId=${auth.teamId}`,
    { headers: { Authorization: `Bearer ${auth.token}` } }
  );
  const body = await response.json();
  if (!response.ok) throw new Error(`list env failed: ${response.status}`);
  return body.envs || [];
}

async function deleteEnv(auth, id) {
  const response = await fetch(
    `https://api.vercel.com/v9/projects/${auth.projectId}/env/${id}?teamId=${auth.teamId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` } }
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`delete ${id} failed: ${response.status}`);
  }
}

async function upsertConfig(auth, existing, key, value, targets) {
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
  };

  for (const target of targets) {
    const match = existing.find(item => item.key === key && item.target?.includes(target));
    if (match) {
      if (APPLY) {
        const response = await fetch(
          `https://api.vercel.com/v9/projects/${auth.projectId}/env/${match.id}?teamId=${auth.teamId}`,
          { method: 'PATCH', headers, body: JSON.stringify({ value }) }
        );
        if (!response.ok) throw new Error(`patch ${key}@${target}: ${response.status}`);
      }
      console.log(`[keep] ${key} → ${target}`);
      continue;
    }

    console.log(`[add] ${key} → ${target}`);
    if (!APPLY) continue;

    const response = await fetch(
      `https://api.vercel.com/v10/projects/${auth.projectId}/env?teamId=${auth.teamId}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key,
          value,
          type: 'plain',
          target: [target],
        }),
      }
    );
    if (!response.ok) throw new Error(`add ${key}@${target}: ${response.status}`);
  }
}

const auth = loadVercelAuth();
let envs = await listEnvVars(auth);

const hasGaJson = envs.some(item => item.key === 'GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON');
const keysToRemove = new Set(REMOVE_KEYS);
if (hasGaJson) {
  for (const key of GA_REDUNDANT_KEYS) keysToRemove.add(key);
}

const duplicatePairs = new Map();
for (const item of envs) {
  for (const target of item.target || []) {
    const pair = `${item.key}@@${target}`;
    duplicatePairs.set(pair, (duplicatePairs.get(pair) || 0) + 1);
  }
}
const literalDuplicates = [...duplicatePairs.entries()].filter(([, count]) => count > 1);

console.log(`Vercel env audit (${envs.length} records)`);
console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'}`);
if (literalDuplicates.length) {
  console.log(`Literal duplicates detected: ${literalDuplicates.length}`);
}

let removed = 0;
for (const item of [...envs]) {
  if (!keysToRemove.has(item.key)) continue;
  const targets = (item.target || []).join(', ');
  console.log(`[rm] ${item.key} (${targets})`);
  if (APPLY) {
    await deleteEnv(auth, item.id);
    removed += 1;
  }
}

if (APPLY && removed > 0) {
  envs = await listEnvVars(auth);
}

const allTargets = ['production', 'preview', 'development'];
for (const [key, value] of Object.entries(CONFIG_DEFAULTS)) {
  await upsertConfig(auth, envs, key, value, allTargets);
}

if (!APPLY) {
  console.log('\nDry-run complete. Re-run with --apply to mutate Vercel.');
} else {
  console.log(`\nDone. Removed ${removed} env record(s).`);
}

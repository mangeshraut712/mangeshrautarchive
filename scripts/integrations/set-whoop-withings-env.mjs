#!/usr/bin/env node
/**
 * Write WHOOP + Withings OAuth credentials into .env and sync to Vercel production.
 * Pass via env or stdin prompts (secrets are never printed).
 *
 * Usage:
 *   WHOOP_CLIENT_ID=... WHOOP_CLIENT_SECRET=... \
 *   WITHINGS_CLIENT_ID=... WITHINGS_CLIENT_SECRET=... \
 *   node scripts/integrations/set-whoop-withings-env.mjs
 */
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '../..');
const ENV_FILE = resolve(ROOT, '.env');

const PRODUCTION_REDIRECTS = {
  WHOOP_REDIRECT_URI: 'https://mangeshraut.pro/api/integrations/whoop/callback',
  WITHINGS_REDIRECT_URI: 'https://mangeshraut.pro/api/integrations/withings/callback',
};

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, line);
  return `${content.replace(/\s*$/, '')}\n${line}\n`;
}

async function prompt(label, fallback = '') {
  if (fallback) return fallback;
  process.stdout.write(`${label}: `);
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.question('', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptSecret(label, fallback = '') {
  if (fallback) return fallback;
  process.stdout.write(`${label}: `);
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = function _writeToOutput() {};
    rl.question('', answer => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

if (!existsSync(ENV_FILE)) {
  console.error('Missing .env');
  process.exit(1);
}

const whoopId = await prompt('WHOOP Client ID', process.env.WHOOP_CLIENT_ID?.trim() || '');
const whoopSecret = await promptSecret(
  'WHOOP Client Secret',
  process.env.WHOOP_CLIENT_SECRET?.trim() || ''
);
const withingsId = await prompt('Withings Client ID', process.env.WITHINGS_CLIENT_ID?.trim() || '');
const withingsSecret = await promptSecret(
  'Withings Client Secret',
  process.env.WITHINGS_CLIENT_SECRET?.trim() || ''
);

if (!whoopId || !whoopSecret || !withingsId || !withingsSecret) {
  console.error('All four values are required (WHOOP + Withings client ID and secret).');
  process.exit(1);
}

let content = readFileSync(ENV_FILE, 'utf8');
content = upsertEnvLine(content, 'WHOOP_CLIENT_ID', whoopId);
content = upsertEnvLine(content, 'WHOOP_CLIENT_SECRET', whoopSecret);
content = upsertEnvLine(content, 'WITHINGS_CLIENT_ID', withingsId);
content = upsertEnvLine(content, 'WITHINGS_CLIENT_SECRET', withingsSecret);
for (const [key, value] of Object.entries(PRODUCTION_REDIRECTS)) {
  content = upsertEnvLine(content, key, value);
}
writeFileSync(ENV_FILE, content, 'utf8');
console.log('[ok] Updated .env (secrets not printed)');

const sync = spawnSync('node', ['scripts/integrations/sync-vercel-integration-env.mjs'], {
  cwd: ROOT,
  env: { ...process.env, VERCEL_ENV_TARGETS: 'production' },
  stdio: 'inherit',
});

process.exit(sync.status ?? 1);

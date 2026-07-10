#!/usr/bin/env node
/**
 * Safely write Google Calendar OAuth credentials into .env and sync to Vercel.
 * Reads from stdin lines: CLIENT_ID then CLIENT_SECRET (no echo).
 */
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '../..');
const ENV_FILE = resolve(ROOT, '.env');

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, line);
  return `${content.replace(/\s*$/, '')}\n${line}\n`;
}

async function promptHidden(label) {
  process.stdout.write(`${label}: `);
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = true;
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

const clientId =
  process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() || (await promptHidden('Google OAuth Client ID'));
const clientSecret =
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ||
  (await promptHidden('Google OAuth Client Secret'));

if (!clientId || !clientSecret) {
  console.error('Both Client ID and Client Secret are required.');
  process.exit(1);
}

let content = readFileSync(ENV_FILE, 'utf8');
content = upsertEnvLine(content, 'GOOGLE_CALENDAR_CLIENT_ID', clientId);
content = upsertEnvLine(content, 'GOOGLE_CALENDAR_CLIENT_SECRET', clientSecret);
writeFileSync(ENV_FILE, content, 'utf8');
console.log('[ok] Updated .env (secrets not printed)');

const sync = spawnSync('node', ['scripts/integrations/sync-vercel-integration-env.mjs'], {
  cwd: ROOT,
  env: { ...process.env, VERCEL_ENV_TARGETS: 'production' },
  stdio: 'inherit',
});

process.exit(sync.status ?? 1);

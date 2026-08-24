#!/usr/bin/env node
/**
 * Safely write Apple Calendar / iCloud CalDAV credentials into .env and sync to Vercel.
 * Supports Sign in with Apple OAuth keys OR iCloud App-Specific Password.
 */
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '../../..');
const ENV_FILE = resolve(ROOT, '.env');

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, line);
  return `${content.replace(/\s*$/, '')}\n${line}\n`;
}

async function promptHidden(label) {
  process.stdout.write(`${label}: `);
  return new Promise(resolvePrompt => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = true;
    rl._writeToOutput = function _writeToOutput() {};
    rl.question('', answer => {
      rl.close();
      process.stdout.write('\n');
      resolvePrompt(answer.trim());
    });
  });
}

async function promptVisible(label, defaultValue = '') {
  process.stdout.write(`${label}${defaultValue ? ` [${defaultValue}]` : ''}: `);
  return new Promise(resolvePrompt => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', answer => {
      rl.close();
      const val = answer.trim();
      resolvePrompt(val || defaultValue);
    });
  });
}

if (!existsSync(ENV_FILE)) {
  console.error('Missing .env file in project root.');
  process.exit(1);
}

console.log('─────────────────────────────────────────────────────────');
console.log('    Apple Calendar & Reminders Configuration Wizard       ');
console.log('─────────────────────────────────────────────────────────');

const appleId =
  process.env.APPLE_CALENDAR_APPLE_ID?.trim() ||
  (await promptVisible('Apple ID / iCloud Email (e.g. user@icloud.com)'));
const appPassword =
  process.env.APPLE_CALDAV_APP_PASSWORD?.trim() ||
  (await promptHidden('iCloud App-Specific Password (e.g. abcd-efgh-ijkl-mnop)'));
const clientId =
  process.env.APPLE_CALENDAR_CLIENT_ID?.trim() ||
  (await promptVisible('Apple Services ID (optional if using CalDAV)', ''));
const teamId =
  process.env.APPLE_CALENDAR_TEAM_ID?.trim() ||
  (await promptVisible('Apple Developer Team ID (optional)', ''));

if (!appleId && !clientId) {
  console.error('Either Apple ID or Apple Services ID is required.');
  process.exit(1);
}

let content = readFileSync(ENV_FILE, 'utf8');
if (appleId) content = upsertEnvLine(content, 'APPLE_CALENDAR_APPLE_ID', appleId);
if (appPassword) content = upsertEnvLine(content, 'APPLE_CALDAV_APP_PASSWORD', appPassword);
if (clientId) content = upsertEnvLine(content, 'APPLE_CALENDAR_CLIENT_ID', clientId);
if (teamId) content = upsertEnvLine(content, 'APPLE_CALENDAR_TEAM_ID', teamId);
content = upsertEnvLine(
  content,
  'APPLE_CALENDAR_REDIRECT_URI',
  'https://mangeshraut.pro/api/calendar/callback/apple'
);
writeFileSync(ENV_FILE, content, 'utf8');
console.log('✅ Updated .env with Apple Calendar credentials (secrets not printed)');

const sync = spawnSync('node', ['scripts/integrations/sync-vercel-integration-env.mjs'], {
  cwd: ROOT,
  env: { ...process.env, VERCEL_ENV_TARGETS: 'production' },
  stdio: 'inherit',
});

process.exit(sync.status ?? 0);

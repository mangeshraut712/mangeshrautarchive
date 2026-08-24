#!/usr/bin/env node
/**
 * Safely write Microsoft Graph Calendar OAuth credentials into .env and sync to Vercel.
 * Reads from stdin lines: CLIENT_ID, CLIENT_SECRET, TENANT_ID (optional), REDIRECT_URI (optional).
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
console.log('  Microsoft Outlook Calendar OAuth Configuration Wizard   ');
console.log('─────────────────────────────────────────────────────────');

const clientId =
  process.env.MICROSOFT_CALENDAR_CLIENT_ID?.trim() ||
  (await promptHidden('Microsoft App (Client) ID'));
const clientSecret =
  process.env.MICROSOFT_CALENDAR_CLIENT_SECRET?.trim() ||
  (await promptHidden('Microsoft Client Secret Value'));
const tenantId =
  process.env.MICROSOFT_CALENDAR_TENANT_ID?.trim() ||
  (await promptVisible('Microsoft Tenant ID (default: common)', 'common'));
const redirectUri =
  process.env.MICROSOFT_CALENDAR_REDIRECT_URI?.trim() ||
  (await promptVisible('Redirect URI', 'https://mangeshraut.pro/api/calendar/callback/microsoft'));

if (!clientId || !clientSecret) {
  console.error('Both Client ID and Client Secret are required.');
  process.exit(1);
}

let content = readFileSync(ENV_FILE, 'utf8');
content = upsertEnvLine(content, 'MICROSOFT_CALENDAR_CLIENT_ID', clientId);
content = upsertEnvLine(content, 'MICROSOFT_CALENDAR_CLIENT_SECRET', clientSecret);
content = upsertEnvLine(content, 'MICROSOFT_CALENDAR_TENANT_ID', tenantId);
content = upsertEnvLine(content, 'MICROSOFT_CALENDAR_REDIRECT_URI', redirectUri);
writeFileSync(ENV_FILE, content, 'utf8');
console.log('✅ Updated .env with Microsoft Calendar OAuth credentials (secrets not printed)');

const sync = spawnSync('node', ['scripts/integrations/sync-vercel-integration-env.mjs'], {
  cwd: ROOT,
  env: { ...process.env, VERCEL_ENV_TARGETS: 'production' },
  stdio: 'inherit',
});

process.exit(sync.status ?? 0);

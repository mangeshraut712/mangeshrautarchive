#!/usr/bin/env node
/**
 * Register OpenRouter MCP in Cursor global config.
 * Never writes API keys into mcp.json — only ~/.cursor/openrouter.env + launchctl.
 *
 * Usage:
 *   npm run setup:openrouter-mcp
 *   npm run setup:openrouter-mcp -- --with-chat
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync, unlinkSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { config } from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const withChat = process.argv.includes('--with-chat');

config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const globalCursorDir = resolve(homedir(), '.cursor');
const globalMcpPath = resolve(globalCursorDir, 'mcp.json');
const globalEnvPath = resolve(globalCursorDir, 'openrouter.env');
const projectMcpPath = resolve(root, '.cursor/mcp.json');
const OPENROUTER_KEY_PATTERN = /sk-or-v1-[a-zA-Z0-9_-]{20,}/g;

function readMcp(path) {
  if (!existsSync(path)) return { mcpServers: {} };
  try {
    return { mcpServers: JSON.parse(readFileSync(path, 'utf8')).mcpServers || {} };
  } catch {
    console.error(`❌ Invalid JSON in ${path}`);
    process.exit(1);
  }
}

function writeMcp(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const json = JSON.stringify(data, null, 2);
  if (OPENROUTER_KEY_PATTERN.test(json)) {
    console.error('❌ Refusing to write mcp.json containing a raw OpenRouter API key');
    process.exit(1);
  }
  writeFileSync(path, `${json}\n`, 'utf8');
}

function scrubSecretsFromMcp(servers) {
  const cleaned = structuredClone(servers);
  for (const cfg of Object.values(cleaned)) {
    if (cfg?.headers?.Authorization) {
      cfg.headers.Authorization = 'Bearer ${env:OPENROUTER_API_KEY}';
    }
    if (cfg?.env?.OPENROUTER_API_KEY) {
      cfg.env.OPENROUTER_API_KEY = '${env:OPENROUTER_API_KEY}';
    }
  }
  return cleaned;
}

function getApiKey() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key || key.includes('your_openrouter')) {
    console.error('❌ Set OPENROUTER_API_KEY in .env or .env.local first');
    process.exit(1);
  }
  return key;
}

function writeOpenRouterEnv(key) {
  mkdirSync(globalCursorDir, { recursive: true });
  writeFileSync(globalEnvPath, `OPENROUTER_API_KEY=${key}\n`, 'utf8');
  try {
    chmodSync(globalEnvPath, 0o600);
  } catch {
    // best-effort on Windows
  }
}

function exportKeyForCursor(key) {
  if (platform() !== 'darwin') {
    console.log('⚠️  Set OPENROUTER_API_KEY in your OS environment, then restart Cursor');
    return;
  }
  try {
    execSync(`launchctl setenv OPENROUTER_API_KEY ${JSON.stringify(key)}`, { stdio: 'ignore' });
    console.log(
      '✅ Exported OPENROUTER_API_KEY via launchctl (GUI Cursor can read it until reboot)'
    );
  } catch {
    console.log('⚠️  launchctl setenv failed — open Cursor from a terminal: open -a Cursor');
  }
}

function normalizeTypes(servers) {
  const out = { ...servers };
  for (const [name, cfg] of Object.entries(out)) {
    if (cfg.command && !cfg.type) out[name] = { ...cfg, type: 'stdio' };
    if (cfg.url && !cfg.type) out[name] = { ...cfg, type: 'http' };
  }
  return out;
}

const apiKey = getApiKey();
writeOpenRouterEnv(apiKey);
exportKeyForCursor(apiKey);

const existing = scrubSecretsFromMcp(readMcp(globalMcpPath).mcpServers);
const servers = { ...existing };

servers.openrouter = {
  type: 'http',
  url: 'https://mcp.openrouter.ai/mcp',
  headers: {
    Authorization: 'Bearer ${env:OPENROUTER_API_KEY}',
  },
};

if (withChat) {
  servers['openrouter-chat'] = {
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@stabgan/openrouter-mcp-multimodal'],
    envFile: globalEnvPath,
  };
}

writeMcp(globalMcpPath, { mcpServers: normalizeTypes(servers) });
console.log(`✅ Updated ${globalMcpPath} (no secrets in file)`);

if (existsSync(projectMcpPath)) {
  try {
    unlinkSync(projectMcpPath);
    console.log(`✅ Removed duplicate ${projectMcpPath}`);
  } catch {
    // ignore if project mcp.json is locked or missing
  }
}

console.log('\nReload Cursor (Cmd+Shift+P → Developer: Reload Window)');
console.log('Key file:', globalEnvPath, '(chmod 600, never commit)');
console.log('After macOS reboot, re-run: npm run setup:openrouter-mcp -- --with-chat');

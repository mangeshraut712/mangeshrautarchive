/**
 * Contract: production realtime WS must reject upgrades without a short-lived mint token.
 * Legacy Vercel routed /api/realtime/ws → api/realtime-ws.js; Cloudflare Worker is primary now.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { consumeMintToken, signMint } from '../../api/realtime-ws.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const realtimeWsSource = readFileSync(join(root, 'api/realtime-ws.js'), 'utf8');
const vercelPath = join(root, 'vercel.json');
const hasVercelJson = existsSync(vercelPath);
const vercelConfig = hasVercelJson ? JSON.parse(readFileSync(vercelPath, 'utf8')) : null;

describe('realtime-ws mint token contract', () => {
  it.skipIf(!hasVercelJson)('vercel rewrites /api/realtime/ws to the Node realtime-ws handler', () => {
    const rewrite = (vercelConfig.rewrites || []).find(
      entry => entry.source === '/api/realtime/ws'
    );
    expect(rewrite?.destination).toMatch(/realtime-ws/);
  });

  it('Node upgrade handler requires a mint token query param before gateway mint', () => {
    expect(realtimeWsSource).toMatch(/searchParams\.get\(['"]token['"]\)/);
    expect(realtimeWsSource).toMatch(/consumeMintToken/);
    expect(realtimeWsSource).toMatch(/401 Unauthorized|1008/);
  });

  it('rejects missing and invalid mint tokens', () => {
    expect(consumeMintToken(null)).toBe(false);
    expect(consumeMintToken('')).toBe(false);
    expect(consumeMintToken('1.bad.sig')).toBe(false);
  });

  it('accepts a valid HMAC mint once', () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const nonce = `n${Date.now()}`;
    const token = `${exp}.${nonce}.${signMint(exp, nonce)}`;
    expect(consumeMintToken(token)).toBe(true);
    expect(consumeMintToken(token)).toBe(false);
  });
});

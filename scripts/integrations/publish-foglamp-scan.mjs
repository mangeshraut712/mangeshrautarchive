#!/usr/bin/env node
/**
 * Publish or refresh the public Foglamp architecture scan.
 *
 * - Creates a new public unlisted URL when no lock / edit token exists.
 * - Updates the SAME URL when `.foglamp/scan.lock.json` (or FOGLAMP_SCAN_EDIT_TOKEN) is present.
 * - Never prints the full edit token.
 *
 * Usage:
 *   npm run foglamp:publish
 *   FOGLAMP_SCAN_EDIT_TOKEN=… npm run foglamp:publish   # CI
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SCAN_PATH = join(ROOT, '.foglamp/scan.json');
const LOCK_PATH = join(ROOT, '.foglamp/scan.lock.json');
const API_URL = process.env.FOGLAMP_API_URL || 'https://api.foglamp.dev/scan';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadEditToken() {
  if (process.env.FOGLAMP_SCAN_EDIT_TOKEN?.trim()) {
    return process.env.FOGLAMP_SCAN_EDIT_TOKEN.trim();
  }
  if (existsSync(LOCK_PATH)) {
    const lock = readJson(LOCK_PATH);
    if (typeof lock.editToken === 'string' && lock.editToken.trim()) {
      return lock.editToken.trim();
    }
  }
  return '';
}

function maskToken(token) {
  if (!token || token.length < 8) return '(none)';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

async function main() {
  if (!existsSync(SCAN_PATH)) {
    console.error(`Missing ${SCAN_PATH}. Generate a scan first (Foglamp codebase-scan skill).`);
    process.exit(1);
  }

  const data = readJson(SCAN_PATH);
  if (data?.version !== 1 || !data?.project || !data?.graph) {
    console.error('Invalid scan.json — expected version 1 with project + graph.');
    process.exit(1);
  }

  // Bump project.date on each publish so the map shows freshness.
  data.project = {
    ...data.project,
    date: new Date().toISOString().slice(0, 10),
  };

  const editToken = loadEditToken();
  const payload = editToken ? { data, editToken } : { data };

  console.log(
    editToken
      ? `Updating Foglamp scan (editToken ${maskToken(editToken)})…`
      : 'Creating new Foglamp scan (no lock/token yet)…'
  );

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    console.error(`Foglamp API returned non-JSON (${res.status}): ${text.slice(0, 400)}`);
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`Foglamp publish failed (${res.status}):`, body);
    process.exit(1);
  }

  const lock = {
    slug: body.slug || '',
    url: body.url || '',
    editToken: body.editToken || editToken,
    expiresAt: body.expiresAt || '',
    updatedAt: new Date().toISOString(),
    updated: Boolean(body.updated),
  };

  if (!lock.url || !lock.editToken) {
    console.error('Unexpected Foglamp response — missing url or editToken:', body);
    process.exit(1);
  }

  mkdirSync(dirname(LOCK_PATH), { recursive: true });
  writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');

  // Keep committed scan.json date in sync when we bump it locally.
  writeFileSync(SCAN_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  console.log('');
  console.log(`Public map:  ${lock.url}`);
  console.log(`Slug:        ${lock.slug}`);
  console.log(`Expires:     ${lock.expiresAt || '(not provided)'}`);
  console.log(`Updated:     ${lock.updated}`);
  console.log(`Lock saved:  .foglamp/scan.lock.json (gitignored — keep offline / in CI secret)`);
  console.log('');
  console.log(
    'Tip: set GitHub secret FOGLAMP_SCAN_EDIT_TOKEN to the editToken for monthly keep-alive.'
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

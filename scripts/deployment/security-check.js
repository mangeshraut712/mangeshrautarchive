#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  [
    'provider key',
    /(?:sk-or-v1-|sk-ant-|sk_live_|rk_live_|sk_test_|xai-|pplx-|hf_)[A-Za-z0-9_-]{20,}/,
  ],
  ['GitHub token', /(?:ghp_|gho_|github_pat_)[A-Za-z0-9_]{20,}/],
  ['AWS access key', /AKIA[A-Z0-9]{16}/],
  ['Google API key', /AIzaSy[A-Za-z0-9_-]{33,}/],
  ['JWT credential', /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{15,}/],
  ['Telegram credential', /[0-9]{8,12}:AA[A-Za-z0-9_-]{30,38}/],
  [
    'webhook credential',
    /https:\/\/discord(?:app)?\.com\/api\/webhooks\/[0-9]{15,22}\/[A-Za-z0-9_-]{50,}/,
  ],
];
const staged = process.argv.includes('--staged');
const names = execFileSync(
  'git',
  ['ls-files', '-z', ...(staged ? [] : ['--cached', '--others', '--exclude-standard'])],
  { cwd: root, encoding: 'utf8' }
)
  .split('\0')
  .filter(Boolean);
let failures = 0;
for (const name of names) {
  if (/(^|\/)\.env(?:$|\.)/.test(name) && !name.endsWith('.env.example')) {
    console.error(`${name}:1: forbidden tracked environment file`);
    failures++;
  }
  let data;
  try {
    if (staged)
      data = execFileSync('git', ['show', `:${name}`], {
        cwd: root,
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 20 * 1024 * 1024,
      });
    else {
      if (!lstatSync(new URL(name, new URL('../../', import.meta.url))).isFile()) continue;
      data = readFileSync(new URL(name, new URL('../../', import.meta.url)));
    }
  } catch {
    console.error(`${name}: unable to inspect tracked file`);
    failures++;
    continue;
  }
  if (data.includes(0)) continue;
  data
    .toString('utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      for (const [kind, pattern] of patterns) {
        if (pattern.test(line)) {
          console.error(`${name}:${index + 1}: possible ${kind}; value withheld`);
          failures++;
        }
      }
    });
}
if (failures) {
  console.error(
    'WARNING: tracked secrets can grant access to accounts and data. Remove and rotate exposed credentials.'
  );
  process.exitCode = 1;
} else
  console.log('Tracked-file secret scan passed; credential validity and history were not checked.');

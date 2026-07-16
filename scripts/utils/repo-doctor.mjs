#!/usr/bin/env node
/**
 * Repo doctor — stack + root hygiene for this vanilla ESM + FastAPI portfolio.
 * Usage: node scripts/utils/repo-doctor.mjs [--strict]
 * Exit 0 when healthy; 1 on failures. Warnings never fail unless --strict.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const strict = process.argv.includes('--strict');

const FAIL = [];
const WARN = [];
const OK = [];

function pass(msg) {
  OK.push(msg);
  console.log(`  ✅ ${msg}`);
}

function fail(msg) {
  FAIL.push(msg);
  console.error(`  ❌ ${msg}`);
}

function warn(msg) {
  WARN.push(msg);
  console.warn(`  ⚠️  ${msg}`);
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

function readText(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function mustExist(rel, label = rel) {
  if (existsSync(join(root, rel))) {
    pass(`${label} present`);
    return true;
  }
  fail(`Missing required path: ${label}`);
  return false;
}

// ─── 1. Node runtime ───────────────────────────────────────────────────────
console.log('\n🩺 Repo doctor — mangeshrautarchive\n');
console.log('▸ Node runtime');
const nodeCheck = spawnSync(
  process.execPath,
  [join(root, 'scripts/utils/check-node.mjs'), '--verbose'],
  {
    encoding: 'utf8',
  }
);
if (nodeCheck.status === 0) {
  pass((nodeCheck.stdout || '').trim() || `Node ${process.versions.node} OK`);
} else {
  fail((nodeCheck.stderr || nodeCheck.stdout || 'Node version check failed').trim());
}

// ─── 2. package.json stack guard ───────────────────────────────────────────
console.log('\n▸ Stack guard (no UI framework runtimes)');
const pkg = readJson('package.json');
const allDeps = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
};
// Framework runtimes / React-scan surface. Exact names + scoped prefixes
// (@angular/*, @remix-run/*) so packages like @angular/common cannot slip through.
function isForbiddenDep(name) {
  if (
    /^(next|react|react-dom|vue|svelte|react-doctor|reactbench|create-react-app|gatsby|nuxt)(@|$)/i.test(
      name
    )
  ) {
    return true;
  }
  if (name.startsWith('@angular/') || name.startsWith('@remix-run/')) {
    return true;
  }
  return false;
}
const bad = Object.keys(allDeps).filter(isForbiddenDep);
if (bad.length) {
  fail(`Forbidden UI framework / React-scan deps: ${bad.join(', ')}`);
} else {
  pass('No React/Next/Vue/Svelte/react-doctor runtime deps');
}

if (pkg.type !== 'module') {
  fail('package.json "type" must be "module"');
} else {
  pass('package.json type=module');
}

const engines = pkg.engines?.node || '';
if (!engines.includes('22')) {
  warn(`engines.node is "${engines}" — expected ≥22`);
} else {
  pass(`engines.node = ${engines}`);
}

if (pkg.main && !pkg.main.includes('src/js/entry')) {
  warn(`package.json main="${pkg.main}" — expected src/js/entry.js`);
} else {
  pass(`package.json main → ${pkg.main}`);
}

// ─── 3. Pin files ──────────────────────────────────────────────────────────
console.log('\n▸ Version pins');
for (const f of ['.nvmrc', '.node-version']) {
  if (!mustExist(f)) continue;
  const v = readText(f).trim();
  if (v !== '22' && !v.startsWith('22.')) {
    fail(`${f} pins "${v}" — expected 22`);
  } else {
    pass(`${f} → ${v}`);
  }
}
if (mustExist('.python-version')) {
  const py = readText('.python-version').trim();
  if (!py.startsWith('3.12')) {
    warn(`.python-version is "${py}" — AGENTS.md targets 3.12+`);
  } else {
    pass(`.python-version → ${py}`);
  }
}

// ─── 4. Required root + layout ─────────────────────────────────────────────
console.log('\n▸ Required root files & layout');
const requiredRoot = [
  'package.json',
  'package-lock.json',
  'vercel.json',
  'middleware.js',
  'index.js',
  'playwright.config.js',
  'vitest.config.js',
  'eslint.config.js',
  '.prettierrc',
  '.stylelintrc.json',
  'pyproject.toml',
  'requirements.txt',
  'requirements-dev.txt',
  'CNAME',
  'AGENTS.md',
  'README.md',
  'LICENSE',
  'SECURITY.md',
];
for (const f of requiredRoot) {
  mustExist(f);
}

const requiredDirs = [
  'src',
  'src/js',
  'src/assets/css',
  'api',
  'api/routes',
  'api/integrations',
  'scripts/build',
  'scripts/deployment',
  'scripts/utils',
  'tests/unit',
  'tests/api',
  'tests/e2e',
  'config',
  'docs',
];
for (const d of requiredDirs) {
  mustExist(d, `${d}/`);
}

mustExist('api/index.py');
mustExist('src/index.html');
mustExist('src/js/entry.js');
mustExist('scripts/build/build.js');
mustExist('config/vulture.toml');

// Root should not grow random app source
const rootEntries = readdirSync(root).filter(name => !name.startsWith('.'));
const allowedRootDirs = new Set([
  'api',
  'config',
  'docs',
  'scripts',
  'src',
  'tests',
  'node_modules',
  'dist',
  'venv',
]);
const allowedRootFiles = new Set([
  'AGENTS.md',
  'CNAME',
  'LICENSE',
  'README.md',
  'SECURITY.md',
  'eslint.config.js',
  'globals.d.ts',
  'index.js',
  'jsconfig.json',
  'middleware.js',
  'package-lock.json',
  'package.json',
  'playwright.config.js',
  'pyproject.toml',
  'pyrightconfig.json',
  'requirements-dev.txt',
  'requirements.txt',
  'ruff.toml',
  'skills-lock.json',
  'uv.lock',
  'vercel.json',
  'vitest.config.js',
]);
const unexpected = rootEntries.filter(name => {
  const abs = join(root, name);
  if (statSync(abs).isDirectory()) {
    return !allowedRootDirs.has(name);
  }
  return !allowedRootFiles.has(name);
});
if (unexpected.length) {
  warn(
    `Unexpected root entries (move under src/api/scripts/docs/config): ${unexpected.join(', ')}`
  );
} else {
  pass('Root layout matches expected allow-list');
}

// ─── 5. vercel.json sanity ─────────────────────────────────────────────────
console.log('\n▸ Vercel / dual-host');
const vercel = readJson('vercel.json');
if (vercel.framework !== null && vercel.framework !== undefined) {
  fail(`vercel.json framework must be null (got ${JSON.stringify(vercel.framework)})`);
} else {
  pass('vercel.json framework: null (static + FastAPI)');
}
if (vercel.outputDirectory !== 'dist') {
  fail(`vercel.json outputDirectory should be dist (got ${vercel.outputDirectory})`);
} else {
  pass('vercel.json outputDirectory: dist');
}
const cname = readText('CNAME').trim();
if (cname !== 'mangeshraut.pro') {
  warn(`CNAME is "${cname}" — expected mangeshraut.pro`);
} else {
  pass(`CNAME → ${cname}`);
}

// ─── 6. Python requirements hygiene ────────────────────────────────────────
console.log('\n▸ Python requirements');
const reqDev = readText('requirements-dev.txt');
// Starlette TestClient deprecates httpx in favor of httpx2 (dev-only).
if (/^httpx2==/m.test(reqDev)) {
  pass('requirements-dev.txt pins httpx2 (Starlette TestClient)');
} else {
  warn('requirements-dev.txt missing httpx2 (Starlette TestClient may warn)');
}
if (!/pytest==/.test(reqDev) || !/flake8==/.test(reqDev)) {
  fail('requirements-dev.txt missing pytest/flake8 pins');
} else {
  pass('requirements-dev.txt has pytest + flake8');
}
const reqRuntime = readText('requirements.txt');
if (!/fastapi==/.test(reqRuntime) || !/httpx==/.test(reqRuntime)) {
  fail('requirements.txt missing core FastAPI/httpx pins');
} else {
  pass('requirements.txt has FastAPI + httpx');
}

// ─── 7. Guard: no React doctor workflow / configs left behind ───────────────
console.log('\n▸ Residual React-doctor surface');
if (existsSync(join(root, '.github/workflows/react-doctor.yml'))) {
  fail('.github/workflows/react-doctor.yml still present (vanilla stack — remove)');
} else {
  pass('No react-doctor CI workflow');
}
if (
  existsSync(join(root, 'doctor.config.js')) ||
  existsSync(join(root, 'config/doctor.config.js'))
) {
  warn('doctor.config.js still present (only needed for react-doctor; safe to delete)');
} else {
  pass('No react-doctor config files');
}

// ─── 8. Tailwind-in-HTML smoke (forbidden) ─────────────────────────────────
console.log('\n▸ Markup hygiene');
const htmlFiles = readdirSync(join(root, 'src')).filter(f => f.endsWith('.html'));
// Distinctive Tailwind utilities (not plain .hidden / BEM *grid* names).
const tailwindUtility =
  /(?:^|[\s"'=])(inline-flex|w-full|h-screen|bg-blue-\d+|text-white|p-\d+|m[trblxy]?-\d+|px-\d+|py-\d+|gap-\d+|space-x-\d+|space-y-\d+|rounded-lg|shadow-lg)(?=[\s"'])/;
let htmlHits = 0;
for (const f of htmlFiles) {
  const body = readText(join('src', f));
  const classAttrs = body.match(/class=["'][^"']*["']/g) || [];
  if (classAttrs.some(attr => tailwindUtility.test(attr))) {
    htmlHits += 1;
    warn(`Possible Tailwind utility classes in src/${f}`);
  }
}
if (htmlHits === 0) {
  pass(`No obvious Tailwind utility classes in ${htmlFiles.length} HTML shells`);
}

// ─── Summary ───────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────');
console.log(`Passed: ${OK.length}  Warnings: ${WARN.length}  Failures: ${FAIL.length}`);
if (FAIL.length) {
  console.error('\nRepo doctor FAILED:\n' + FAIL.map(m => `  • ${m}`).join('\n'));
  process.exit(1);
}
if (strict && WARN.length) {
  console.error(
    '\nRepo doctor FAILED (--strict warnings):\n' + WARN.map(m => `  • ${m}`).join('\n')
  );
  process.exit(1);
}
console.log('\n✅ Repo doctor: healthy\n');
process.exit(0);

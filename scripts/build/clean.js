#!/usr/bin/env node

import { rm, readdir, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '../..');

const generatedDirs = [
  'dist',
  'artifacts',
  'test-results',
  'playwright-report',
  '.playwright-mcp',
  '.playwright-cli',
  '.playwright',
  '.pytest_cache',
  '.gitnexus',
  'scratch',
  '.ruff_cache',
  '.codex',
  '.windsurf',
  '.vercel',
  'coverage',
  '.turbo',
  '.cache',
  '.eslintcache',
  '.stylelintcache',
  // Local AI/agent scaffolding (gitignored) — not shipped to GitHub Pages / Vercel
  '.agents',
  '.claude',
  '.codacy',
  '.factory',
  '.trae',
  '.superpowers',
  'skills',
  '.vscode',
];
const generatedFiles = ['backend_test.log', 'dev_server.log', '.clinerules', '.windsurfrules'];
const generatedFileNames = new Set(['.DS_Store']);

/** Cursor embeds search indexes under .git/cursor — safe local-only cache. */
const generatedGitLocalDirs = ['.git/cursor'];

/**
 * Optional cross-platform sharp / wasm trees that npm may leave installed.
 * Host native bindings (e.g. @img/sharp-darwin-arm64) are kept.
 */
const optionalInstallBloat = [
  'node_modules/@img/sharp-wasm32',
  'node_modules/@img/sharp-webcontainers-wasm32',
  'node_modules/@img/sharp-freebsd-wasm32',
  'node_modules/@napi-rs/wasm-runtime',
  'node_modules/@emnapi',
  'node_modules/@tybys/wasm-util',
  'node_modules/.cache',
  'node_modules/.vite',
  'node_modules/.vite-temp',
];

/** Never walk into package installs or VCS when scanning project sources. */
const SKIP_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'venv',
  '.venv',
  'dist',
  'coverage',
  'artifacts',
  'test-results',
]);

async function pathExists(absolutePath) {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function removeDirectory(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!(await pathExists(absolutePath))) {
    return;
  }
  await rm(absolutePath, { recursive: true, force: true });
  console.log(`🧹 Removed ${relativePath}`);
}

async function removePycacheDirectory(pycache) {
  await rm(pycache, { recursive: true, force: true });
  console.log(`🧹 Removed ${pycache.replace(`${root}/`, '')}`);
}

async function removeGeneratedWorkspaceFile(file) {
  await rm(file, { force: true });
  console.log(`🧹 Removed ${file.replace(`${root}/`, '')}`);
}

async function findPycacheDirs(directory, matches = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async entry => {
      if (!entry.isDirectory()) {
        return;
      }

      if (SKIP_DIR_NAMES.has(entry.name)) {
        return;
      }

      const absolutePath = join(directory, entry.name);
      if (entry.name === '__pycache__') {
        matches.push(absolutePath);
        return;
      }

      await findPycacheDirs(absolutePath, matches);
    })
  );

  return matches;
}

async function findGeneratedFiles(directory, matches = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async entry => {
      if (SKIP_DIR_NAMES.has(entry.name)) {
        return;
      }

      const absolutePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await findGeneratedFiles(absolutePath, matches);
        return;
      }

      if (generatedFileNames.has(entry.name)) {
        matches.push(absolutePath);
      }
    })
  );

  return matches;
}

async function findVenvPycacheDirs() {
  const matches = [];
  // Prefer .venv; skip `venv` when it is only a symlink to the same tree.
  const primary = join(root, '.venv');
  const fallback = join(root, 'venv');
  const venvRoot = (await pathExists(primary)) ? primary : fallback;
  if (await pathExists(venvRoot)) {
    await findPycacheDirsAllowVenv(venvRoot, matches);
  }
  return matches;
}

/** Walk a venv tree only for __pycache__ (does not skip .venv itself). */
async function findPycacheDirsAllowVenv(directory, matches = []) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return matches;
  }

  await Promise.all(
    entries.map(async entry => {
      if (!entry.isDirectory()) {
        return;
      }
      if (entry.name === 'node_modules' || entry.name === '.git') {
        return;
      }
      const absolutePath = join(directory, entry.name);
      if (entry.name === '__pycache__') {
        matches.push(absolutePath);
        return;
      }
      await findPycacheDirsAllowVenv(absolutePath, matches);
    })
  );

  return matches;
}

async function pruneExtraneousNpmPackages() {
  try {
    const { stdout } = await execFileAsync('npm', ['prune', '--no-audit', '--no-fund'], {
      cwd: root,
      maxBuffer: 2 * 1024 * 1024,
    });
    const trimmed = String(stdout || '').trim();
    if (trimmed) {
      console.log(`🧹 npm prune: ${trimmed.split('\n').pop()}`);
    } else {
      console.log('🧹 npm prune: done');
    }
  } catch (error) {
    console.warn(`⚠️  npm prune skipped: ${error.message}`);
  }
}

async function clean() {
  const [pycacheDirs, venvPycacheDirs, generatedWorkspaceFiles] = await Promise.all([
    findPycacheDirs(root),
    findVenvPycacheDirs(),
    findGeneratedFiles(root),
  ]);

  await Promise.all([
    ...generatedDirs.map(directory => removeDirectory(directory)),
    ...generatedGitLocalDirs.map(directory => removeDirectory(directory)),
    ...generatedFiles.map(file => removeDirectory(file)),
    ...pycacheDirs.map(removePycacheDirectory),
    ...venvPycacheDirs.map(removePycacheDirectory),
    ...generatedWorkspaceFiles.map(removeGeneratedWorkspaceFile),
  ]);

  // Drop leftover React-doctor / unused trees first, then strip optional wasm bloat.
  await pruneExtraneousNpmPackages();
  await Promise.all(optionalInstallBloat.map(directory => removeDirectory(directory)));

  console.log('✅ Workspace cleanup complete.');
}

clean().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exitCode = 1;
});

#!/usr/bin/env node

import { rm, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const generatedDirs = [
  'dist',
  'artifacts',
  'test-results',
  'playwright-report',
  '.playwright-mcp',
  'scratch',
  '.ruff_cache',
];
const generatedFiles = ['backend_test.log', 'dev_server.log'];
const generatedFileNames = new Set(['.DS_Store']);

async function removeDirectory(relativePath) {
  const absolutePath = join(root, relativePath);
  await rm(absolutePath, { recursive: true, force: true });
  console.log(`🧹 Removed ${relativePath}`);
}

async function findPycacheDirs(directory, matches = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'venv') {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    if (entry.name === '__pycache__') {
      matches.push(absolutePath);
      continue;
    }

    await findPycacheDirs(absolutePath, matches);
  }

  return matches;
}

async function findGeneratedFiles(directory, matches = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'venv') {
      continue;
    }

    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await findGeneratedFiles(absolutePath, matches);
      continue;
    }

    if (generatedFileNames.has(entry.name)) {
      matches.push(absolutePath);
    }
  }

  return matches;
}

async function clean() {
  for (const directory of generatedDirs) {
    await removeDirectory(directory);
  }

  for (const file of generatedFiles) {
    await removeDirectory(file);
  }

  const pycacheDirs = await findPycacheDirs(root);
  for (const pycache of pycacheDirs) {
    await rm(pycache, { recursive: true, force: true });
    console.log(`🧹 Removed ${pycache.replace(`${root}/`, '')}`);
  }

  const generatedWorkspaceFiles = await findGeneratedFiles(root);
  for (const file of generatedWorkspaceFiles) {
    await rm(file, { force: true });
    console.log(`🧹 Removed ${file.replace(`${root}/`, '')}`);
  }

  console.log('✅ Workspace cleanup complete.');
}

clean().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exitCode = 1;
});

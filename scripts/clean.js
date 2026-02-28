#!/usr/bin/env node

import { rm, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const generatedDirs = ['dist', 'artifacts', 'test-results', 'playwright-report'];

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

    if (entry.name === 'node_modules' || entry.name === '.git') {
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

async function clean() {
  for (const directory of generatedDirs) {
    await removeDirectory(directory);
  }

  const pycacheDirs = await findPycacheDirs(root);
  for (const pycache of pycacheDirs) {
    await rm(pycache, { recursive: true, force: true });
    console.log(`🧹 Removed ${pycache.replace(`${root}/`, '')}`);
  }

  console.log('✅ Workspace cleanup complete.');
}

clean().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exitCode = 1;
});

#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
const localPython = resolve(projectRoot, '.venv/bin/python');

const pythonCandidates = [
  process.env.PYTHON,
  existsSync(localPython) ? localPython : null,
  'python3',
  'python',
].filter(Boolean);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    return false;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return true;
}

function canImport(python, moduleName) {
  const result = spawnSync(python, ['-c', `import ${moduleName}`], {
    cwd: projectRoot,
    stdio: 'ignore',
    env: process.env,
  });

  return !result.error && result.status === 0;
}

function firstPythonWithModules() {
  return pythonCandidates.find(python => canImport(python, 'ruff') && canImport(python, 'vulture'));
}

const python = firstPythonWithModules();

if (python) {
  run(python, ['-m', 'ruff', 'check', 'api']);
  run(python, ['-m', 'vulture', '--config', 'config/vulture.toml']);
  process.exit(0);
}

if (run('uvx', ['--from', 'ruff==0.14.8', 'ruff', 'check', 'api'])) {
  run('uvx', ['--from', 'vulture==2.14', 'vulture', '--config', 'config/vulture.toml']);
  process.exit(0);
}

console.error(
  'Python dead-code tools are unavailable. Install them with `python3 -m pip install -r requirements-dev.txt` or install uvx.'
);
process.exit(1);

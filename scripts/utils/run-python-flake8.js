#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
const localPython = resolve(projectRoot, '.venv/bin/python');

const flake8Args = ['api/', '--max-line-length=120', '--ignore=E501,W503,W291,W293'];

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

function firstPythonWithFlake8() {
  return pythonCandidates.find(python => canImport(python, 'flake8'));
}

const python = firstPythonWithFlake8();

if (python) {
  run(python, ['-m', 'flake8', ...flake8Args]);
  process.exit(0);
}

if (run('uv', ['run', '--with', 'flake8==7.3.0', 'python', '-m', 'flake8', ...flake8Args])) {
  process.exit(0);
}

console.error(
  'flake8 is unavailable. Install with `uv pip install -r requirements-dev.txt` or use uv.'
);
process.exit(1);

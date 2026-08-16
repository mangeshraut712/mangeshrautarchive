#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

const venvPython = resolve(projectRoot, 'venv/bin/python');
const dotVenvPython = resolve(projectRoot, '.venv/bin/python');

const pythonCandidates = [
  process.env.PYTHON,
  existsSync(venvPython) ? venvPython : null,
  existsSync(dotVenvPython) ? dotVenvPython : null,
].filter(Boolean);

const env = {
  ...process.env,
  PYTHONPATH: process.env.PYTHONPATH ? `.:${process.env.PYTHONPATH}` : '.',
};

const args = process.argv.slice(2);
const flake8Args = args.length > 0 ? args : ['api', 'tests'];

for (const python of pythonCandidates) {
  const check = spawnSync(python, ['-c', 'import flake8'], {
    cwd: projectRoot,
    stdio: 'ignore',
    env,
  });
  if (!check.error && check.status === 0) {
    const result = spawnSync(python, ['-m', 'flake8', ...flake8Args], {
      cwd: projectRoot,
      stdio: 'inherit',
      env,
    });
    process.exit(result.status ?? 0);
  }
}

// Fallback to uv
const uvCheck = spawnSync('uv', ['run', 'flake8', '--version'], {
  cwd: projectRoot,
  stdio: 'ignore',
  env,
});
if (!uvCheck.error && uvCheck.status === 0) {
  const result = spawnSync('uv', ['run', 'flake8', ...flake8Args], {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
  });
  process.exit(result.status ?? 0);
}

// Fallback to bare python3
const py3Result = spawnSync('python3', ['-m', 'flake8', ...flake8Args], {
  cwd: projectRoot,
  stdio: 'inherit',
  env,
});
process.exit(py3Result.status ?? 0);

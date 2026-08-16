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
const pytestArgs = args.length > 0 ? args : ['-q', 'tests/api'];

for (const python of pythonCandidates) {
  const check = spawnSync(python, ['-c', 'import pytest'], {
    cwd: projectRoot,
    stdio: 'ignore',
    env,
  });
  if (!check.error && check.status === 0) {
    const result = spawnSync(python, ['-m', 'pytest', ...pytestArgs], {
      cwd: projectRoot,
      stdio: 'inherit',
      env,
    });
    process.exit(result.status ?? 0);
  }
}

// Fallback to uv
const uvCheck = spawnSync('uv', ['run', 'pytest', '--version'], {
  cwd: projectRoot,
  stdio: 'ignore',
  env,
});
if (!uvCheck.error && uvCheck.status === 0) {
  const result = spawnSync('uv', ['run', 'pytest', ...pytestArgs], {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
  });
  process.exit(result.status ?? 0);
}

// Fallback to bare python3
const py3Result = spawnSync('python3', ['-m', 'pytest', ...pytestArgs], {
  cwd: projectRoot,
  stdio: 'inherit',
  env,
});
process.exit(py3Result.status ?? 1);

#!/usr/bin/env node

import { spawn } from 'node:child_process';

const children = new Set();
let shuttingDown = false;

function spawnScript(name) {
  const child = spawn('npm', ['run', name], {
    detached: true,
    env: process.env,
    stdio: 'inherit',
  });

  children.add(child);

  child.on('exit', (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      if (children.size === 0) {
        process.exit(0);
      }
      return;
    }

    shuttingDown = true;
    stopChildren();

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', error => {
    console.error(`Failed to start ${name}:`, error.message);
    if (!shuttingDown) {
      shuttingDown = true;
      stopChildren();
      process.exit(1);
    }
  });
}

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        child.kill('SIGTERM');
      }
    }
  }
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopChildren();

  if (children.size === 0) {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

spawnScript('dev:backend');
spawnScript('dev:frontend');

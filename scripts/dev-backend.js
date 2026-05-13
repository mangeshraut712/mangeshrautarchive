import net from 'node:net';
import { spawn } from 'node:child_process';

const host = process.env.API_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.API_PORT || '8001', 10);
const healthUrl = `http://${host}:${port}/api/health`;

function keepAlive() {
  const timer = setInterval(() => {}, 1 << 30);

  const shutdown = () => {
    clearInterval(timer);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function isPortInUse() {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => resolve(false));
    socket.setTimeout(700, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function isAssistMeBackendRunning() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return false;
    const data = await response.json();
    return data?.service === 'assistme-api';
  } catch {
    return false;
  }
}

function runBackend() {
  const child = spawn(
    './venv/bin/python',
    ['-m', 'uvicorn', 'api.index:app', '--reload', '--port', String(port)],
    {
      stdio: 'inherit',
      env: process.env,
    }
  );

  const forwardSignal = signal => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  child.on('exit', code => {
    process.exit(code ?? 0);
  });
}

async function main() {
  if (await isPortInUse()) {
    if (await isAssistMeBackendRunning()) {
      console.log(`ℹ️  Backend already running at ${healthUrl}. Reusing existing instance.`);
      keepAlive();
      return;
    }

    console.error(`❌ Port ${port} is already in use by another process.`);
    console.error(
      `   Stop the process using ${host}:${port} or change API_PORT before running pnpm run dev.`
    );
    process.exit(1);
  }

  runBackend();
}

main().catch(error => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});

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
    return data?.service === 'assistme-api' || data?.status === 'healthy';
  } catch {
    return false;
  }
}

async function runBackend() {
  const shouldReload = !['1', 'true'].includes(String(process.env.CI || '').toLowerCase());
  const fs = await import('fs');
  const useVenv = fs.existsSync('./venv/bin/python');

  const uvicornArgs = [
    'api.index:app',
    '--host',
    host,
    '--port',
    String(port),
  ];
  if (shouldReload) {
    uvicornArgs.push('--reload');
  }

  let command = 'python3';
  let args = ['-m', 'uvicorn', ...uvicornArgs];

  if (useVenv) {
    command = './venv/bin/python';
    args = ['-m', 'uvicorn', ...uvicornArgs];
  } else {
    command = 'uv';
    args = [
      'run',
      '--with',
      'cryptography',
      '--with',
      'fastapi',
      '--with',
      'uvicorn',
      '--with',
      'httpx',
      '--with',
      'python-dotenv',
      'python',
      '-m',
      'uvicorn',
      ...uvicornArgs,
    ];
  }

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  const forwardSignal = () => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  };

  process.on('SIGINT', forwardSignal);
  process.on('SIGTERM', forwardSignal);

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
      `   Stop the process using ${host}:${port} or change API_PORT before running npm run dev.`
    );
    process.exit(1);
  }

  await runBackend();
}

main().catch(error => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});

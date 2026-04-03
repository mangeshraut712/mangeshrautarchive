import net from 'net';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function checkPort(port) {
  const lsof = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
    encoding: 'utf8',
  });

  if ((lsof.stdout || '').trim()) {
    return Promise.resolve(false);
  }

  return new Promise(resolvePort => {
    const server = net.createServer();

    server.once('error', () => {
      resolvePort(false);
    });

    server.once('listening', () => {
      server.close(() => resolvePort(true));
    });

    server.listen(port);
  });
}

async function findAvailablePort(preferredPort, maxAttempts = 20) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = preferredPort + offset;
    if (await checkPort(port)) {
      return port;
    }
  }

  throw new Error(`Unable to find an open port near ${preferredPort}`);
}

function spawnProcess(name, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });

  child.on('error', error => {
    console.error(`\n❌ Failed to start ${name}: ${error.message}`);
  });

  return child;
}

async function main() {
  const preferredFrontendPort = Number.parseInt(process.env.PORT || '3000', 10);
  const preferredBackendPort = Number.parseInt(process.env.API_PORT || '8000', 10);

  const frontendPort = await findAvailablePort(preferredFrontendPort);
  const backendPort = await findAvailablePort(preferredBackendPort);

  if (frontendPort !== preferredFrontendPort || backendPort !== preferredBackendPort) {
    console.log('\n⚠️  Preferred dev ports were busy. Using the next available ports instead.');
  }

  console.log('\n🛠️  Starting dev environment');
  console.log(`   - Frontend: http://127.0.0.1:${frontendPort}`);
  console.log(`   - Backend:  http://127.0.0.1:${backendPort}`);

  const backend = spawnProcess(
    'backend',
    'bash',
    [
      '-c',
      `cd /Users/mangeshraut/Downloads/mangeshrautarchive && source venv/bin/activate && uvicorn api.index:app --port ${backendPort} --no-access-log`,
    ],
    {
      PORT: undefined,
      API_TARGET: undefined,
    }
  );

  const frontend = spawnProcess('frontend', 'node', ['scripts/local-server.js'], {
    PORT: String(frontendPort),
    API_TARGET: `http://127.0.0.1:${backendPort}`,
  });

  let shuttingDown = false;

  function shutdown(exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;

    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');

    setTimeout(() => {
      backend.kill('SIGKILL');
      frontend.kill('SIGKILL');
      process.exit(exitCode);
    }, 250);
  }

  backend.on('exit', code => {
    if (!shuttingDown && code !== 0) {
      console.error(`\n❌ Backend exited with code ${code}`);
      shutdown(code || 1);
    }
  });

  frontend.on('exit', code => {
    if (!shuttingDown && code !== 0) {
      console.error(`\n❌ Frontend exited with code ${code}`);
      shutdown(code || 1);
    }
  });

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));
}

main().catch(error => {
  console.error(`\n❌ Dev startup failed: ${error.message}`);
  process.exit(1);
});

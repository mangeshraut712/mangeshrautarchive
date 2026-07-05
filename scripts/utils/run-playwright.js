import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
const playwrightBin = resolve(projectRoot, 'node_modules/.bin/playwright');

const env = { ...process.env };
delete env.NO_COLOR;
env.NO_RELOAD = '1';

const nodeOptions = env.NODE_OPTIONS ? `${env.NODE_OPTIONS} ` : '';
if (!nodeOptions.includes('--disable-warning=DEP0205')) {
  env.NODE_OPTIONS = `${nodeOptions}--disable-warning=DEP0205`.trim();
}

const child = spawn(playwrightBin, process.argv.slice(2), {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', error => {
  console.error('Failed to start Playwright:', error.message);
  process.exit(1);
});

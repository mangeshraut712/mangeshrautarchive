import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

export function assertLocalEndpoint(name, value) {
  if (!value || value === ':memory:' || value.startsWith('sqlite:')) return;
  let host;
  try {
    host = new URL(value).hostname;
  } catch {
    throw new Error(`WARNING: ${name} is not a valid local endpoint. Aborting.`);
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
    throw new Error(
      `WARNING: ${name} is non-local; this command could modify remote data. Aborting.`
    );
  }
}

export function localEnvironment(
  source,
  root,
  { createDirectories = true, platform = process.platform } = {}
) {
  for (const name of [
    'DATABASE_URL',
    'SUPABASE_URL',
    'REDIS_URL',
    'API_TARGET',
    'PLAYWRIGHT_BASE_URL',
    'E2E_APP_URL',
  ]) {
    assertLocalEndpoint(name, source[name]);
  }
  const env = {};
  for (const name of [
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'SHELL',
    'LANG',
    'LC_ALL',
    'TERM',
    'CI',
    'NO_COLOR',
    'FORCE_COLOR',
    'PORT',
    'API_PORT',
    'STRICT_PORT',
    'NO_RELOAD',
    'PLAYWRIGHT_BASE_URL',
    'E2E_APP_URL',
    'PLAYWRIGHT_BROWSER_CHANNEL',
  ]) {
    if (source[name] !== undefined) env[name] = source[name];
  }
  const cache = resolve(root, '.cache/local-runtime');
  // Chrome's Linux singleton socket must fit sockaddr_un (108 bytes).
  const temporary = platform === 'linux' ? resolve(root, '.tmp') : resolve(cache, 'tmp');
  if (createDirectories) {
    mkdirSync(temporary, { recursive: true });
    mkdirSync(cache, { recursive: true });
    writeFileSync(resolve(cache, 'empty-global.npmrc'), '', { mode: 0o600 });
  }
  return {
    ...env,
    PORTFOLIO_LOCAL_ONLY: '1',
    NODE_OPTIONS: `--import=${pathToFileURL(resolve(root, 'scripts/safety/local-network.mjs')).href}`,
    PYTHON_DOTENV_DISABLED: '1',
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONPATH: root,
    API_TARGET: 'http://127.0.0.1:8001',
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
    XDG_CACHE_HOME: cache,
    // Browser installations are read-only inputs; changing XDG_CACHE_HOME must not hide them.
    PLAYWRIGHT_BROWSERS_PATH:
      source.PLAYWRIGHT_BROWSERS_PATH ||
      resolve(
        source.HOME || root,
        platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright'
      ),
    UV_OFFLINE: '1',
    UV_CACHE_DIR: resolve(cache, 'uv'),
    npm_config_cache: resolve(cache, 'npm'),
    npm_config_userconfig: '/dev/null',
    npm_config_globalconfig: resolve(cache, 'empty-global.npmrc'),
    npm_config_offline: 'true',
    E2E_TELEMETRY_DISABLED: '1',
  };
}

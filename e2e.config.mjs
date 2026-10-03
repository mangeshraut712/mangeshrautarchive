import { web } from '@e2e-dev/web';

const app = {
  url: process.env.E2E_APP_URL || 'http://127.0.0.1:0',
};
if (!process.env.E2E_APP_URL) {
  app.command = {
    executable: 'node',
    args: ['scripts/utils/local-server.js'],
    env: { PORT: '{port}', STRICT_PORT: '1' },
    startupTimeout: 60_000,
  };
}

export default {
  tests: ['tests/tester-army/*.e2e.js'],
  workers: 1,
  timeout: 60_000,
  targets: [
    {
      name: 'desktop',
      engine: web({ headers: { 'x-e2e-test': '1' }, viewport: { width: 1440, height: 900 } }),
      app,
    },
    {
      name: 'mobile-webkit',
      engine: web({
        browser: 'webkit',
        headers: { 'x-e2e-test': '1' },
        viewport: { width: 375, height: 812 },
      }),
      app,
    },
  ],
};

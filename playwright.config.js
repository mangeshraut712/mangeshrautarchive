import { defineConfig, devices } from '@playwright/test';

// Environment detection for testing targets
const target = process.env.TEST_TARGET || 'local';
const baseURLs = {
  local: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4000',
  vercel: 'https://mangeshraut.pro',
  github: 'https://mangeshraut712.github.io/mangeshrautarchive',
  dev: 'http://127.0.0.1:4173', // npm run dev port
};

const baseURL = process.env.PLAYWRIGHT_BASE_URL || baseURLs[target] || baseURLs.local;
const useManagedWebServer = !process.env.PLAYWRIGHT_BASE_URL && target === 'local';
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL || undefined;
const videoMode = process.env.PLAYWRIGHT_ENABLE_VIDEO === '1' ? 'retain-on-failure' : 'off';

// Visual testing config
const isVisualTesting = process.env.VISUAL_TESTING === '1';
const updateSnapshots = process.env.UPDATE_SNAPSHOTS === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
    ...(isVisualTesting
      ? {
          toHaveScreenshot: {
            maxDiffPixels: 100,
            threshold: 0.2,
          },
        }
      : {}),
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }],
    ...(process.env.CI ? [['github']] : []),
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: isVisualTesting ? 'on' : 'only-on-failure',
    video: videoMode,
    ...(browserChannel ? { channel: browserChannel } : {}),
    ...(isVisualTesting
      ? {
          viewport: { width: 1440, height: 900 },
        }
      : {}),
  },
  snapshotDir: './tests/e2e/__snapshots__',
  updateSnapshots: updateSnapshots ? 'all' : 'missing',
  webServer: useManagedWebServer
    ? {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    // Desktop Browsers
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Desktop Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1440, height: 900 },
      },
    },

    // Mobile Devices - Android
    {
      name: 'Pixel 7 Chrome',
      use: {
        ...devices['Pixel 7'],
        channel: 'chrome',
      },
    },
    {
      name: 'Pixel 7 Pro Chrome',
      use: {
        ...devices['Pixel 7 Pro'],
        channel: 'chrome',
      },
    },
    {
      name: 'Samsung Galaxy S23',
      use: {
        ...devices['Samsung Galaxy S23'],
        channel: 'chrome',
      },
    },

    // Mobile Devices - iOS (Safari)
    {
      name: 'iPhone 14 Safari',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'iPhone 14 Pro Max Safari',
      use: {
        ...devices['iPhone 14 Pro Max'],
      },
    },
    {
      name: 'iPad Pro Safari',
      use: {
        ...devices['iPad Pro 11'],
      },
    },

    // Responsive Viewports
    {
      name: 'Mobile Small',
      use: {
        viewport: { width: 375, height: 667 }, // iPhone SE
      },
    },
    {
      name: 'Tablet',
      use: {
        viewport: { width: 768, height: 1024 }, // iPad
      },
    },
    {
      name: 'Desktop Large',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  // Configure projects for CI vs local
  ...(process.env.CI && process.env.TEST_SUITE === 'quick'
    ? {
        projects: [
          {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
          },
          { name: 'Pixel 7 Chrome', use: { ...devices['Pixel 7'] } },
          { name: 'iPhone 14 Safari', use: { ...devices['iPhone 14'] } },
        ],
      }
    : {}),

  // Full suite for comprehensive testing
  ...(process.env.CI && process.env.TEST_SUITE === 'full'
    ? {
        projects: [
          {
            name: 'Desktop Chrome',
            use: {
              ...devices['Desktop Chrome'],
              channel: 'chrome',
              viewport: { width: 1440, height: 900 },
            },
          },
          {
            name: 'Desktop Safari',
            use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
          },
          {
            name: 'Desktop Firefox',
            use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
          },
          {
            name: 'Desktop Edge',
            use: {
              ...devices['Desktop Edge'],
              channel: 'msedge',
              viewport: { width: 1440, height: 900 },
            },
          },
          { name: 'Pixel 7 Chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } },
          { name: 'iPhone 14 Safari', use: { ...devices['iPhone 14'] } },
          { name: 'iPad Pro Safari', use: { ...devices['iPad Pro 11'] } },
        ],
      }
    : {}),
});

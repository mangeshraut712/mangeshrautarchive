import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/**/*.{test,spec}.{js,ts,mjs,cjs,jsx,tsx}',
      'src/**/*.{test,spec}.{js,ts,mjs,cjs,jsx,tsx}',
    ],
    exclude: ['tests/e2e/**'],
  },
});

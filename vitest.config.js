import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts,mjs,cjs,jsx,tsx}'],
    exclude: ['node_modules/**', 'tests/e2e/**'],
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // All unit tests live under tests/unit (no co-located *.test.js in src/)
    include: ['tests/unit/**/*.test.js'],
    exclude: ['dist/**', 'node_modules/**'],
    environment: 'jsdom',
  },
});

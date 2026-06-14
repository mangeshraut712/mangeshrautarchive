import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'src/assets/**',
      'src/js/vendor/**',
      'artifacts/**',
      'test-results/**',
      'playwright-report/**',
      'scratch/**',
    ],
  },
  // Browser Code (src)
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        marked: 'readonly',
        Prism: 'readonly',
        DOMPurify: 'readonly',
        chatbotUpgrade: 'readonly',
        process: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
      'no-undef': 'warn',
    },
  },
  // Scripts with Browser APIs (mjs files using Playwright)
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
      'no-undef': 'warn',
    },
  },
  // Node Code (api, scripts, root config files)
  {
    files: [
      'api/**/*.js',
      'scripts/**/*.{js,cjs}',
      'config/**/*.{js,mjs}',
      '*.{js,mjs}',
      'tests/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser, // For Playwright test files using document in page.evaluate()
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
];

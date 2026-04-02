import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    ignores: [
      '.kilo/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      'src/assets/**',
      'src/js/core/chat.js',
      'src/js/core/script.js',
      'src/js/modules/agentic-actions.js',
      'src/js/modules/chatbot.js',
      'src/js/modules/projects-showcase.js',
      'src/js/modules/search.js',
      'src/js/modules/skills-visualization.js',
      'artifacts/**',
      'test-results/**',
      'playwright-report/**',
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'warn',
    },
  },
  // Node Code (api, scripts, root config files)
  {
    files: ['api/**/*.js', 'scripts/**/*.js', '*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'warn',
      'no-empty': 'off', // Disable for minified files
    },
  },
];

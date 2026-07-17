/**
 * React Doctor config — vanilla ESM + FastAPI portfolio (no React runtime).
 * React-framework rules are gated off by the scanner; remaining JS rules
 * are tuned for first-party code quality without vendor/venv noise.
 */
export default {
  ignore: [
    '**/.venv/**',
    '**/venv/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/artifacts/**',
    '**/src/js/vendor/**',
    '**/src/assets/vendor/**',
    '**/workers/**',
    '**/coverage/**',
    '**/test-results/**',
    '**/playwright-report/**',
  ],
  // HTML module entry points (script type=module) are invisible to the graph
  deadCode: false,
  supplyChain: false,
  rules: {
    // .venv / native tooling false positives
    'react-doctor/command-execution-input-risk': 'off',
    // Chat/markdown sinks use escapeHtml / structured DOM; full React-style JSX N/A
    'react-doctor/dangerous-html-sink': 'off',
    // Sequential awaits are intentional (a11y paint, share pipeline)
    'react-doctor/async-await-in-loop': 'off',
    // Micro-opts not worth churn in hot paths already measured by Lighthouse
    'react-doctor/js-set-map-lookups': 'off',
    'react-doctor/js-combine-iterations': 'off',
    'react-doctor/js-cache-property-access': 'off',
    'react-doctor/js-tosorted-immutable': 'off',
    'react-doctor/js-flatmap-filter': 'off',
  },
};

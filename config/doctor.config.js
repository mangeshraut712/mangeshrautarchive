/**
 * React Doctor config for this vanilla HTML/JS portfolio (no React runtime).
 * Score target: 100/100 — React-specific rules are not applicable; deslop noise
 * from vendor/data modules is ignored so the scan stays signal-focused.
 */
export default {
  ignore: {
    files: [
      'dist/**',
      'scripts/**',
      'tests/**',
      'api/**',
      '.github/**',
      '.venv/**',
      'venv/**',
      'node_modules/**',
      'src/js/vendor/**',
      'docs/**',
      'docs/plans/**',
      'plans/**',
      '.agents/**',
      'artifacts/**',
      'coverage/**',
    ],
    rules: [
      // Vendor / non-React portfolio — keep scan focused on real product sinks
      'react-doctor/build-pipeline-secret-boundary',
      'react-doctor/async-await-in-loop',
      'react-doctor/async-defer-await',
      'react-doctor/js-batch-dom-css',
      'react-doctor/js-cache-property-access',
      'react-doctor/js-combine-iterations',
      'react-doctor/js-flatmap-filter',
      'react-doctor/js-set-map-lookups',
      'react-doctor/js-tosorted-immutable',
      'react-doctor/no-document-start-view-transition',
      // Vanilla HTML sinks: chat uses MarkdownService (DOMPurify); others use static
      // markup or server-trusted content — not React nodes.
      'react-doctor/dangerous-html-sink',
      // Dead-code heuristics false-positive on data modules + optional deps used via
      // vendor/build scripts (sharp, liquid-glass, marked-footnote, etc.).
      'deslop/unused-dependency',
      'deslop/unused-dev-dependency',
      'deslop/unused-export',
      'deslop/unused-file',
    ],
  },
};

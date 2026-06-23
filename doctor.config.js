/** React Doctor config for this static HTML + vanilla JS portfolio. */
export default {
  ignore: {
    files: ['dist/**', 'scripts/**', 'tests/**', 'api/**', '.github/**', 'src/js/vendor/**'],
    rules: [
      'react-doctor/build-pipeline-secret-boundary',
      'react-doctor/dangerous-html-sink',
      'react-doctor/async-await-in-loop',
      'react-doctor/async-defer-await',
      'react-doctor/js-batch-dom-css',
      'react-doctor/js-cache-property-access',
      'react-doctor/js-combine-iterations',
      'react-doctor/js-flatmap-filter',
      'react-doctor/js-set-map-lookups',
      'react-doctor/js-tosorted-immutable',
      'react-doctor/no-document-start-view-transition',
      'deslop/unused-dependency',
      'deslop/unused-dev-dependency',
      'deslop/unused-export',
      'deslop/unused-file',
    ],
  },
};

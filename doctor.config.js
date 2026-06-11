export default {
  ignore: {
    overrides: [
      {
        files: ['package.json'],
        rules: ['deslop/unused-dev-dependency'],
      },
      {
        files: ['src/js/utils/load-premium-css.js'],
        rules: ['deslop/unused-file'],
      },
    ],
  },
};

import { build } from 'esbuild';

await build({
  entryPoints: ['node_modules/decimal.js/decimal.mjs'],
  outfile: 'src/js/vendor/decimal.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  legalComments: 'inline',
});

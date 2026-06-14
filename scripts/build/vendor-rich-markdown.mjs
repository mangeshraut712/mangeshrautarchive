#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../..');
const outFile = resolve(projectRoot, 'src/js/vendor/rich-markdown.js');

await mkdir(dirname(outFile), { recursive: true });

await esbuild.build({
  entryPoints: [resolve(__dirname, 'rich-markdown-entry.js')],
  outfile: outFile,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  legalComments: 'none',
  logLevel: 'info',
});

console.log(`✅ Rich markdown vendor bundle written to ${outFile}`);

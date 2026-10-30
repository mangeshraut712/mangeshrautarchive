#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../..');
const outFile = resolve(projectRoot, 'src/js/vendor/rich-markdown.js');
const katexDistDir = resolve(projectRoot, 'node_modules/katex/dist');
const katexCssFile = resolve(katexDistDir, 'katex.min.css');
const katexFontsDir = resolve(katexDistDir, 'fonts');
const publicKatexCssFile = resolve(projectRoot, 'src/assets/css/katex.min.css');
const publicKatexFontsDir = resolve(projectRoot, 'src/assets/css/fonts');

async function syncKatexAssets() {
  const [css, fontEntries] = await Promise.all([
    readFile(katexCssFile),
    readdir(katexFontsDir, { withFileTypes: true }),
  ]);

  await Promise.all([
    mkdir(dirname(publicKatexCssFile), { recursive: true }),
    mkdir(publicKatexFontsDir, { recursive: true }),
  ]);
  await writeFile(publicKatexCssFile, css);

  await Promise.all(
    fontEntries
      .filter(entry => entry.isFile())
      .map(async entry => {
        const source = resolve(katexFontsDir, entry.name);
        const destination = resolve(publicKatexFontsDir, entry.name);
        await writeFile(destination, await readFile(source));
      })
  );

  console.log(`✅ KaTeX stylesheet and ${fontEntries.length} fonts synced for self-hosting`);
}

await mkdir(dirname(outFile), { recursive: true });
await syncKatexAssets();

await esbuild.build({
  entryPoints: [resolve(__dirname, 'rich-markdown-entry.js')],
  outfile: outFile,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
});

const bundledSource = await readFile(outFile, 'utf8');
const productionSource = bundledSource
  .replace(
    /\n\s*console\.log\(arg\.reverse\(\)\.map\(\(token\) => token\.text\)\.join\(""\)\);/u,
    ''
  )
  .replace(
    /\n\s*console\.log\(tok, context\.macros\.get\(name\), functions\[name\], symbols\.math\[name\], symbols\.text\[name\]\);/u,
    ''
  );

if (productionSource !== bundledSource) {
  await writeFile(outFile, productionSource);
}

console.log(`✅ Rich markdown vendor bundle written to ${outFile}`);

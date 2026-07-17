#!/usr/bin/env node
/**
 * Inventory Font Awesome class names used outside vendor/.
 * Does not delete webfonts — run visual checks before subsetting all.min.css.
 *
 * Usage: node scripts/utils/inventory-fontawesome-icons.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../src/', import.meta.url));
const ICON_RE = /\b(?:fa(?:s|r|b)?\s+)?fa-[a-z0-9-]+\b/gi;
const SKIP = new Set(['vendor']);

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, out);
      continue;
    }
    if (/\.(html|js|css|md)$/i.test(entry.name)) out.push(path);
  }
  return out;
}

const files = await walk(ROOT);
const icons = new Map();

for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(ICON_RE)) {
    const name = match[0].replace(/^(fas|far|fab)\s+/i, '').toLowerCase();
    if (!name.startsWith('fa-')) continue;
    if (!icons.has(name)) icons.set(name, new Set());
    icons.get(name).add(relative(ROOT, file));
  }
}

const sorted = [...icons.keys()].sort();
console.log(`Unique Font Awesome icons outside vendor/: ${sorted.length}`);
for (const name of sorted) {
  console.log(`  ${name} (${icons.get(name).size} files)`);
}
console.log(
  '\nNext: generate a used-icon CSS subset only after visual QA; keep webfont files until then.'
);

#!/usr/bin/env node

/**
 * CSS duplicate scanner.
 *
 * Default mode: exact duplicate rule blocks
 * - same selector
 * - same normalized declaration block
 *
 * Optional mode: selector count
 *   node scripts/find-css-duplicates.js --selector-count
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cssRoot = join(__dirname, '../src/assets/css');

const skipFiles = new Set(['tailwind-output.css']);
const selectorCountMode = process.argv.includes('--selector-count');

function listCssFiles(directory) {
  const files = [];
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listCssFiles(fullPath));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.css') || skipFiles.has(entry.name)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function normalizeDeclarations(block) {
  return block
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .filter(declaration => declaration.includes(':'))
    .map(declaration =>
      declaration
        .replace(/\s+/g, ' ')
        .replace(/\s*:\s*/g, ':')
        .trim()
    )
    .join(';');
}

function parseSelectors(rawSelector) {
  if (!rawSelector) {
    return [];
  }

  return rawSelector
    .split(',')
    .map(selector => selector.trim())
    .filter(Boolean)
    .filter(selector => !selector.startsWith('@'))
    .filter(selector => !selector.includes(';'))
    .filter(selector => selector.length < 240)
    .filter(selector => !/^(from|to|\d+%)$/i.test(selector))
    .filter(selector => /[.#*a-zA-Z[]/.test(selector));
}

function lineNumberForIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === '\n') {
      line += 1;
    }
  }
  return line;
}

function analyzeFile(filePath) {
  const rawContent = readFileSync(filePath, 'utf8');
  const content = rawContent.replace(/\/\*[\s\S]*?\*\//g, '');
  const rulePattern = /([^{}]+)\{([^{}]*)\}/gm;
  let match;

  const selectorCounts = new Map();
  const exactRuleMap = new Map();

  while ((match = rulePattern.exec(content)) !== null) {
    const selectors = parseSelectors(match[1].trim());
    if (selectors.length === 0) {
      continue;
    }

    const declarations = normalizeDeclarations(match[2]);
    if (!declarations) {
      continue;
    }

    const line = lineNumberForIndex(content, match.index);

    for (const selector of selectors) {
      selectorCounts.set(selector, (selectorCounts.get(selector) ?? 0) + 1);

      const key = `${selector}@@${declarations}`;
      const entry = exactRuleMap.get(key) ?? { selector, count: 0, lines: [] };
      entry.count += 1;
      entry.lines.push(line);
      exactRuleMap.set(key, entry);
    }
  }

  if (selectorCountMode) {
    return [...selectorCounts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([selector, count]) => ({ selector, count, lines: [] }));
  }

  return [...exactRuleMap.values()]
    .filter(entry => entry.count > 1)
    .sort((a, b) => b.count - a.count || a.selector.localeCompare(b.selector));
}

const files = listCssFiles(cssRoot);
const modeLabel = selectorCountMode ? 'selector repetition' : 'exact duplicate rule blocks';

console.log(`Analyzing CSS files for ${modeLabel}...\n`);

let filesWithDuplicates = 0;
let duplicateGroups = 0;

for (const filePath of files) {
  const duplicates = analyzeFile(filePath);
  if (duplicates.length === 0) {
    continue;
  }

  filesWithDuplicates += 1;
  duplicateGroups += duplicates.length;

  const relativePath = relative(cssRoot, filePath).replace(/\\/g, '/');
  console.log(relativePath);

  for (const duplicate of duplicates) {
    if (duplicate.lines.length > 0 && !selectorCountMode) {
      console.log(
        `  ${duplicate.count}x ${duplicate.selector} (lines: ${duplicate.lines.join(', ')})`
      );
    } else {
      console.log(`  ${duplicate.count}x ${duplicate.selector}`);
    }
  }
  console.log('');
}

if (filesWithDuplicates === 0) {
  console.log('No duplicate CSS rule blocks found.');
} else {
  console.log(`Found ${duplicateGroups} duplicate groups across ${filesWithDuplicates} files.`);
}

console.log('Done.');

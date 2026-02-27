#!/usr/bin/env node

/**
 * CSS duplicate selector scanner.
 * Works with package.json "type": "module".
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cssDir = join(__dirname, '../src/assets/css');
const skipFiles = new Set([
    'tailwind-output.css'
]);

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

console.log('Analyzing CSS files for duplicate selectors...\n');

const cssFiles = listCssFiles(cssDir);

cssFiles.forEach((filePath) => {
    const rawContent = readFileSync(filePath, 'utf8');
    const content = rawContent.replace(/\/\*[\s\S]*?\*\//g, '');
    const file = filePath.replace(`${cssDir}/`, '');

    // Capture selector candidates before "{", then filter out declaration spill.
    const selectorPattern = /([^{}]+)\{/gm;
    const selectorCounts = {};
    let match;

    while ((match = selectorPattern.exec(content)) !== null) {
        const rawSelector = match[1].trim();
        if (!rawSelector) continue;
        if (rawSelector.startsWith('@')) continue;
        if (rawSelector.includes(';')) continue;
        if (rawSelector.length > 240) continue;

        const selectorParts = rawSelector
            .split(',')
            .map((selector) => selector.trim())
            .filter((selector) => selector.length > 0)
            .filter((selector) => !/^\d/.test(selector))
            .filter((selector) => !/^(from|to|\d+%)$/i.test(selector))
            .filter((selector) => /[.#*a-zA-Z[]/.test(selector));

        selectorParts.forEach((selector) => {
            selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
        });
    }

    const duplicates = Object.entries(selectorCounts)
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);

    if (duplicates.length === 0) {
        return;
    }

    console.log(`${file}`);
    duplicates.forEach(([selector, count]) => {
        console.log(`  ${count}x ${selector}`);
    });
    console.log('');
});

console.log('Done.');

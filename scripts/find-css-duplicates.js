#!/usr/bin/env node

/**
 * CSS Duplicate Remover
 * Analyzes and reports duplicate selectors in CSS files
 */

const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '../src/assets/css');
const files = [
    'about.css',
    'experience.css',
    'education.css',
    'blog.css',
    'publications.css',
    'awards.css',
    'recommendations.css',
    'certifications.css',
    'calendar.css'
];

console.log('🔍 Analyzing CSS files for duplicates...\n');

files.forEach(file => {
    const filePath = path.join(cssDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Find all selector declarations
    const selectorPattern = /^([.#][\w-]+(?:\s*[.#:[\w-]+)*)\s*\{/gm;
    const selectors = [];
    let match;

    while ((match = selectorPattern.exec(content)) !== null) {
        selectors.push({
            selector: match[1].trim(),
            line: content.substring(0, match.index).split('\n').length
        });
    }

    // Find duplicates
    const selectorCounts = {};
    selectors.forEach(({ selector }) => {
        selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
    });

    const duplicates = Object.entries(selectorCounts)
        .filter(([_, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);

    if (duplicates.length > 0) {
        console.log(`📄 ${file}:`);
        duplicates.forEach(([selector, count]) => {
            console.log(`   ${count}x ${selector}`);
        });
        console.log('');
    }
});

console.log('✅ Analysis complete!');

#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);

function getArg(name, defaultValue) {
    const index = args.findIndex((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
    if (index === -1) {
        return defaultValue;
    }

    const value = args[index];
    if (value.includes('=')) {
        return value.split('=').slice(1).join('=');
    }

    return args[index + 1] ?? defaultValue;
}

function parseThreshold(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    const number = Number(value);
    if (Number.isNaN(number)) {
        return fallback;
    }

    return number > 1 ? number : number * 100;
}

const url = getArg('url', 'http://127.0.0.1:3000');
const formFactor = getArg('form-factor', 'mobile');
const outputDir = resolve(process.cwd(), getArg('output-dir', 'artifacts/lighthouse'));

const thresholds = {
    performance: parseThreshold(getArg('min-performance', '50'), 50),
    accessibility: parseThreshold(getArg('min-accessibility', '95'), 95),
    bestPractices: parseThreshold(getArg('min-best-practices', '95'), 95),
    seo: parseThreshold(getArg('min-seo', '95'), 95)
};

const outputFile = join(tmpdir(), `lh-${formFactor}-${Date.now()}.json`);
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const lighthouseArgs = [
    'lighthouse',
    url,
    '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
    '--quiet',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--throttling-method=simulate',
    '--output=json',
    `--output-path=${outputFile}`
];

if (formFactor === 'desktop') {
    lighthouseArgs.push('--preset=desktop');
} else {
    lighthouseArgs.push('--form-factor=mobile');
}

console.log(`[lighthouse] Running ${formFactor} audit for ${url}`);

const run = spawnSync(npxCommand, lighthouseArgs, {
    stdio: 'inherit',
    env: process.env
});

if (run.status !== 0) {
    process.exit(run.status ?? 1);
}

const report = JSON.parse(readFileSync(outputFile, 'utf8'));
mkdirSync(outputDir, { recursive: true });
copyFileSync(outputFile, join(outputDir, `lighthouse-${formFactor}.json`));

const scores = {
    performance: Math.round((report.categories.performance.score ?? 0) * 100),
    accessibility: Math.round((report.categories.accessibility.score ?? 0) * 100),
    bestPractices: Math.round((report.categories['best-practices'].score ?? 0) * 100),
    seo: Math.round((report.categories.seo.score ?? 0) * 100)
};

console.log(
    `[lighthouse:${formFactor}] ` +
    `Performance=${scores.performance}, ` +
    `Accessibility=${scores.accessibility}, ` +
    `BestPractices=${scores.bestPractices}, ` +
    `SEO=${scores.seo}`
);

const failures = [];

if (scores.performance < thresholds.performance) {
    failures.push(`Performance ${scores.performance} < ${thresholds.performance}`);
}
if (scores.accessibility < thresholds.accessibility) {
    failures.push(`Accessibility ${scores.accessibility} < ${thresholds.accessibility}`);
}
if (scores.bestPractices < thresholds.bestPractices) {
    failures.push(`Best Practices ${scores.bestPractices} < ${thresholds.bestPractices}`);
}
if (scores.seo < thresholds.seo) {
    failures.push(`SEO ${scores.seo} < ${thresholds.seo}`);
}

if (failures.length > 0) {
    console.error('[lighthouse] Gate failed:');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('[lighthouse] Gate passed.');

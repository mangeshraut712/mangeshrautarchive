#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { inspectDeletion, removeWithinRepo } from '../safety/safe-files.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const targets = [
  'dist',
  'artifacts',
  'test-results',
  'playwright-report',
  'coverage',
  '.pytest_cache',
  '.ruff_cache',
];
const args = process.argv.slice(2);
if (
  args.some(arg => !['--dry-run', '--apply'].includes(arg)) ||
  (args.includes('--dry-run') && args.includes('--apply'))
) {
  throw new Error('Use npm run clean -- --dry-run or --apply. Arbitrary targets are not accepted.');
}
// Validate the whole plan before deleting anything.
for (const target of targets) await inspectDeletion(root, target);
for (const target of targets)
  await removeWithinRepo(root, target, { apply: args.includes('--apply') });
console.log(
  'Configuration, secrets, skills, scratch work, dependencies, and Git data are preserved.'
);

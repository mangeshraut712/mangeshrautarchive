#!/usr/bin/env node
/**
 * Fail fast when the active Node runtime is below the engines range.
 * Stylelint 17, Vitest 4, and Array#toSorted all need Node 22+.
 */
const MIN_MAJOR = 22;
const MAX_MAJOR_EXCLUSIVE = 27;

const version = process.versions.node || '0.0.0';
const major = Number(version.split('.')[0]) || 0;

if (major < MIN_MAJOR || major >= MAX_MAJOR_EXCLUSIVE) {
  console.error(
    [
      '',
      `  Unsupported Node.js ${version}`,
      `  This project requires Node ${MIN_MAJOR}.x – ${MAX_MAJOR_EXCLUSIVE - 1}.x (see package.json engines).`,
      '',
      '  Fix (pick one):',
      '    • nvm install 22 && nvm use 22',
      '    • brew install node@22 && export PATH="$(brew --prefix node@22)/bin:$PATH"',
      '    • fnm use 22',
      '',
      '  CI and Vercel use Node 22.x.',
      '',
    ].join('\n')
  );
  process.exit(1);
}

if (process.argv.includes('--verbose') || process.env.CHECK_NODE_VERBOSE === '1') {
  console.log(`Node ${version} OK (requires ${MIN_MAJOR}+, <${MAX_MAJOR_EXCLUSIVE})`);
}

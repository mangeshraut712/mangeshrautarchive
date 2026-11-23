#!/usr/bin/env node
console.log(
  'Manual operation only: use the Vercel environment settings to update integration variables.'
);
console.log('WARNING: removing and recreating production variables can disable live integrations.');
console.log(
  'This helper no longer reads dotenv files, invokes authenticated CLIs, or deletes remote variables.'
);
if (process.argv.includes('--apply')) process.exitCode = 1;

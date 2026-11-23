import { fileURLToPath } from 'node:url';
import { relative, resolve } from 'node:path';
import { removeWithinRepo } from './safe-files.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const [target, mode = '--dry-run', ...extra] = process.argv.slice(2);
if (!target || extra.length || !['--apply', '--dry-run'].includes(mode))
  throw new Error('Expected an owned temporary directory and --dry-run or --apply.');
const path = relative(root, resolve(root, target));
if (!/^\.cache\/(?:calendar-helper\/test\.|actionlint\.)[^/]+$/.test(path))
  throw new Error('WARNING: refusing cleanup outside owned repository temporary directories.');
await removeWithinRepo(root, target, { apply: mode === '--apply' });

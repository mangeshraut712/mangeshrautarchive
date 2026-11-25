import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

// DOMPurify 3.5.0 closes SAFE_FOR_TEMPLATES and IN_PLACE bypasses; there is
// no further 3.4.x. package.json overrides dompurify, so the override and the
// resolved lockfile entries must both stay on a fixed release.
const root = new URL('../../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'));

function atLeast(version, floor) {
  const a = version.split('.').map(Number);
  const b = floor.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

test('dompurify override pins a release with the 3.5.0 security fixes', () => {
  const override = pkg.overrides?.dompurify;
  assert.ok(override, 'dompurify override missing');
  assert.ok(atLeast(override.replace(/^[\^~]/, ''), '3.5.0'), `override ${override}`);
});

test('lockfile resolves dompurify >= 3.5.0 and isomorphic-dompurify >= 4.9.0', () => {
  const entries = Object.entries(lock.packages);
  const purify = entries.filter(([path]) => path.endsWith('node_modules/dompurify'));
  assert.ok(purify.length > 0, 'dompurify not in lockfile');
  for (const [path, meta] of purify) {
    assert.ok(atLeast(meta.version, '3.5.0'), `${path} is ${meta.version}`);
  }
  const iso = lock.packages['node_modules/isomorphic-dompurify'];
  assert.ok(iso && atLeast(iso.version, '4.9.0'), `isomorphic-dompurify is ${iso?.version}`);
});

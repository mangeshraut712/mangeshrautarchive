import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ASSET_VER, fontAwesomeStylesheet } from '../../scripts/build/asset-version.mjs';

test('shared asset versions reach stylesheets and the service worker build placeholder', () => {
  assert.match(ASSET_VER, /^\d{8}[a-z0-9._-]*$/i);
  assert.equal(
    fontAwesomeStylesheet('..'),
    `../assets/vendor/fontawesome/css/all.min.css?v=${ASSET_VER}`
  );
  const source = readFileSync(new URL('../../src/service-worker.js', import.meta.url), 'utf8');
  assert.match(source, /portfolio-shell-v__ASSET_VER__/);
});

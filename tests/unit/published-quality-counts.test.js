import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { TEST_COUNTS } from '../../src/js/data/portfolio-public-data.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test('published quality counts match the verified API and critical browser suites', () => {
  assert.deepEqual(TEST_COUNTS, {
    pytest: 234,
    criticalBrowser: 40,
    playwrightProjects: 16,
  });

  const python = read('api/portfolio_public_data.py');
  assert.match(python, /"pytest": 234/);
  assert.match(python, /"critical_browser": 40/);
  assert.match(python, /"playwright_projects": 16/);

  const uses = read('src/uses.html');
  assert.match(uses, /data-quality-test-count>234 \+ 40</);
  assert.match(uses, /234 API tests and 40 critical browser journeys/);
  assert.match(uses, /<strong>234 \/ 234<\/strong>/);
  assert.match(uses, /<strong>40<\/strong> critical journeys/);

  const monitor = read('src/monitor.html');
  assert.match(monitor, /40 Critical Browser Journeys/);
  assert.match(monitor, /234 Pytest API Tests/);
  assert.match(monitor, /234 \+ 40 Tests/);
  assert.match(monitor, /234 Pytest · 40 critical browser journeys · 16 Playwright projects/);

  const prompt = read('api/config.py');
  assert.match(
    prompt,
    /234 pytest API tests, 40 critical Playwright browser journeys, 16 configured browser projects/
  );
});

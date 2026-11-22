import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeContributions,
  fetchWorkEvidence,
} from '../../scripts/integrations/sync-work-evidence.mjs';
import { getWorkStream } from '../../src/js/data/work-editorial.js';

const pr = (repo = 'apple/example', number = 1) => ({
  html_url: `https://github.com/${repo}/pull/${number}`,
  title: 'Fix example',
  user: { login: 'mangeshraut712' },
  pull_request: { merged_at: '2026-11-20T00:00:00Z' },
});
test('contribution evidence excludes duplicates, own accounts, unmerged work and other authors', () => {
  const other = pr('apple/example', 2);
  other.user.login = 'someone-else';
  assert.equal(
    normalizeContributions([
      pr(),
      pr(),
      pr('dayx61/example'),
      pr('mangeshraut712/example'),
      { ...pr('apple/example', 3), pull_request: {} },
      other,
    ]).length,
    1
  );
});
test('work streams keep forks and profile infrastructure out of original project cards', () => {
  assert.equal(getWorkStream({ name: 'example', fork: true }), null);
  assert.equal(getWorkStream({ name: 'mangeshraut712' }), null);
  assert.equal(getWorkStream({ name: 'fieldfix' }), 'hackathons');
  assert.equal(getWorkStream({ name: 'original' }), 'projects');
  assert.equal(getWorkStream({ name: 'prototype', topics: ['hackathon'] }), 'hackathons');
});
test('incomplete contribution searches fail instead of publishing a partial milestone', async () => {
  await assert.rejects(
    fetchWorkEvidence({
      fetchImpl: async url =>
        Response.json(
          String(url).includes('/repos?')
            ? []
            : { incomplete_results: true, items: [], total_count: 99 }
        ),
    }),
    /Incomplete/
  );
});
test('contribution snapshots fetch all pages and preserve merged dates', async () => {
  const result = await fetchWorkEvidence({
    fetchImpl: async url =>
      Response.json(
        String(url).includes('/repos?')
          ? []
          : {
              incomplete_results: false,
              total_count: 101,
              items: String(url).endsWith('page=2')
                ? [pr('apple/example', 101)]
                : Array.from({ length: 100 }, (_, n) => pr('apple/example', n + 1)),
            }
      ),
  });
  assert.equal(result.contributions.length, 101);
  assert.equal(result.contributions[0].mergedAt, '2026-11-20T00:00:00Z');
});

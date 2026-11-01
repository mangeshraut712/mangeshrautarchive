import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { hasMeaningfulEdgeSnapshotChange } from '../../scripts/deployment/edge-snapshot-change.mjs';
import { syncGitHubStats } from '../../scripts/integrations/sync-github-stats.mjs';

const workflowPath = new URL('../../.github/workflows/github-stats-sync.yml', import.meta.url);
const analyticsWorkflowPath = new URL(
  '../../.github/workflows/analytics-reach-sync.yml',
  import.meta.url
);
const edgeSnapshotExporterPath = new URL(
  '../../scripts/deployment/export-edge-snapshots.mjs',
  import.meta.url
);
const pullRequestAutomationWorkflows = [
  {
    path: workflowPath,
    jobName: 'sync-stats',
    branch: 'automation/github-stats-sync',
    changedPath: 'src/js/data/github-stats.json',
  },
  {
    path: new URL('../../.github/workflows/kalnirnay-panchang-sync.yml', import.meta.url),
    jobName: 'refresh',
    branch: 'automation/kalnirnay-panchang-sync',
    changedPath: 'src/assets/data/kalnirnay-panchang.json',
  },
];

const CREATE_PULL_REQUEST_ACTION =
  'peter-evans/create-pull-request@5f6978faf089d4d20b00c7766989d076bb2fc7f1'; // v8

function extractPermissions(source) {
  const match = source.match(/permissions:\s*\n((?:\s+[a-z-]+:\s+[a-z]+\n?)+)/);
  if (!match) return {};
  const perms = {};
  for (const line of match[1].trim().split('\n')) {
    const [k, v] = line.trim().split(/:\s*/);
    if (k && v) perms[k] = v;
  }
  return perms;
}

function createGitHubFetch({ followers = 7 } = {}) {
  return async input => {
    const url = new URL(String(input));

    if (url.pathname === '/users/mangeshraut712') {
      return Response.json({ public_repos: 2, followers, following: 3 });
    }

    if (url.pathname === '/users/mangeshraut712/repos') {
      return Response.json([
        {
          name: 'archive',
          full_name: 'mangeshraut712/archive',
          description: 'Portfolio source',
          html_url: 'https://github.com/mangeshraut712/archive',
          homepage: null,
          stargazers_count: 4,
          forks_count: 1,
          language: 'JavaScript',
          topics: ['portfolio'],
          updated_at: '2026-10-30T00:00:00Z',
          fork: false,
          archived: false,
        },
        {
          name: 'forked-example',
          full_name: 'mangeshraut712/forked-example',
          description: 'Excluded fork',
          html_url: 'https://github.com/mangeshraut712/forked-example',
          homepage: null,
          stargazers_count: 99,
          forks_count: 88,
          language: 'JavaScript',
          topics: [],
          updated_at: '2026-10-30T00:00:00Z',
          fork: true,
          archived: false,
        },
      ]);
    }

    throw new Error(`Unexpected GitHub request: ${url}`);
  };
}

test('GitHub stats sync is idempotent when the fetched public data is unchanged', async () => {
  let storedStats = null;
  const readStats = () => storedStats;
  const writeStats = payload => {
    storedStats = payload;
  };
  const hasExistingStats = () => storedStats !== null;

  const first = await syncGitHubStats({
    fetchImpl: createGitHubFetch(),
    now: () => '2026-10-30T10:00:00.000Z',
    readStats,
    writeStats,
    hasExistingStats,
  });

  assert.equal(first.changed, true);
  const firstSnapshot = JSON.stringify(storedStats);

  const rerun = await syncGitHubStats({
    fetchImpl: createGitHubFetch(),
    now: () => '2026-10-30T11:00:00.000Z',
    readStats,
    writeStats,
    hasExistingStats,
  });

  assert.equal(rerun.changed, false);
  assert.equal(JSON.stringify(storedStats), firstSnapshot);

  const changed = await syncGitHubStats({
    fetchImpl: createGitHubFetch({ followers: 8 }),
    now: () => '2026-10-30T12:00:00.000Z',
    readStats,
    writeStats,
    hasExistingStats,
  });

  assert.equal(changed.changed, true);
  assert.equal(changed.payload.followersCount, 8);
  assert.equal(changed.payload.lastSyncedAt, '2026-10-30T12:00:00.000Z');
});

test('scheduled GitHub and Panchang data workflows create one reviewable draft PR instead of pushing main', () => {
  const workflowSource = readFileSync(workflowPath, 'utf8');

  assert.match(workflowSource, /name:\s*Checkout Repository\s*\n\s+uses:\s*actions\/checkout@v7/);
  assert.match(workflowSource, /name:\s*Setup Node\.js\s*\n\s+uses:\s*actions\/setup-node@v7/);
  assert.ok(workflowSource.includes('id: create-pull-request'));
  assert.ok(workflowSource.includes(`uses: ${CREATE_PULL_REQUEST_ACTION}`));

  for (const { path, branch, changedPath } of pullRequestAutomationWorkflows) {
    const source = readFileSync(path, 'utf8');

    assert.deepEqual(extractPermissions(source), {
      contents: 'write',
      'pull-requests': 'write',
    });
    assert.ok(source.includes(`uses: ${CREATE_PULL_REQUEST_ACTION}`));
    assert.ok(source.includes(`branch: ${branch}`));
    assert.match(source, /draft:\s*always-true/);
    assert.ok(source.includes(`add-paths: ${changedPath}`));
    assert.doesNotMatch(source, /\bgit\s+push\b/u);
    assert.doesNotMatch(source, /(?:HEAD:)?main\s*$/mu);
    assert.doesNotMatch(source, /\[skip ci\]|GH_PAT|gh\s+pr\s+merge|--admin/u);
  }
});

test('analytics reach sync preserves a values-free review artifact without creating a branch or PR', () => {
  const source = readFileSync(analyticsWorkflowPath, 'utf8');

  assert.deepEqual(extractPermissions(source), {
    contents: 'read',
  });
  assert.match(source, /uses:\s*actions\/upload-artifact@v4/);
  assert.match(
    source,
    /name:\s*analytics-reach-review-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/
  );
  assert.match(
    source,
    /ARTIFACT_NAME:\s*analytics-reach-review-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/
  );
  assert.match(source, /path:\s*artifacts\/analytics-reach-review/);
  assert.match(source, /retention-days:\s*2/);
  assert.match(source, /REQUIRE_GA:\s*'1'/);
  assert.match(source, /node scripts\/deployment\/export-edge-snapshots\.mjs/);
  assert.match(source, /if git diff --quiet -- "\$CANDIDATE_PATH"; then\n\s+changed=false/u);
  assert.match(source, /"candidateGenerated": true/u);
  assert.match(source, /"candidateIncluded": false/u);
  assert.match(source, /GITHUB_STEP_SUMMARY/);
  assert.match(source, /No commit, branch, pull request, or deployment was created\./);
  assert.match(source, /open a normal, independently reviewed pull request/iu);
  assert.match(source, /artifact intentionally excludes generated analytics and health/u);
  assert.doesNotMatch(
    source,
    /peter-evans\/create-pull-request|automation\/analytics-reach-sync|\bgit\s+push\b|GITHUB_TOKEN|gh\s+pr\b|pull-request-(?:operation|url)|cat\s+\/tmp\/uvicorn\.log|cp "\$CANDIDATE_PATH"|SHA256SUMS/u
  );
});

test('edge snapshot review signal ignores per-run metadata but preserves meaningful changes', () => {
  const existing = {
    exportedAt: '2026-11-01T00:00:00.000Z',
    reach: {
      total_reach: 1,
      timestamp: '2026-11-01T00:00:00.000Z',
      insights: { last_updated: '2026-11-01T00:00:00.000Z', unique_visitors: 1 },
    },
    healthVitals: {
      timestamp: '2026-11-01T00:00:00.000Z',
      status: 'stale',
      refresh: { ageMinutes: 1, stale: true },
    },
  };
  const originalExisting = structuredClone(existing);
  const timestampOnlyCandidate = structuredClone(existing);
  timestampOnlyCandidate.exportedAt = '2026-11-01T01:00:00.000Z';
  timestampOnlyCandidate.reach.timestamp = '2026-11-01T01:00:00.000Z';
  timestampOnlyCandidate.reach.insights.last_updated = '2026-11-01T01:00:00.000Z';
  timestampOnlyCandidate.healthVitals.timestamp = '2026-11-01T01:00:00.000Z';
  timestampOnlyCandidate.healthVitals.refresh.ageMinutes = 61;

  assert.equal(hasMeaningfulEdgeSnapshotChange(existing, timestampOnlyCandidate), false);
  assert.deepEqual(existing, originalExisting);
  assert.equal(hasMeaningfulEdgeSnapshotChange(null, timestampOnlyCandidate), true);

  const metricCandidate = structuredClone(timestampOnlyCandidate);
  metricCandidate.reach.total_reach = 2;
  assert.equal(hasMeaningfulEdgeSnapshotChange(existing, metricCandidate), true);
});

test('edge snapshot exporter completion log excludes analytics and health values', () => {
  const source = readFileSync(edgeSnapshotExporterPath, 'utf8');
  const completionSection = source.slice(source.lastIndexOf('fs.writeFileSync'));

  assert.match(source, /hasMeaningfulEdgeSnapshotChange\(existing, snapshot\)/);
  assert.match(source, /No meaningful edge snapshot changes detected/);
  assert.match(completionSection, /Prepared .*without logging analytics or health values\./);
  assert.doesNotMatch(completionSection, /reach=|sleep=|total_reach|sleepScore/u);
});

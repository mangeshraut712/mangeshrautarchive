import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import yaml from 'js-yaml';

import { syncGitHubStats } from '../../scripts/integrations/sync-github-stats.mjs';

const workflowPath = new URL('../../.github/workflows/github-stats-sync.yml', import.meta.url);
const automationWorkflows = [
  {
    path: workflowPath,
    jobName: 'sync-stats',
    branch: 'automation/github-stats-sync',
    changedPath: 'src/js/data/github-stats.json',
  },
  {
    path: new URL('../../.github/workflows/analytics-reach-sync.yml', import.meta.url),
    jobName: 'sync',
    branch: 'automation/analytics-reach-sync',
    changedPath: 'workers/assistme-chat/src/edge-data-snapshot.js',
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
  const tempDirectory = mkdtempSync(join(tmpdir(), 'github-stats-sync-'));
  const outputFile = join(tempDirectory, 'github-stats.json');

  try {
    const first = await syncGitHubStats({
      fetchImpl: createGitHubFetch(),
      outputFile,
      now: () => '2026-10-30T10:00:00.000Z',
    });
    const firstContents = readFileSync(outputFile, 'utf8');

    const rerun = await syncGitHubStats({
      fetchImpl: createGitHubFetch(),
      outputFile,
      now: () => '2026-10-30T11:00:00.000Z',
    });

    assert.equal(first.changed, true);
    assert.equal(rerun.changed, false);
    assert.equal(readFileSync(outputFile, 'utf8'), firstContents);

    const changed = await syncGitHubStats({
      fetchImpl: createGitHubFetch({ followers: 8 }),
      outputFile,
      now: () => '2026-10-30T12:00:00.000Z',
    });

    assert.equal(changed.changed, true);
    assert.equal(changed.payload.followersCount, 8);
    assert.equal(changed.payload.lastSyncedAt, '2026-10-30T12:00:00.000Z');
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test('scheduled data workflows create or update one reviewable draft PR instead of pushing main', () => {
  const workflowSource = readFileSync(workflowPath, 'utf8');
  const workflow = yaml.load(workflowSource);
  const checkoutStep = workflow.jobs['sync-stats'].steps.find(
    step => step.name === 'Checkout Repository'
  );
  const setupNodeStep = workflow.jobs['sync-stats'].steps.find(
    step => step.name === 'Setup Node.js'
  );
  const createPullRequestStep = workflow.jobs['sync-stats'].steps.find(
    step => step.id === 'create-pull-request'
  );

  assert.equal(checkoutStep.uses, 'actions/checkout@v7');
  assert.equal(setupNodeStep.uses, 'actions/setup-node@v7');
  assert.equal(createPullRequestStep.uses, CREATE_PULL_REQUEST_ACTION);

  for (const { path, jobName, branch, changedPath } of automationWorkflows) {
    const source = readFileSync(path, 'utf8');
    const workflowDefinition = yaml.load(source);
    const workflowJob = workflowDefinition.jobs[jobName];
    const pullRequestStep = workflowJob.steps.find(step => step.id === 'create-pull-request');

    assert.deepEqual(workflowDefinition.permissions, {
      contents: 'write',
      'pull-requests': 'write',
    });
    assert.equal(pullRequestStep.uses, CREATE_PULL_REQUEST_ACTION);
    assert.equal(pullRequestStep.with.branch, branch);
    assert.equal(pullRequestStep.with.draft, 'always-true');
    assert.equal(pullRequestStep.with['add-paths'], changedPath);
    assert.doesNotMatch(source, /\bgit\s+push\b/u);
    assert.doesNotMatch(source, /(?:HEAD:)?main\s*$/mu);
    assert.doesNotMatch(source, /\[skip ci\]|GH_PAT|gh\s+pr\s+merge|--admin/u);
  }
});

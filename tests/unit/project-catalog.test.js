import test from 'node:test';
import assert from 'node:assert/strict';
import GitHubProjects from '../../src/js/modules/github-projects.js';
const repo = n => ({
  name: `project-${n}`,
  full_name: `tester/project-${n}`,
  updated_at: '2026-11-10T00:00:00Z',
});
const catalog = name => {
  const g = new GitHubProjects(name);
  g.proxyCandidates = ['https://edge.test/catalog'];
  g.buildGitHubProxyUrl = () => '';
  return g;
};

test('catalog loads beyond 100 repositories and deduplicates overlapping pages', async t => {
  const g = catalog('pagination');
  t.mock.method(
    globalThis,
    'fetch',
    async url =>
      new Response(
        JSON.stringify(
          String(url).includes('page=2')
            ? [repo(99), repo(100)]
            : Array.from({ length: 100 }, (_, n) => repo(n))
        )
      )
  );
  const values = await g.fetchRepositories();
  assert.equal(values.length, 101);
  assert.equal(g.catalogStatus.partial, false);
});
test('catalog marks a failed continuation as partial rather than a complete 100-repo list', async t => {
  const g = catalog('partial');
  t.mock.method(globalThis, 'fetch', async url =>
    String(url).includes('page=2')
      ? new Response('', { status: 503 })
      : new Response(JSON.stringify(Array.from({ length: 100 }, (_, n) => repo(n))))
  );
  assert.equal((await g.fetchRepositories()).length, 100);
  assert.equal(g.catalogStatus.partial, true);
});
test('unavailable browser storage does not prevent the offline catalog', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked');
    },
  });
  t.after(() =>
    original
      ? Object.defineProperty(globalThis, 'localStorage', original)
      : delete globalThis.localStorage
  );
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('offline');
  });
  const g = catalog('offline');
  assert.ok((await g.fetchRepositories(true)).length > 0);
  assert.equal(g.catalogStatus.source, 'bundled');
});
test('simultaneous catalog refreshes share the same network load', async t => {
  const g = catalog('shared');
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return new Response(JSON.stringify([repo(1)]));
  });
  const [a, b] = await Promise.all([g.fetchRepositories(true), g.fetchRepositories(true)]);
  assert.deepEqual(a, b);
  assert.equal(calls, 1);
});
test('a rate-limited proxy response cannot become zero commits', async t => {
  const g = catalog('rate-limit');
  g.buildGitHubProxyUrl = () => 'https://edge.test/proxy';
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('[]', { headers: { 'X-GitHub-Proxy-Degraded': 'rate-limit' } })
  );
  assert.equal(
    (await g.fetchJsonWithMeta('https://api.github.com/repos/tester/demo/commits')).ok,
    false
  );
});
test('activity uses commit pagination and never mistakes contributor page count for people', async () => {
  const g = catalog('activity');
  g.fetchJsonWithMeta = async url =>
    url.includes('/commits')
      ? {
          ok: true,
          data: [{ commit: { author: { date: '2026-11-10T00:00:00Z' } } }],
          link: '<https://api.github.com/commits?page=42>; rel="last"',
        }
      : url.includes('/contributors')
        ? {
            ok: true,
            data: Array.from({ length: 100 }, (_, n) => ({ login: `person-${n}`, type: 'User' })),
            link: '<https://api.github.com/contributors?page=2>; rel="last"',
          }
        : { ok: true, data: [], link: '' };
  const result = await g.fetchRepoActivity({
    name: 'demo',
    full_name: 'tester/demo',
    owner: { login: 'tester' },
  });
  assert.equal(result.commits30d, 42);
  assert.equal(result.contributors, 100);
});

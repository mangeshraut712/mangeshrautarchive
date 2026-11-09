import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../workers/assistme-chat/src/index.js';
const req = () =>
  new Request(
    'https://worker.test/api/github/proxy?path=' +
      encodeURIComponent('/repos/mangeshraut712/mangeshrautarchive/commits?per_page=1'),
    { headers: { Origin: 'https://mangeshraut712.github.io' } }
  );
test('GitHub proxy preserves and exposes pagination headers to Pages', async t => {
  const link =
    '<https://api.github.com/repos/mangeshraut712/mangeshrautarchive/commits?page=42>; rel="last"';
  t.mock.method(globalThis, 'fetch', async () => new Response('[{}]', { headers: { Link: link } }));
  const response = await worker.fetch(req(), {});
  assert.equal(response.headers.get('link'), link);
  assert.match(response.headers.get('access-control-expose-headers'), /Link/);
});
test('GitHub proxy exposes degradation so clients distinguish rate limits from empty history', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 429 }));
  const response = await worker.fetch(req(), {});
  assert.equal(response.headers.get('x-github-proxy-degraded'), 'rate-limit');
  assert.match(response.headers.get('access-control-expose-headers'), /X-GitHub-Proxy-Degraded/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiProxyUrl } from '../../scripts/utils/proxy-target.mjs';

test('API proxy preserves its configured destination and encoded query values', () => {
  for (const upstream of [
    'http://127.0.0.1:8001',
    'https://assistme-chat.mangeshraut712.workers.dev',
  ]) {
    const url = createApiProxyUrl(
      '/api/music/artwork?url=https%3A%2F%2Fexample.com%2Fcover.png&size=96',
      upstream
    );
    assert.equal(url.origin, upstream);
    assert.equal(url.pathname, '/api/music/artwork');
    assert.equal(url.searchParams.get('url'), 'https://example.com/cover.png');
    assert.equal(url.searchParams.get('size'), '96');
  }
});

test('API proxy rejects alternate authorities and paths escaping the API namespace', () => {
  for (const path of [
    'https://example.com/api/music/recent',
    '//example.com/api/music/recent',
    '/\\example.com/api/music/recent',
    '/api/../../private',
    '/api/%2e%2e/private',
    '/other',
  ]) {
    assert.throws(() => createApiProxyUrl(path, 'http://127.0.0.1:8001'));
  }
});

test('API proxy treats URL-shaped query data as data and refuses unsafe upstream schemes', () => {
  const url = createApiProxyUrl(
    '/api/music/recent?next=//example.com/path#ignored',
    'https://assistme-chat.mangeshraut712.workers.dev'
  );
  assert.equal(url.host, 'assistme-chat.mangeshraut712.workers.dev');
  assert.equal(url.hash, '');
  assert.equal(url.searchParams.get('next'), '//example.com/path');
  for (const upstream of ['file:///tmp/api', 'https://user:pass@example.com']) {
    assert.throws(() => createApiProxyUrl('/api/health', upstream));
  }
});

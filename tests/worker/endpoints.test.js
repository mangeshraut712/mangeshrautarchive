import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../../workers/assistme-chat/src/index.js';

const env = {
  OPENROUTER_API_KEY: 'test-only-placeholder',
  ALLOWED_ORIGINS: 'https://mangeshraut712.github.io,https://mangeshraut.pro',
};

test('OPTIONS request returns CORS preflight with status 204', async () => {
  const req = new Request('https://worker.local/api/chat', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://mangeshraut712.github.io',
      'Access-Control-Request-Method': 'POST',
    },
  });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://mangeshraut712.github.io');
  assert.ok(res.headers.get('Access-Control-Allow-Methods'));
});

test('GET / returns worker metadata and available endpoints list', async () => {
  const req = new Request('https://worker.local/', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.name, 'assistme-chat');
  assert.equal(data.host, 'cloudflare-worker');
  assert.ok(Array.isArray(data.endpoints));
  assert.ok(data.endpoints.includes('POST /api/chat'));
});

test('GET /api/health returns operational status', async () => {
  const req = new Request('https://worker.local/api/health', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.status);
  assert.equal(data.host, 'cloudflare-worker');
});

test('GET /api/chat/health returns chat service health', async t => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
  );
  const req = new Request('https://worker.local/api/chat/health', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
});

test('GET /api/chat/models returns available free models', async () => {
  const req = new Request('https://worker.local/api/chat/models', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.models));
  assert.equal(data.routing, 'task-and-capability');
});

test('GET /api/realtime/health returns realtime voice bridge status', async () => {
  const req = new Request('https://worker.local/api/realtime/health', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.host, 'cloudflare-worker');
});

test('GET /api/tts/health returns text-to-speech health status', async () => {
  const req = new Request('https://worker.local/api/tts/health', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
});

test('POST /api/csp-report accepts report with status 204', async () => {
  const req = new Request('https://worker.local/api/csp-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'csp-report': { 'violated-directive': 'script-src' } }),
  });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 204);
});

test('GET /unknown-route returns 404 with standard error format', async () => {
  const req = new Request('https://worker.local/api/nonexistent-endpoint', { method: 'GET' });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.ok(data.error || data.detail);
});

test('POST /api/chat fallback returns accurate pi value when offline or unconfigured', async () => {
  const req = new Request('https://worker.local/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'what is value of pi?', stream: false }),
  });
  const res = await worker.fetch(req, { OPENROUTER_API_KEY: '' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.answer.includes('3.14159'));
  assert.equal(data.source, 'Local Intelligence');
});

test('POST /api/chat fallback returns java code for hello world query', async () => {
  const req = new Request('https://worker.local/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hello world in java language', stream: false }),
  });
  const res = await worker.fetch(req, { OPENROUTER_API_KEY: '' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.answer.includes('```java'));
  assert.ok(data.answer.includes('public class HelloWorld'));
  assert.equal(data.source, 'Local Intelligence');
});

test('POST /api/chat fallback evaluates arithmetic calculations', async () => {
  const req = new Request('https://worker.local/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'what is 15 * 8', stream: false }),
  });
  const res = await worker.fetch(req, { OPENROUTER_API_KEY: '' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.answer.includes('120'));
  assert.equal(data.source, 'Local Intelligence');
});

test('chat rejects non-object bodies and non-string messages without invoking upstream', async () => {
  for (const payload of [null, [], 42, 'hello', { message: {} }, { message: 42 }]) {
    const response = await worker.fetch(
      new Request('https://worker.local/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      { OPENROUTER_API_KEY: '' }
    );
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
});

test('speech rejects structured text before contacting the provider', async () => {
  const response = await worker.fetch(
    new Request('https://worker.local/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: { content: 'hello' } }),
    }),
    env
  );
  assert.equal(response.status, 400);
});

test('privacy deletion preflight permits DELETE and session credentials', async () => {
  const response = await worker.fetch(
    new Request('https://worker.local/api/personalization/delete', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://mangeshraut712.github.io',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'x-session-id,x-session-token',
      },
    }),
    env
  );
  assert.equal(response.status, 204);
  assert.match(response.headers.get('Access-Control-Allow-Methods'), /DELETE/);
  assert.match(response.headers.get('Access-Control-Allow-Headers'), /X-Session-Token/i);
  assert.match(response.headers.get('Access-Control-Allow-Headers'), /X-Session-ID/i);
});

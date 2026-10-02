import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../../workers/assistme-chat/src/index.js';

const models = [
  ['nvidia/nemotron-3-ultra-550b-a55b:free', ['text']],
  ['nvidia/nemotron-3.5-lightning:free', ['text']],
  ['cohere/north-mini-code:free', ['text']],
  ['google/gemma-4-26b-a4b-it:free', ['text', 'image', 'video']],
  ['nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', ['text', 'image', 'audio', 'video']],
].map(([id, inputs]) => ({
  id,
  architecture: { input_modalities: inputs, output_modalities: ['text'] },
  pricing: { prompt: '0', completion: '0' },
}));
const env = { OPENROUTER_API_KEY: 'test-only-placeholder', OPENROUTER_PAID_FALLBACK: 'true' };
const request = body =>
  new Request('https://example.com/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
const dataUrl = mime => `data:${mime};base64,${Buffer.from('fixture').toString('base64')}`;
const originalFetch = globalThis.fetch;
let calls = [];
let failFirst = false;
let cancelObserved = false;
let stall = false;
globalThis.fetch = async (url, options) => {
  if (String(url).endsWith('/models')) return Response.json({ data: models });
  if (String(url).includes('news.google.com') || String(url).includes('wikipedia.org')) {
    return new Response(
      '<rss><channel><item><title>Mock Real-Time Tech Headline</title><pubDate>Fri, 02 Oct 2026 12:00:00 GMT</pubDate><description>Verified contemporary tech update</description></item></channel></rss>',
      { status: 200 }
    );
  }
  const body = typeof options?.body === 'string' ? JSON.parse(options.body) : {};
  calls.push(body);
  if (failFirst && calls.length === 1) return new Response('Provider quota', { status: 429 });
  if (stall)
    return new Response(
      new ReadableStream({
        start(c) {
          c.enqueue(
            new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Beginning"}}]}\n')
          );
        },
        cancel() {
          cancelObserved = true;
        },
      })
    );
  const events = [
    {
      model: 'actual/provider-model',
      provider: 'Test Provider',
      choices: [{ delta: { content: 'Verified response.' } }],
    },
    { usage: { completion_tokens: 9, cost: 0 }, choices: [{ finish_reason: 'stop' }] },
  ];
  return new Response(events.map(e => `data: ${JSON.stringify(e)}`).join('\n'));
};
process.on('exit', () => {
  globalThis.fetch = originalFetch;
});

for (const [type, mime, expected] of [
  ['image', 'image/png', 'google/gemma-4-26b-a4b-it:free'],
  ['video', 'video/mp4', 'google/gemma-4-26b-a4b-it:free'],
  ['audio', 'audio/wav', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'],
  ['pdf', 'application/pdf', 'nvidia/nemotron-3-ultra-550b-a55b:free'],
]) {
  test(`${type} attachment reaches a compatible model and preserves actual stream metadata`, async () => {
    calls = [];
    const response = await worker.fetch(
      request({
        message: 'Explain this attachment in detail.',
        attachments: [{ src: dataUrl(mime), name: `test.${type}` }],
        model: 'client/injected-model',
      }),
      env,
      {}
    );
    const frames = (await response.text()).trim().split('\n').map(JSON.parse);
    assert.equal(calls[0].model, expected);
    const done = frames.find(e => e.type === 'done');
    assert.equal(done.metadata.model, 'actual/provider-model');
    assert.equal(done.metadata.tokens, 9);
    assert.equal(done.metadata.cost, 0);
    assert.equal(done.full_content, 'Verified response.');
    if (type === 'pdf') assert.equal(calls[0].plugins[0].pdf.engine, 'cloudflare-ai');
  });
}
test('text tasks select different specialists and recover from provider quota', async () => {
  calls = [];
  failFirst = true;
  const response = await worker.fetch(
    request({ message: 'Debug this JavaScript function.', stream: true }),
    env,
    {}
  );
  const frames = (await response.text()).trim().split('\n').map(JSON.parse);
  assert.equal(calls[0].model, 'cohere/north-mini-code:free');
  assert.equal(calls[1].model, 'nvidia/nemotron-3-ultra-550b-a55b:free');
  assert.equal(frames.at(-1).metadata.source, 'OpenRouter');
  failFirst = false;
});
test('quick factual queries route to Gemma for fast, token-efficient responses', async () => {
  calls = [];
  const response = await worker.fetch(
    request({ message: 'who is apple ceo?', stream: true }),
    env,
    {}
  );
  const frames = (await response.text()).trim().split('\n').map(JSON.parse);
  assert.equal(calls[0].model, 'google/gemma-4-26b-a4b-it:free');
  assert.equal(frames.at(-1).metadata.source, 'OpenRouter');
});
test('malformed and oversized attachments are rejected, never silently discarded', async () => {
  for (const src of [
    'https://example.com/untrusted.png',
    'data:image/png;base64,' + 'A'.repeat(8_000_000),
  ]) {
    const response = await worker.fetch(
      request({ message: 'Describe this', attachments: [{ src }] }),
      env,
      {}
    );
    assert.equal(response.status, 400);
  }
});
test('device Stop cancels the upstream stream and avoids a replacement answer', async () => {
  calls = [];
  stall = true;
  const response = await worker.fetch(request({ message: 'Explain streaming in depth.' }), env, {});
  const reader = response.body.getReader();
  await reader.read();
  // Wait for provider stream activation rather than an arbitrary time delay.
  while (!calls.length) await new Promise(resolve => setImmediate(resolve));
  await reader.read();
  await reader.cancel();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(cancelObserved);
  stall = false;
});

test('contemporary news query activates live search and attaches live grounding metadata', async () => {
  calls = [];
  const response = await worker.fetch(
    request({ message: 'What is the latest news about OpenAI and Apple?', stream: true }),
    env,
    {}
  );
  const frames = (await response.text()).trim().split('\n').map(JSON.parse);
  const done = frames.find(e => e.type === 'done');
  assert.ok(done, 'Stream finished with done frame');
  assert.equal(done.metadata.live_grounded, true);
  assert.ok(done.metadata.live_sources > 0);
  const systemMessage = calls[0].messages.find(m => m.role === 'system');
  assert.ok(systemMessage.content.includes('Mock Real-Time Tech Headline'));
  assert.ok(systemMessage.content.includes('John Ternus is the CEO of Apple Inc.'));
});

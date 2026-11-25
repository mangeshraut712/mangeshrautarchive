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
models.push({
  id: 'google/gemini-3.8-flash',
  architecture: {
    input_modalities: ['text', 'image', 'audio', 'video'],
    output_modalities: ['text'],
  },
  pricing: { prompt: '0.0000015', completion: '0.000004' },
});
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
  const urlStr = String(url);
  if (urlStr.endsWith('/models')) return Response.json({ data: models });
  if (urlStr.includes('api.github.com/users/')) {
    return Response.json({ login: 'mangeshraut712', public_repos: 42 });
  }
  try {
    const parsedUrl = new URL(urlStr);
    const host = parsedUrl.hostname;
    if (host === 'news.google.com' || host === 'wikipedia.org' || host.endsWith('.wikipedia.org')) {
      return new Response(
        '<rss><channel><item><title>Mock Real-Time Tech Headline</title><link>https://example.com/news</link><pubDate>Fri, 02 Oct 2026 12:00:00 GMT</pubDate><description>Verified contemporary tech update</description></item></channel></rss>',
        { status: 200 }
      );
    }
  } catch (_e) {
    // Relative path or invalid URL
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
  assert.equal(calls[0].model, 'nvidia/nemotron-3-ultra-550b-a55b:free');
  assert.equal(calls[1].model, 'nvidia/nemotron-3.5-lightning:free');
  assert.equal(frames.at(-1).metadata.source, 'OpenRouter');
  failFirst = false;
});

test('quick factual queries route to Lightning for fast, token-efficient responses', async () => {
  calls = [];
  const response = await worker.fetch(
    request({ message: 'who is apple ceo?', stream: true }),
    env,
    {}
  );
  const frames = (await response.text()).trim().split('\n').map(JSON.parse);
  assert.equal(calls[0].model, 'nvidia/nemotron-3.5-lightning:free');
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
  assert.ok(!systemMessage.content.includes('Mock Real-Time Tech Headline'));
  assert.ok(
    calls[0].messages.some(
      m => m.role === 'user' && m.content.includes('Mock Real-Time Tech Headline')
    )
  );
  assert.equal(done.metadata.sources[0].url, 'https://example.com/news');
});

test('audio fails safely without paid recovery after a free-provider limit', async () => {
  calls = [];
  failFirst = true;
  const response = await worker.fetch(
    request({
      message: 'Transcribe the spoken sentence exactly.',
      messages: [{ role: 'user', content: 'Earlier conversation context.' }],
      attachments: [{ src: dataUrl('audio/wav'), name: 'speech.wav' }],
    }),
    env,
    {}
  );
  await response.text();
  assert.equal(calls[0].model, 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].messages.at(-1).content[1].type, 'input_audio');
  failFirst = false;
});

test('cors allows loopback and production origins and rejects lookalike hosts', async () => {
  for (const origin of [
    'http://localhost:4000',
    'http://127.0.0.1:8001',
    'https://mangeshraut.pro',
    'https://mangeshraut712.github.io',
  ]) {
    const response = await worker.fetch(
      new Request('https://example.com/api/health', {
        method: 'OPTIONS',
        headers: { Origin: origin },
      }),
      env,
      {}
    );
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }

  for (const origin of [
    'https://localhost.evil.example',
    'https://evil-localhost.com',
    'https://127.0.0.1.attacker.example',
    'https://not-allowed.example',
  ]) {
    const response = await worker.fetch(
      new Request('https://example.com/api/health', {
        method: 'OPTIONS',
        headers: { Origin: origin },
      }),
      env,
      {}
    );
    assert.equal(response.headers.get('access-control-allow-origin'), null, origin);
  }
});

test('github profile route returns user profile data', async () => {
  const response = await worker.fetch(
    new Request('https://example.com/api/github/profile'),
    env,
    {}
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.data.login, 'mangeshraut712');
});

test('paid flags and client overrides cannot enable paid models or search', async () => {
  calls = [];
  const response = await worker.fetch(
    request({
      message: 'Compare recent AI models and research their trade-offs.',
      model: 'openrouter/fusion',
      stream: true,
    }),
    { ...env, OPENROUTER_MODEL: 'paid/model', OPENROUTER_FUSION_ENABLED: 'true' },
    {}
  );
  await response.text();
  assert.ok(calls.length > 0);
  for (const call of calls) {
    assert.ok(call.model.endsWith(':free') || call.model === 'openrouter/free');
    assert.deepEqual(call.provider.max_price, { prompt: 0, completion: 0 });
    assert.equal(call.tools, undefined);
    assert.deepEqual(call.plugins, []);
  }
});

test('configured credentials cannot enable paid speech', async () => {
  calls = [];
  const response = await worker.fetch(
    new Request('https://example.com/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello' }),
    }),
    env,
    {}
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).fallback, 'browser-speechSynthesis');
  assert.equal(calls.length, 0);
});

test('local fallback answers Nue Health by article, not Whoop biometrics', async () => {
  const response = await worker.fetch(
    request({ message: 'What does the Nue Health Field Notes say about trust?', stream: false }),
    { OPENROUTER_API_KEY: '' },
    {}
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.model, 'edge-local');
  assert.match(data.answer, /Nue Health Field Notes/i);
  assert.match(data.answer, /November 23, 2026/);
  assert.doesNotMatch(data.answer, /Whoop/);
});

test('local fallback still answers Whoop health questions with biometrics', async () => {
  const response = await worker.fetch(
    request({ message: 'How is his Whoop recovery and health?', stream: false }),
    { OPENROUTER_API_KEY: '' },
    {}
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(data.answer, /Whoop/);
  assert.doesNotMatch(data.answer, /Nue Health/);
});

test('local fallback reports both Razorpay issue and publication dates', async () => {
  const response = await worker.fetch(
    request({ message: 'When was the Razorpay Vulcan article published?', stream: false }),
    { OPENROUTER_API_KEY: '' },
    {}
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(data.answer, /Razorpay Vulcan/);
  assert.match(data.answer, /August 18, 2026/);
  assert.match(data.answer, /September 10, 2026/);
});

test('local fallback does not treat continue-health wording as the Nue Health article', async () => {
  const response = await worker.fetch(
    request({ message: 'How is his continuing health?', stream: false }),
    { OPENROUTER_API_KEY: '' },
    {}
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(data.answer, /Whoop/);
  assert.doesNotMatch(data.answer, /Nue Health Field Notes/);
});

test('local fallback matches hyphenated nue-health phrasing as the article', async () => {
  const response = await worker.fetch(
    request({ message: 'Summarize the nue-health field notes', stream: false }),
    { OPENROUTER_API_KEY: '' },
    {}
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(data.answer, /Nue Health Field Notes/i);
  assert.doesNotMatch(data.answer, /Whoop/);
});

#!/usr/bin/env node
/**
 * CI / local probe: does OPENROUTER_API_KEY work with free models?
 * Never prints the key. Exit 0 on success, 1 on hard failure, 2 on soft failure.
 */
const key = (process.env.OPENROUTER_API_KEY || '').trim();
if (!key) {
  console.error('OPENROUTER_API_KEY is not set');
  process.exit(1);
}

const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer':
      process.env.OPENROUTER_SITE_URL || 'https://mangeshraut712.github.io/mangeshrautarchive',
    'X-Title': 'AssistMe OpenRouter Probe',
  },
  body: JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
    max_tokens: 16,
  }),
});

const text = await res.text();
console.log(`OpenRouter probe HTTP ${res.status} model=${model} body_chars=${text.length}`);
if (!res.ok) {
  console.error(text.slice(0, 300));
  process.exit(res.status === 402 || res.status === 429 ? 2 : 1);
}
console.log('OpenRouter secret OK');
process.exit(0);

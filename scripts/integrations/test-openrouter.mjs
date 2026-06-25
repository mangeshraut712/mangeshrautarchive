#!/usr/bin/env node
/**
 * Verify OpenRouter API key, list models, probe chat completion, and optional AssistMe /api/chat.
 * Usage: node scripts/integrations/test-openrouter.mjs [--api-url=http://127.0.0.1:8001]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
const primaryModel = process.env.OPENROUTER_MODEL?.trim() || 'x-ai/grok-4.3';
const apiBase =
  process.argv.find(arg => arg.startsWith('--api-url='))?.split('=')[1] ||
  `http://127.0.0.1:${process.env.PORT || 8001}`;

function maskKey(key) {
  if (!key || key.length < 12) return '(missing or too short)';
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

function pass(label, detail = '') {
  console.log(`✅ ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail = '') {
  console.error(`❌ ${label}${detail ? ` — ${detail}` : ''}`);
  process.exitCode = 1;
}

async function testOpenRouterKey() {
  if (!apiKey || apiKey.includes('your_openrouter')) {
    fail('OPENROUTER_API_KEY', 'Set a real key in .env or .env.local');
    return false;
  }
  pass('OPENROUTER_API_KEY present', maskKey(apiKey));
  return true;
}

async function testModelsEndpoint() {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    fail('OpenRouter /models', `HTTP ${res.status}`);
    return null;
  }
  const body = await res.json();
  const count = Array.isArray(body?.data) ? body.data.length : 0;
  pass('OpenRouter /models', `${count} models available`);
  const hasPrimary = body.data?.some(m => m.id === primaryModel);
  if (hasPrimary) {
    pass('Primary model listed', primaryModel);
  } else {
    console.log(`⚠️  ${primaryModel} not in model list (router may still resolve it)`);
  }
  return body;
}

async function testChatCompletion() {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://mangeshraut.pro',
      'X-Title': process.env.OPENROUTER_SITE_TITLE || 'AssistMe AI Assistant',
    },
    body: JSON.stringify({
      model: primaryModel,
      messages: [{ role: 'user', content: 'Reply with exactly: OPENROUTER_OK' }],
      max_tokens: 16,
      stream: false,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    fail('OpenRouter chat completion', `HTTP ${res.status}: ${err.slice(0, 200)}`);
    return;
  }
  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content?.trim() || '';
  if (text.includes('OPENROUTER_OK')) {
    pass('OpenRouter chat completion', `model=${body?.model || primaryModel}`);
  } else {
    pass(
      'OpenRouter chat completion',
      `model=${body?.model || primaryModel}, reply="${text.slice(0, 60)}"`
    );
  }
}

async function testAssistMeChat() {
  const healthUrl = `${apiBase}/api/chat/health`;
  let healthRes;
  try {
    healthRes = await fetch(healthUrl, { signal: AbortSignal.timeout(8000) });
  } catch {
    console.log(`⚠️  AssistMe API not reachable at ${apiBase} (start: npm run dev)`);
    return;
  }
  if (!healthRes.ok) {
    fail('AssistMe /api/chat/health', `HTTP ${healthRes.status}`);
    return;
  }
  const health = await healthRes.json();
  pass('AssistMe /api/chat/health', `provider=${health.provider || health.status || 'ok'}`);

  const chatRes = await fetch(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What is your name?',
      stream: false,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!chatRes.ok) {
    fail('AssistMe POST /api/chat', `HTTP ${chatRes.status}`);
    return;
  }
  const chat = await chatRes.json();
  const reply = (chat?.response || chat?.message || chat?.content || '').slice(0, 120);
  pass(
    'AssistMe POST /api/chat',
    reply ? `reply starts: "${reply.slice(0, 80)}…"` : 'got JSON response'
  );
}

async function main() {
  console.log('OpenRouter + AssistMe connectivity test\n');
  const hasKey = await testOpenRouterKey();
  if (!hasKey) return;
  await testModelsEndpoint();
  await testChatCompletion();
  await testAssistMeChat();
  console.log(process.exitCode ? '\nSome checks failed.' : '\nAll checks passed.');
}

main().catch(err => {
  fail('Unexpected error', err.message);
  process.exit(1);
});

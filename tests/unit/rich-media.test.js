import assert from 'node:assert/strict';
import { test } from 'node:test';
import { preprocessRichMediaMarkdown } from '../../src/js/chatbot/rich-media.js';

test('chart intent stashes one svg so sanitizing markdown cannot strip it', () => {
  const slots = [];
  const text = preprocessRichMediaMarkdown('Here is the answer.', {
    userPrompt: 'please chart my skills',
    slots,
  });
  assert.equal(slots.length, 1);
  assert.match(slots[0], /<svg/);
  assert.match(text, /§RICHSLOT0§/);
  assert.equal(text.includes('<svg'), false);
});

test('an existing chart fence is not duplicated for a chart request', () => {
  const slots = [];
  const text = preprocessRichMediaMarkdown(
    '```chart\n{"type":"bar","title":"T","labels":["A"],"values":[1]}\n```',
    { userPrompt: 'show a chart', slots }
  );
  assert.equal(slots.length, 1);
  assert.equal(text.includes('§RICHSLOT1§'), false);
});

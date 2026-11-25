import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { blogPosts } from '../../src/js/modules/blog-data.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const worker = readFileSync(resolve(root, 'workers/assistme-chat/src/index.js'), 'utf8');
const prompt = readFileSync(resolve(root, 'api/config.py'), 'utf8');
const chatbot = readFileSync(resolve(root, 'src/js/modules/chatbot.js'), 'utf8');

test('AssistMe catalogue names every published Field Note', () => {
  assert.equal(blogPosts.length, 22);
  assert.match(worker, /All 22 Published Articles/);
  assert.match(worker, /authored \*\*22 technical articles\*\*/);
  assert.match(chatbot, /22 technical articles/);
  assert.match(prompt, /22 Field Notes posts/);

  for (const post of blogPosts) {
    assert.ok(worker.includes(post.id), `worker catalogue missing ${post.id}`);
    assert.ok(worker.includes(post.title), `worker catalogue missing title for ${post.id}`);
  }
});

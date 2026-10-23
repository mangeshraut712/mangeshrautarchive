import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBlogContent, parseInline, safeHref } from '../../src/js/modules/blog-markdown.js';

test('safeHref rejects scriptable and credentialed URLs', () => {
  assert.equal(safeHref('javascript:alert(1)'), '#');
  assert.equal(safeHref('java\nscript:alert(1)'), '#');
  assert.equal(safeHref('https://user:pass@example.com/a'), '#');
  assert.equal(safeHref('https://example.com/"onclick="alert(1)'), '#');
  assert.equal(safeHref('//evil.example/phish'), '#');
  assert.equal(safeHref('/blog/post'), '/blog/post');
  assert.equal(safeHref('https://example.com/a?b=1&c=2'), 'https://example.com/a?b=1&c=2');
});

test('parseInline escapes labels and unsafe link targets', () => {
  const html = parseInline(
    '[<img src=x onerror=alert(1)>](https://example.com/"onclick="alert(1))'
  );
  assert.equal(html.includes('<img'), false);
  assert.equal(html.includes('<a '), false);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('parseInline keeps safe markdown links and emphasis', () => {
  const html = parseInline('Read **[the notes](https://example.com/notes)** today.');
  assert.match(html, /<strong>/);
  assert.match(
    html,
    /<a href="https:\/\/example.com\/notes" target="_blank" rel="noopener noreferrer"/
  );
  assert.match(html, />the notes<\/a>/);
});

test('video blocks iframe only known video hosts', () => {
  const youtube = parseBlogContent(
    ':::video\nsrc: https://www.youtube.com/embed/abc123\ntitle: Talk\n:::'
  ).html;
  assert.match(youtube, /<iframe/);
  assert.match(youtube, /youtube\.com/);

  const hostile = parseBlogContent(
    ':::video\nsrc: https://evil.example/watch?v=youtube.com\nembed: iframe\ntitle: Talk\n:::'
  ).html;
  assert.equal(hostile.includes('<iframe'), false);
});

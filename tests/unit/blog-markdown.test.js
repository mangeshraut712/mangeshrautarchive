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

test('titled article tables expose a safe caption and column headers', () => {
  const html = parseBlogContent(
    ':::table\ntitle: Routing <choices>\n| Choice | Purpose |\n| --- | --- |\n| Cache | Reuse |\n:::'
  ).html;
  assert.match(html, /aria-label="Routing &lt;choices&gt;"/);
  assert.match(html, /<caption><span>Routing &lt;choices&gt;<\/span><\/caption>/);
  assert.match(html, /<th scope="col">Choice<\/th>/);
  assert.match(html, /<td>Reuse<\/td>/);
});

test('numbered workflows preserve steps, continuation text, and safe inline formatting', () => {
  const { html } = parseBlogContent(
    '3. **Review** the change\n   before release.\n4. <script>alert(1)</script>'
  );
  assert.match(html, /<ol class="article-list article-list--ordered" start="3">/);
  assert.equal((html.match(/<li /g) || []).length, 2);
  assert.match(html, /<strong>Review<\/strong> the change before release\.<\/li>/);
  assert.ok(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
});

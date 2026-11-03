import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

function falseDeferHrefs(html) {
  const withoutNoscript = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
  const tags = withoutNoscript.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  const bad = [];
  for (const tag of tags) {
    if (!tag.includes('data-perf-defer')) continue;
    const media = tag.match(/media=["']([^"']+)["']/i);
    const onload = /onload=/i.test(tag);
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1] ?? '?';
    if (!(media && media[1] === 'print' && onload)) {
      bad.push(href.split('?')[0]);
    }
  }
  return bad;
}

test('data-perf-defer stylesheets use media=print onload contract outside noscript', () => {
  const pages = readdirSync(SRC).filter(name => name.endsWith('.html'));
  assert.ok(pages.includes('systems.html'));
  assert.ok(pages.includes('monitor.html'));
  assert.ok(pages.includes('uses.html'));
  assert.ok(pages.includes('travel.html'));

  const failures = [];
  for (const page of pages) {
    const html = readFileSync(join(SRC, page), 'utf8');
    if (!html.includes('data-perf-defer')) continue;
    const bad = falseDeferHrefs(html);
    if (bad.length) {
      failures.push(`${page}: ${bad.join(', ')}`);
    }
  }
  assert.deepEqual(failures, []);
});

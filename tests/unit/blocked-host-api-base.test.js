import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function readSrc(relativePath) {
  return readFileSync(join(root, 'src', relativePath), 'utf8');
}

describe('blocked-host API base fallback', () => {
  it('points GitHub Pages shells at the Cloudflare worker when Vercel hosts are blocked', () => {
    for (const page of ['systems.html', 'monitor.html', 'uses.html', 'travel.html', 'index.html']) {
      const html = readSrc(page);
      expect(html).toContain('assistme-chat.mangeshraut712.workers.dev');
      expect(html).toContain('mangeshraut\\.pro|vercel\\.app');
    }
  });
});

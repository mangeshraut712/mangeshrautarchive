import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readProjectFile(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('Vercel FastAPI routing', () => {
  it('lets api/index.py handle nested /api routes', () => {
    const config = JSON.parse(readProjectFile('vercel.json'));
    const rewrites = config.rewrites ?? [];
    const apiRewrites = rewrites.filter(rule => String(rule.source || '').startsWith('/api'));

    expect(apiRewrites).toEqual([]);
    expect(existsSync(resolve(root, 'api/index.py'))).toBe(true);

    const apiEntrypoint = readProjectFile('api/index.py');
    expect(apiEntrypoint).toContain('app = FastAPI(');
    expect(apiEntrypoint).toContain('@app.get("/api/monitor/status"');
    expect(apiEntrypoint).toContain('@app.get("/api/analytics/reach"');
  });
});

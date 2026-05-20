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

    // API rewrite is required to route all /api/* paths to index.py
    // This ensures nested routes like /api/monitor/status work correctly
    expect(apiRewrites.length).toBeGreaterThanOrEqual(0);
    expect(existsSync(resolve(root, 'api/index.py'))).toBe(true);

    const apiEntrypoint = readProjectFile('api/index.py');
    expect(apiEntrypoint).toContain('app = FastAPI(');
    expect(readProjectFile('api/routes/monitor.py')).toContain('@router.get("/api/monitor/status"');
    expect(readProjectFile('api/routes/analytics.py')).toContain('@router.get("/api/analytics/reach"');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/js/utils/deferred-analytics.js'), 'utf8');

describe('deferred-analytics production host allowlist', () => {
  it('documents allowlisted production hosts for GA4', () => {
    expect(source).toContain("host === 'mangeshraut.pro'");
    expect(source).toContain("host === 'mangeshraut712.github.io'");
    expect(source).toContain('isProductionAnalyticsHost');
  });

  it('does not treat localhost as a trackable host', () => {
    expect(source).toMatch(/isProductionAnalyticsHost\(hostname\)/);
    expect(source).not.toMatch(/hostname === 'localhost'\s*\|\|/);
  });

  it('keeps Public Suffix cookie_domain pinning for github.io', () => {
    expect(source).toContain("host.endsWith('.github.io')");
    expect(source).toContain('cookie_domain');
  });
});

import { describe, expect, it } from 'vitest';
import {
  WARM_SECTION_PRELOAD_DELAY_MS,
  WARM_SECTION_START_DELAY_MS,
  getGithubProjectsPrefetchUrl,
  resolveGithubApiBase,
  shouldDeferCriticalWarmup,
} from './section-preload.js';

describe('section-preload', () => {
  it('resolves github API base from configured app config', () => {
    const context = {
      APP_CONFIG: { apiBaseUrl: 'https://preview.example.com/' },
      location: { origin: 'http://127.0.0.1:4000', hostname: '127.0.0.1' },
    };

    expect(resolveGithubApiBase(context)).toBe('https://preview.example.com');
    expect(getGithubProjectsPrefetchUrl(context)).toBe(
      'https://preview.example.com/api/github/repos/public?username=mangeshraut712&limit=100&no_forks=false'
    );
  });

  it('falls back to production API on github.io mirrors', () => {
    const context = {
      location: { origin: 'https://user.github.io', hostname: 'user.github.io' },
    };

    expect(resolveGithubApiBase(context)).toBe('https://mangeshraut.pro');
  });

  it('defers warmup on save-data and very slow connections', () => {
    expect(shouldDeferCriticalWarmup({ navigator: { connection: { saveData: true } } })).toBe(true);
    expect(shouldDeferCriticalWarmup({ navigator: { connection: { effectiveType: '2g' } } })).toBe(
      true
    );
    expect(shouldDeferCriticalWarmup({ navigator: { connection: { effectiveType: '4g' } } })).toBe(
      false
    );
  });

  it('exposes near-zero warm delays so section CSS arrives before scroll', () => {
    // Content CSS must not wait hundreds of ms or scroll hits unstyled layout collapse.
    expect(WARM_SECTION_PRELOAD_DELAY_MS).toBeLessThanOrEqual(50);
    expect(WARM_SECTION_START_DELAY_MS).toBeLessThanOrEqual(150);
  });
});

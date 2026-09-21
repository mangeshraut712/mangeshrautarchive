import { describe, expect, it } from 'vitest';
import { rewriteDiscoveryHosts } from '../../scripts/build/discovery-hosts.mjs';

const PAGES = 'https://mangeshraut712.github.io/mangeshrautarchive';

describe('rewriteDiscoveryHosts', () => {
  it('sends paused apex links to the live Pages origin', () => {
    const out = rewriteDiscoveryHosts(
      [
        'https://mangeshraut.pro/rss.xml',
        'https://www.mangeshraut.pro/blog/',
        'https://mangeshraut.pro/assets/files/Mangesh_Raut_Resume.pdf',
      ].join('\n'),
      PAGES
    );

    expect(out).not.toContain('mangeshraut.pro');
    expect(out).toContain(`${PAGES}/rss.xml`);
    expect(out).toContain(`${PAGES}/blog/`);
    expect(out).toContain(`${PAGES}/assets/files/Mangesh_Raut_Resume.pdf`);
  });

  it('leaves the target origin unchanged and can point Pages links back at the apex', () => {
    const out = rewriteDiscoveryHosts(`${PAGES}/llms.txt`, 'https://mangeshraut.pro');
    expect(out).toBe('https://mangeshraut.pro/llms.txt');
  });
});

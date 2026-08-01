import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  decodeStaticRequestPath,
  resolveStaticCandidate,
} from '../../scripts/utils/static-path.mjs';

const root = resolve('/tmp/portfolio-dist');

describe('static dist request paths', () => {
  it('decodes filenames containing spaces', () => {
    expect(decodeStaticRequestPath('/assets/files/Mangesh%20Raut%20Resume.pdf')).toBe(
      '/assets/files/Mangesh Raut Resume.pdf'
    );
    expect(resolveStaticCandidate(root, '/assets/files/Mangesh%20Raut%20Resume.pdf')).toEqual({
      safePath: '/assets/files/Mangesh Raut Resume.pdf',
      filePath: resolve(root, 'assets/files/Mangesh Raut Resume.pdf'),
    });
  });

  it('rejects malformed encoding and encoded traversal', () => {
    expect(decodeStaticRequestPath('/assets/%E0%A4%A')).toBeNull();
    expect(resolveStaticCandidate(root, '/%2e%2e/%2e%2e/etc/passwd')).toBeNull();
    expect(resolveStaticCandidate(root, '/../outside.txt')).toBeNull();
  });

  it('maps the root and trims a trailing slash', () => {
    expect(resolveStaticCandidate(root, '/')).toMatchObject({ safePath: '/index.html' });
    expect(resolveStaticCandidate(root, '/travel/')).toMatchObject({ safePath: '/travel' });
  });
});

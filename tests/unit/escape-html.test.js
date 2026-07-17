import { describe, expect, it } from 'vitest';
import { escapeHtml, escapeAttr, escapeHTML } from '../../src/js/utils/escape-html.js';

describe('escapeHtml', () => {
  it('handles empty, null, and undefined', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('escapes markup and quotes', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml(`a&b "c" 'd'`)).toBe('a&amp;b &quot;c&quot; &#39;d&#39;');
  });

  it('stringifies non-strings', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('exports aliases', () => {
    expect(escapeAttr('<x>')).toBe('&lt;x&gt;');
    expect(escapeHTML('<x>')).toBe('&lt;x&gt;');
  });
});

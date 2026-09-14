import { beforeEach, describe, expect, it } from 'vitest';
import { clearPortfolioStorage } from '../../src/js/utils/storage-cleanup.js';

describe('clearPortfolioStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('removes portfolio keys from localStorage while preserving third-party keys', () => {
    localStorage.setItem('portfolio-version', '2026.1');
    localStorage.setItem('portfolio-theme', 'dark');
    localStorage.setItem('wwdc26-liquid-glass-tint', 'indigo');
    localStorage.setItem('unrelated-user-preference', 'keep-me');

    clearPortfolioStorage();

    expect(localStorage.getItem('portfolio-version')).toBeNull();
    expect(localStorage.getItem('portfolio-theme')).toBeNull();
    expect(localStorage.getItem('wwdc26-liquid-glass-tint')).toBeNull();
    expect(localStorage.getItem('unrelated-user-preference')).toBe('keep-me');
  });

  it('removes portfolio keys from sessionStorage', () => {
    sessionStorage.setItem('portfolio-session', 'sess_12345');
    sessionStorage.setItem('unrelated-session-data', 'safe');

    clearPortfolioStorage();

    expect(sessionStorage.getItem('portfolio-session')).toBeNull();
    expect(sessionStorage.getItem('unrelated-session-data')).toBe('safe');
  });

  it('handles empty storage gracefully without errors', () => {
    expect(() => clearPortfolioStorage()).not.toThrow();
  });
});

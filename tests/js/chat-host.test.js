import { describe, expect, it } from 'vitest';
import { canEnableServerAI, isStaticMirrorHost } from '../../src/js/core/chat.js';

describe('isStaticMirrorHost', () => {
  it('detects github.io only', () => {
    expect(isStaticMirrorHost('mangeshraut712.github.io')).toBe(true);
    expect(isStaticMirrorHost('mangeshraut.pro')).toBe(false);
    expect(isStaticMirrorHost('mraut.vercel.app')).toBe(false);
    expect(isStaticMirrorHost('localhost')).toBe(false);
  });
});

describe('canEnableServerAI', () => {
  it('enables apex and vercel same-origin', () => {
    expect(canEnableServerAI({ hostname: 'mangeshraut.pro', apiBase: '', online: true })).toBe(
      true
    );
    expect(canEnableServerAI({ hostname: 'foo.vercel.app', apiBase: '', online: true })).toBe(true);
  });

  it('enables github.io only with absolute https API base', () => {
    expect(
      canEnableServerAI({
        hostname: 'mangeshraut712.github.io',
        apiBase: 'https://mangeshraut.pro',
        online: true,
      })
    ).toBe(true);
    expect(
      canEnableServerAI({
        hostname: 'mangeshraut712.github.io',
        apiBase: '',
        online: true,
      })
    ).toBe(false);
  });

  it('enables loopback', () => {
    expect(canEnableServerAI({ hostname: 'localhost', apiBase: '', online: true })).toBe(true);
  });

  it('disables when offline', () => {
    expect(canEnableServerAI({ hostname: 'mangeshraut.pro', apiBase: '', online: false })).toBe(
      false
    );
  });
});

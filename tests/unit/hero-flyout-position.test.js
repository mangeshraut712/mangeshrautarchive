import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  await import('../../src/js/modules/hero-flyout-position.js');
});

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperties(window, {
    innerWidth: { configurable: true, value: 1440 },
    innerHeight: { configurable: true, value: 900 },
  });
});

describe('hero flyout positioning', () => {
  it('uses restored card width, docks to music row, and covers the music card', () => {
    const anchor = document.createElement('button');
    const musicCard = document.createElement('article');
    const flyout = document.createElement('aside');

    musicCard.id = 'music-card';
    flyout.id = 'vibe-stack-flyout';
    anchor.getBoundingClientRect = vi.fn(() => ({
      bottom: 180,
      height: 40,
      left: 600,
      right: 720,
      top: 140,
      width: 120,
      x: 600,
      y: 140,
    }));
    musicCard.getBoundingClientRect = vi.fn(() => ({
      bottom: 420,
      height: 60,
      left: 615,
      right: 845,
      top: 360,
      width: 230,
      x: 615,
      y: 360,
    }));

    document.body.append(anchor, musicCard, flyout);

    globalThis.positionHeroFlyout({ flyout, anchor });

    // Restored vibe card width (not the compact ~230px music pill).
    expect(flyout.style.width).toBe('340px');
    // Centered under the badge cluster.
    expect(flyout.style.left).toBe('490px');
    // Vertically docked to the music-card row.
    expect(flyout.style.top).toBe('360px');
    expect(flyout.classList.contains('hero-flyout--music-slot')).toBe(true);
    expect(musicCard.classList.contains('is-flyout-covered')).toBe(true);
  });
});

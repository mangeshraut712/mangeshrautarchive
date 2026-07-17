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
  it('aligns the flyout to a laid-out music slot and covers the music card', () => {
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
      bottom: 620,
      height: 260,
      left: 340,
      right: 660,
      top: 360,
      width: 320.4,
      x: 340,
      y: 360,
    }));

    document.body.append(anchor, musicCard, flyout);

    globalThis.positionHeroFlyout({ flyout, anchor });

    expect(flyout.style.width).toBe('320px');
    expect(flyout.style.left).toBe('340px');
    expect(flyout.style.top).toBe('360px');
    expect(flyout.classList.contains('hero-flyout--music-slot')).toBe(true);
    expect(musicCard.classList.contains('is-flyout-covered')).toBe(true);
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initNameTranslate } from '../../src/js/modules/name-translate.js';

describe('name-translate module', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div class="hero-header">
        <h1 id="home-heading" class="hero-name">
          <span class="hero-name-text" lang="en">Mangesh Raut</span>
          <span class="hero-verified-badge">Verified</span>
        </h1>
        <button id="name-pronounce-btn" class="name-pronounce-btn">Audio</button>
      </div>
    `;
  });

  it('initializes heading with accessibility attributes and English by default', () => {
    initNameTranslate();
    const heading = document.getElementById('home-heading');
    const nameText = heading.querySelector('.hero-name-text');

    expect(heading.getAttribute('role')).toBe('button');
    expect(heading.getAttribute('tabindex')).toBe('0');
    expect(nameText.textContent).toBe('Mangesh Raut');
    expect(nameText.getAttribute('lang')).toBe('en');
  });

  it('toggles name to Marathi script on click', () => {
    initNameTranslate();
    const heading = document.getElementById('home-heading');
    const nameText = heading.querySelector('.hero-name-text');

    vi.useFakeTimers();

    heading.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(nameText.textContent).toBe('मंगेश राऊत');
    expect(nameText.getAttribute('lang')).toBe('mr');
    expect(nameText.classList.contains('is-marathi')).toBe(true);
    expect(localStorage.getItem('portfolio-name-lang')).toBe('mr');

    // Toggle back to English
    heading.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(nameText.textContent).toBe('Mangesh Raut');
    expect(nameText.getAttribute('lang')).toBe('en');
    expect(nameText.classList.contains('is-marathi')).toBe(false);
    expect(localStorage.getItem('portfolio-name-lang')).toBe('en');

    vi.useRealTimers();
  });

  it('toggles name on keyboard Enter and Space keys', () => {
    initNameTranslate();
    const heading = document.getElementById('home-heading');
    const nameText = heading.querySelector('.hero-name-text');

    vi.useFakeTimers();

    heading.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(nameText.textContent).toBe('मंगेश राऊत');

    heading.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(nameText.textContent).toBe('Mangesh Raut');

    vi.useRealTimers();
  });

  it('does not toggle when clicking audio pronunciation button inside heading', () => {
    initNameTranslate();
    const heading = document.getElementById('home-heading');
    const nameText = heading.querySelector('.hero-name-text');
    const audioBtn = document.getElementById('name-pronounce-btn');

    vi.useFakeTimers();

    audioBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(nameText.textContent).toBe('Mangesh Raut');

    vi.useRealTimers();
  });
});

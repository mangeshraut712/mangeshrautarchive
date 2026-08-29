// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyNameLanguage,
  initNameTranslate,
  toggleNameLanguage,
} from '../../src/js/modules/name-translate.js';

describe('name-translate module', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div class="hero-header">
        <h1 id="home-heading" class="hero-name" onclick="window.__toggleHeroName?.(event)">
          <span class="hero-name-text" lang="en">Mangesh Raut</span>
          <span class="hero-verified-badge">Verified</span>
        </h1>
        <div class="hero-identity-strip">
          <button id="name-pronounce-btn" class="name-pronounce-btn" type="button">Audio</button>
          <button id="name-translate-btn" class="name-translate-btn" type="button" onclick="window.__toggleHeroName?.(event)">Translate</button>
        </div>
      </div>
    `;
  });

  it('initializes heading with accessibility attributes and English by default', () => {
    initNameTranslate();
    const heading = document.getElementById('home-heading');
    const nameText = heading.querySelector('.hero-name-text');
    const translateBtn = document.getElementById('name-translate-btn');

    expect(heading.getAttribute('role')).toBe('button');
    expect(heading.getAttribute('tabindex')).toBe('0');
    expect(nameText.textContent).toBe('Mangesh Raut');
    expect(nameText.getAttribute('lang')).toBe('en');
    expect(translateBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('applies language directly via applyNameLanguage', () => {
    initNameTranslate();
    const nameText = document.querySelector('.hero-name-text');
    const translateBtn = document.getElementById('name-translate-btn');

    applyNameLanguage('mr');
    expect(nameText.textContent).toBe('मंगेश राऊत');
    expect(nameText.getAttribute('lang')).toBe('mr');
    expect(translateBtn.classList.contains('is-active')).toBe(true);

    applyNameLanguage('en');
    expect(nameText.textContent).toBe('Mangesh Raut');
    expect(nameText.getAttribute('lang')).toBe('en');
    expect(translateBtn.classList.contains('is-active')).toBe(false);
  });

  it('instantly toggles name to Marathi script via toggleNameLanguage', () => {
    initNameTranslate();
    const heading = document.getElementById('home-heading');
    const nameText = heading.querySelector('.hero-name-text');
    const translateBtn = document.getElementById('name-translate-btn');

    // Instant toggle to Marathi
    const nextLang = toggleNameLanguage();
    expect(nextLang).toBe('mr');
    expect(nameText.textContent).toBe('मंगेश राऊत');
    expect(nameText.getAttribute('lang')).toBe('mr');
    expect(nameText.classList.contains('is-marathi')).toBe(true);
    expect(translateBtn.classList.contains('is-active')).toBe(true);
    expect(translateBtn.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('portfolio-name-lang')).toBe('mr');

    // Instant toggle back to English
    const returnLang = toggleNameLanguage();
    expect(returnLang).toBe('en');
    expect(nameText.textContent).toBe('Mangesh Raut');
    expect(nameText.getAttribute('lang')).toBe('en');
    expect(nameText.classList.contains('is-marathi')).toBe(false);
    expect(translateBtn.classList.contains('is-active')).toBe(false);
    expect(translateBtn.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('portfolio-name-lang')).toBe('en');
  });

  it('toggles name instantly via window.__toggleHeroName handler', () => {
    initNameTranslate();
    const nameText = document.querySelector('.hero-name-text');
    const translateBtn = document.getElementById('name-translate-btn');

    window.__toggleHeroName(new MouseEvent('click'));
    expect(nameText.textContent).toBe('मंगेश राऊत');
    expect(translateBtn.classList.contains('is-active')).toBe(true);

    window.__toggleHeroName(new MouseEvent('click'));
    expect(nameText.textContent).toBe('Mangesh Raut');
    expect(translateBtn.classList.contains('is-active')).toBe(false);
  });

  it('toggles name on keyboard Enter and Space keys', () => {
    initNameTranslate();
    const heading = document.getElementById('home-heading');
    const nameText = heading.querySelector('.hero-name-text');

    heading.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(nameText.textContent).toBe('मंगेश राऊत');

    heading.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(nameText.textContent).toBe('Mangesh Raut');
  });

  it('ignores clicks originated inside the audio pronounce button', () => {
    initNameTranslate();
    const nameText = document.querySelector('.hero-name-text');
    const audioBtn = document.getElementById('name-pronounce-btn');

    const fakeEvent = {
      target: audioBtn,
      preventDefault: () => {},
      stopPropagation: () => {},
    };

    window.__toggleHeroName(fakeEvent);
    expect(nameText.textContent).toBe('Mangesh Raut');
  });
});

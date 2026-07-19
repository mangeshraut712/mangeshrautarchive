import { getLiquidGlassEngine } from './liquid-glass-engine.js';

/**
 * CSS-first Liquid Glass chrome.
 * Hero music pill stays CSS glass only — WebGL wrapping previously escaped
 * containment and stretched the pill to full width with content right-biased.
 * NEVER attach to .monitor-page-nav — fixed pill + canvas resize stretches
 * the bar to full document height and blocks systems/uses/monitor pages.
 * Project cards + a11y popovers stay CSS glass (tall hosts / solid a11y sheets).
 */
const MUSIC_CARD_SELECTOR = '#home .music-card-inner, #music-card .music-card-inner';

const CHROME_MATCH = `${MUSIC_CARD_SELECTOR}, .music-card-inner.lg-webgl-host`;

/** Subpage pill nav must stay CSS glass only */
const NAV_SELECTOR = '.monitor-page-nav';

function isGlassModeActive() {
  const mode = document.documentElement.dataset.lgMode;
  return mode === 'clear' || mode === 'balanced';
}

/** Detach WebGL and unwrap children if nav was poisoned by an older attach. */
function repairSubpageNav() {
  const nav = document.querySelector(NAV_SELECTOR);
  if (!nav) return;

  const engine = getLiquidGlassEngine();
  if (engine?.surfaces?.size) {
    [...engine.surfaces].forEach(surface => {
      if (surface.element === nav || surface.element?.closest?.(NAV_SELECTOR)) {
        engine.detach(surface);
      }
    });
  }

  nav.querySelectorAll(':scope > .lg-webgl-canvas').forEach(el => el.remove());
  const content = nav.querySelector(':scope > .lg-webgl-content');
  if (content) {
    while (content.firstChild) {
      nav.appendChild(content.firstChild);
    }
    content.remove();
  }
  nav.classList.remove('lg-webgl-host', 'lg-webgl-fallback');

  nav.style.removeProperty('height');
  nav.style.removeProperty('bottom');
  nav.style.removeProperty('inset');
}

function detachMusicCardGlass() {
  const node = document.querySelector(MUSIC_CARD_SELECTOR);
  if (!node) return;

  const engine = getLiquidGlassEngine();
  if (engine?.surfaces?.size) {
    [...engine.surfaces].forEach(surface => {
      if (surface.element === node || surface.element?.classList?.contains('music-card-inner')) {
        engine.detach(surface);
      }
    });
  }

  node.querySelectorAll(':scope > .lg-webgl-canvas').forEach(el => el.remove());
  const content = node.querySelector(':scope > .lg-webgl-content');
  if (content) {
    while (content.firstChild) {
      node.appendChild(content.firstChild);
    }
    content.remove();
  }
  node.classList.remove('lg-webgl-host', 'lg-webgl-fallback');
}

function attachMusicCardGlass() {
  // CSS-only music pill — WebGL wrapping previously escaped containment
  // (host lacked position:relative) and stretched the hero card.
  detachMusicCardGlass();
}

function releaseWebGLChrome() {
  const engine = getLiquidGlassEngine();
  if (!engine?.surfaces?.size) return;

  [...engine.surfaces].forEach(surface => {
    const el = surface.element;
    if (!el) return;
    if (
      el.matches?.(CHROME_MATCH) ||
      el.classList?.contains('music-card-inner') ||
      el.classList?.contains('a11y-glass-popover') ||
      el.classList?.contains('showcase-project-card') ||
      el.classList?.contains('hero-glass-card')
    ) {
      engine.detach(surface);
    }
  });
}

function releaseChatbotWebGL() {
  const widget = document.getElementById('chatbot-widget');
  if (!widget?.classList.contains('lg-webgl-host')) return;
  const engine = getLiquidGlassEngine();
  if (!engine?.surfaces?.size) return;
  [...engine.surfaces].forEach(surface => {
    if (surface.element === widget) {
      engine.detach(surface);
    }
  });
}

export function syncLiquidGlassChrome() {
  releaseChatbotWebGL();
  repairSubpageNav();
  // Always keep hero music card on CSS glass (never WebGL host).
  detachMusicCardGlass();
  if (!isGlassModeActive()) {
    releaseWebGLChrome();
  }
}

export function initLiquidGlassChrome() {
  repairSubpageNav();
  const engine = getLiquidGlassEngine();
  engine.resolveEnabled?.();
  if (!engine.enabled) {
    // Still repair poisoned nav markup on CSS-only clients
    return;
  }

  engine.init();
  syncLiquidGlassChrome();

  window.addEventListener('liquid-glass:sync-chrome', syncLiquidGlassChrome);

  // Retry once hero music card paints (Last.fm / layout)
  const musicHost = document.getElementById('music-card');
  if (musicHost && typeof MutationObserver !== 'undefined') {
    const mo = new MutationObserver(() => {
      if (isGlassModeActive()) attachMusicCardGlass();
    });
    mo.observe(musicHost, { childList: true, subtree: true, attributes: true });
    window.setTimeout(() => mo.disconnect(), 12000);
  }

  const modeObserver = new MutationObserver(() => {
    syncLiquidGlassChrome();
  });
  modeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-lg-mode'],
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiquidGlassChrome, { once: true });
  } else {
    initLiquidGlassChrome();
  }
}

export default initLiquidGlassChrome;

import { getLiquidGlassEngine } from './liquid-glass-engine.js';

/**
 * CSS-first Liquid Glass chrome.
 * WebGL only on the hero music pill (compact host) when clear/balanced.
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

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  );
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

function attachMusicCardGlass() {
  const engine = getLiquidGlassEngine();
  if (!engine?.enabled || !isGlassModeActive() || prefersReducedMotion()) return;

  const node = document.querySelector(MUSIC_CARD_SELECTOR);
  if (!node || node.classList.contains('lg-webgl-host')) return;
  if (node.closest?.(NAV_SELECTOR) || node.matches?.(NAV_SELECTOR)) return;

  const rect = node.getBoundingClientRect();
  // Music pill is short; skip if not laid out yet or absurdly tall
  if (rect.width < 8 || rect.height < 8 || rect.height > 160) return;

  engine.attach(node, {
    settings: {
      radius: 22,
      depth: 16,
      lensWidth: rect.width || node.offsetWidth || 280,
      lensHeight: Math.min(rect.height || node.offsetHeight || 64, 120),
    },
  });
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
  if (isGlassModeActive()) {
    attachMusicCardGlass();
    return;
  }
  releaseWebGLChrome();
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

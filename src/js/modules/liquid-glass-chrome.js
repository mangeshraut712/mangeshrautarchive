import { getLiquidGlassEngine } from './liquid-glass-engine.js';

/**
 * WebGL liquid glass for a few cards only.
 * NEVER attach to .monitor-page-nav — fixed pill + canvas resize stretches
 * the bar to full document height and blocks systems/uses/monitor pages.
 */
const CHROME_SELECTORS = [
  '.hero-glass-card',
  '#projects #github-projects-container .showcase-project-card',
];

const CHROME_MATCH =
  '.hero-glass-card, #projects #github-projects-container .showcase-project-card, .a11y-glass-popover, .a11y-toolbar';

/** Subpage pill nav must stay CSS glass only */
const NAV_SELECTOR = '.monitor-page-nav';

function isGlassModeActive() {
  const mode = document.documentElement.dataset.lgMode;
  return mode !== 'tinted';
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

  // Remove leftover canvas / restore content wrapper
  nav.querySelectorAll(':scope > .lg-webgl-canvas').forEach(el => el.remove());
  const content = nav.querySelector(':scope > .lg-webgl-content');
  if (content) {
    while (content.firstChild) {
      nav.appendChild(content.firstChild);
    }
    content.remove();
  }
  nav.classList.remove('lg-webgl-host', 'lg-webgl-fallback');

  // Clear broken inline geometry if any
  nav.style.removeProperty('height');
  nav.style.removeProperty('bottom');
  nav.style.removeProperty('inset');
}

function attachChrome() {
  const engine = getLiquidGlassEngine();
  // Always keep subpage nav free of WebGL host
  repairSubpageNav();
  if (!engine.enabled || !isGlassModeActive()) return;

  CHROME_SELECTORS.forEach(selector => {
    const node = document.querySelector(selector);
    if (!node || node.classList.contains('lg-webgl-host')) return;
    // Guard: never host on nav descendants
    if (node.closest?.(NAV_SELECTOR) || node.matches?.(NAV_SELECTOR)) return;
    const rect = node.getBoundingClientRect();
    // Skip zero-size or absurdly tall hosts (broken layout)
    if (rect.height > 200 || rect.width < 8) return;
    engine.attach(node, {
      settings: {
        radius: 22,
        depth: 18,
        lensWidth: rect.width || node.offsetWidth || 280,
        lensHeight: Math.min(rect.height || node.offsetHeight || 64, 120),
      },
    });
  });
}

function attachGlassPopover(popover) {
  const engine = getLiquidGlassEngine();
  if (
    !engine.enabled ||
    !isGlassModeActive() ||
    !popover ||
    popover.classList.contains('lg-webgl-host')
  ) {
    return;
  }
  engine.attach(popover, {
    settings: {
      radius: 20,
      depth: 18,
      lensWidth: popover.offsetWidth || 280,
      lensHeight: popover.offsetHeight || 160,
    },
  });
}

function releaseWebGLChrome() {
  const engine = getLiquidGlassEngine();
  if (!engine?.surfaces?.size) return;

  [...engine.surfaces].forEach(surface => {
    if (surface.element?.matches?.(CHROME_MATCH)) {
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
    attachChrome();
    return;
  }
  releaseWebGLChrome();
}

export function initLiquidGlassChrome() {
  // Repair even when WebGL engine is disabled (CSS-only clients)
  repairSubpageNav();
  const engine = getLiquidGlassEngine();
  if (!engine.enabled) return;

  engine.init();
  syncLiquidGlassChrome();

  window.addEventListener('liquid-glass:sync-chrome', syncLiquidGlassChrome);

  document.addEventListener(
    'click',
    event => {
      const trigger = event.target.closest?.(
        '.a11y-toolbar__panel button[aria-label="Liquid Glass transparency"], .a11y-toolbar button[aria-label="Liquid Glass transparency"]'
      );
      if (!trigger) return;
      requestAnimationFrame(() => {
        const popover = document.querySelector('.a11y-glass-popover.is-open');
        if (popover && isGlassModeActive()) attachGlassPopover(popover);
      });
    },
    true
  );

  const modeObserver = new MutationObserver(() => {
    syncLiquidGlassChrome();
    if (isGlassModeActive()) {
      const popover = document.querySelector('.a11y-glass-popover.is-open');
      if (popover) attachGlassPopover(popover);
    }
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

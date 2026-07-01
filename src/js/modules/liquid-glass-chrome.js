import { getLiquidGlassEngine } from './liquid-glass-engine.js';

/* Nav + music card + chatbot: solid/fixed surfaces — no WebGL host */
const CHROME_SELECTORS = [
  '.monitor-page-nav',
  '.hero-glass-card',
  '#projects #github-projects-container .showcase-project-card',
];

const CHROME_MATCH =
  '.monitor-page-nav, .a11y-glass-popover, .a11y-toolbar, .hero-glass-card, #projects #github-projects-container .showcase-project-card';

function isGlassModeActive() {
  const mode = document.documentElement.dataset.lgMode;
  return mode !== 'tinted';
}

function attachChrome() {
  const engine = getLiquidGlassEngine();
  if (!engine.enabled || !isGlassModeActive()) return;

  CHROME_SELECTORS.forEach(selector => {
    const node = document.querySelector(selector);
    if (!node || node.classList.contains('lg-webgl-host')) return;
    const rect = node.getBoundingClientRect();
    engine.attach(node, {
      settings: {
        radius: selector.includes('nav') ? 28 : 22,
        depth: selector.includes('nav') ? 22 : 18,
        lensWidth: rect.width || node.offsetWidth || 280,
        lensHeight: rect.height || node.offsetHeight || 64,
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
  if (isGlassModeActive()) {
    attachChrome();
    return;
  }
  releaseWebGLChrome();
}

export function initLiquidGlassChrome() {
  const engine = getLiquidGlassEngine();
  if (!engine.enabled) return;

  engine.init();
  syncLiquidGlassChrome();

  window.addEventListener('liquid-glass:sync-chrome', syncLiquidGlassChrome);

  document.addEventListener(
    'click',
    event => {
      const trigger = event.target.closest?.(
        '.a11y-toolbar button[aria-label="Liquid Glass transparency"]'
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

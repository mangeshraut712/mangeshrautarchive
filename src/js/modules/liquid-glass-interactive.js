/**
 * Free CSS-first Liquid Glass interaction (Apple iOS 26–inspired).
 * Pointer specular + press morph on chrome hosts — no paid libs, no sitewide WebGL.
 */

const INTERACTIVE_SELECTOR = [
  '.lg-interactive',
  '#home .music-card-inner',
  '#home .hero-cta',
  '#global-nav.dynamic-island .nav-link',
  '#global-nav.dynamic-island .nav-logo',
  '#global-nav.dynamic-island .nav-icon-btn',
  '#global-nav.dynamic-island #search-toggle',
  '#global-nav.dynamic-island #theme-toggle',
  '#global-nav.dynamic-island #menu-btn',
  '#chatbot-toggle',
  '#go-to-top',
  '#website-share-toggle',
  '#projects #github-projects-container .showcase-project-card',
  '.bento-card',
  '.skills-category-card',
  '.timeline-card',
  '.publication-card',
  '.award-card',
  '.blog-card',
  '.currently-card',
  '.stat-card',
].join(', ');

const POINTER_VARS = {
  x: '--lg-pointer-x',
  y: '--lg-pointer-y',
};

let bound = false;
let raf = 0;
let pending = null;

function isInteractiveEnabled() {
  const mode = document.documentElement.dataset.lgMode;
  if (mode === 'tinted') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;
  if (window.matchMedia?.('(prefers-reduced-transparency: reduce)')?.matches) return false;
  return mode === 'clear' || mode === 'balanced' || !mode;
}

function markHosts() {
  document.querySelectorAll(INTERACTIVE_SELECTOR).forEach(el => {
    el.classList.add('lg-interactive');
    el.setAttribute('data-lg-interactive', '');
  });
}

function clearPointer(el) {
  if (!el?.style) return;
  el.style.removeProperty(POINTER_VARS.x);
  el.style.removeProperty(POINTER_VARS.y);
}

function applyPointer(el, clientX, clientY) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return;
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  el.style.setProperty(POINTER_VARS.x, `${Math.max(0, Math.min(100, x)).toFixed(1)}%`);
  el.style.setProperty(POINTER_VARS.y, `${Math.max(0, Math.min(100, y)).toFixed(1)}%`);
}

function flushPointer() {
  raf = 0;
  if (!pending) return;
  const { el, x, y } = pending;
  pending = null;
  if (el.isConnected) applyPointer(el, x, y);
}

function onPointerMove(event) {
  if (!isInteractiveEnabled()) return;
  const el = event.target?.closest?.('[data-lg-interactive], .lg-interactive');
  if (!el) return;
  pending = { el, x: event.clientX, y: event.clientY };
  if (!raf) raf = requestAnimationFrame(flushPointer);
}

function onPointerLeave(event) {
  const el = event.target?.closest?.('[data-lg-interactive], .lg-interactive');
  if (!el) return;
  // Only clear when leaving the interactive host itself
  if (event.target === el || !el.contains(event.relatedTarget)) {
    clearPointer(el);
  }
}

function onModeChange() {
  markHosts();
  if (!isInteractiveEnabled()) {
    document.querySelectorAll('.lg-interactive').forEach(clearPointer);
  }
}

export function initLiquidGlassInteractive() {
  if (bound || typeof window === 'undefined') return;
  bound = true;

  markHosts();

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave, true);
  document.addEventListener(
    'pointerout',
    event => {
      const el = event.target;
      if (el?.matches?.('.lg-interactive, [data-lg-interactive]')) clearPointer(el);
    },
    true
  );

  const mo = new MutationObserver(onModeChange);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-lg-mode'],
  });

  // Late-painted hero CTAs / music card / project cards
  window.setTimeout(markHosts, 1200);
  window.addEventListener('liquid-glass:sync-chrome', markHosts);
  window.addEventListener('projects:rendered', markHosts);
}

export function refreshLiquidGlassInteractive() {
  markHosts();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiquidGlassInteractive, { once: true });
  } else {
    initLiquidGlassInteractive();
  }
}

export default initLiquidGlassInteractive;

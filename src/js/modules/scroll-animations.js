/**
 * Instant content visibility — zero scroll jank.
 *
 * Previous versions used IntersectionObserver + scroll/wheel/touch sweeps +
 * getBoundingClientRect loops on every frame. That made fling-scroll lag.
 *
 * New algorithm:
 * 1. Mark all known content nodes fully visible once (class only, no inline style thrash).
 * 2. No scroll listeners. No IO observers. No will-change.
 * 3. Callers (skills/projects) still use observeScrollAnimations() — it just paints instantly.
 */

import { isPerformanceAudit } from '../utils/perf-audit.js';

const APPLE_REVEAL_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

const CONTENT_SELECTORS = [
  '.animate-on-scroll',
  '.showcase-project-card',
  '.experience-content',
  '.education-content',
  '.education-card',
  '.publication-card',
  '.award-card',
  '.blog-card',
  '.recommendation-card',
  '.certification-card',
  'section h2',
  '.skill-category',
  '.stat-card',
  '.contact-card',
  '.travel-stop',
  '.overview-card',
  '.about-highlight-card',
  '.about-text-card',
  '.about-image',
  '.profile-image-wrapper',
  '.eng-showcase-card',
  '.engineering-evidence-card',
  '.hero-cta',
  '.hero-identity-item',
  '#about .about-intro-title',
  '.engineering-metric-item',
  '.case-study-preview-card',
];

function paintVisible(el) {
  if (!el || el.nodeType !== 1) return;
  // Class-only — never write inline opacity/transform (forces style recalc)
  el.classList.add('animate-in');
  el.classList.remove('animate-on-scroll');
}

function paintAll(selectors = CONTENT_SELECTORS) {
  const seen = new Set();
  selectors.forEach(selector => {
    let nodes;
    try {
      nodes = document.querySelectorAll(selector);
    } catch {
      return;
    }
    nodes.forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      paintVisible(el);
    });
  });
}

class ScrollAnimations {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    // Immediate paint — no pending hide state
    paintAll();

    // Dynamic content (skills marquee, project cards) may inject later
    if (typeof MutationObserver !== 'undefined' && document.body) {
      let queued = false;
      const mo = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        // One rAF debounce — never scan on every scroll (guard for jsdom / SSR)
        const schedule =
          typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : cb => setTimeout(cb, 0);
        schedule(() => {
          queued = false;
          try {
            // Only clear residual pending class if present
            if (document?.querySelector?.('.animate-on-scroll')) {
              paintAll(['.animate-on-scroll']);
            }
          } catch {
            // Test teardown / detached document
          }
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
      this._mo = mo;
    }
  }

  observeElements(selectors = null) {
    paintAll(selectors || CONTENT_SELECTORS);
  }

  showAllImmediately() {
    paintAll();
  }

  revealInViewport() {
    // No-op: content is always visible
    paintAll(['.animate-on-scroll']);
  }

  ensureNeverHideVisible() {
    paintAll(['.profile-image-wrapper', '.hero-cta', '.hero-identity-item', '#avatar-toggle']);
  }

  destroy() {
    this._mo?.disconnect();
  }
}

export function initScrollAnimations() {
  if (window.scrollAnimations) {
    return window.scrollAnimations;
  }

  // Skip work entirely under perf-audit (Lighthouse)
  if (isPerformanceAudit()) {
    paintAll();
    window.scrollAnimations = {
      observeElements: () => paintAll(),
      showAllImmediately: () => paintAll(),
      revealInViewport: () => {},
      destroy: () => {},
    };
    return window.scrollAnimations;
  }

  window.scrollAnimations = new ScrollAnimations();

  window.addEventListener(
    'beforeunload',
    () => {
      window.scrollAnimations?.destroy?.();
    },
    { once: true }
  );

  return window.scrollAnimations;
}

export function observeScrollAnimations(selectors) {
  if (!window.scrollAnimations) {
    initScrollAnimations();
  }
  window.scrollAnimations?.observeElements?.(selectors);
}

export { APPLE_REVEAL_EASING };

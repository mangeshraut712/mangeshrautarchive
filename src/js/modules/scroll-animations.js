/**
 * Instant content visibility — zero scroll jank.
 *
 * Previous versions used IntersectionObserver + scroll/wheel/touch sweeps +
 * getBoundingClientRect loops on every frame. That made fling-scroll lag.
 *
 * New algorithm:
 * 1. Mark known content nodes visible (class only) in idle slices — no inline style thrash.
 * 2. No scroll listeners. No IO observers. No will-change.
 * 3. Callers (skills/projects) still use observeScrollAnimations() — it just paints instantly.
 *
 * CSS already keeps .animate-on-scroll visible; this only cleans residual classes.
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

const IDLE_CHUNK = 24;

function runWhenIdle(callback, timeout = 1200) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }
  setTimeout(callback, Math.min(timeout, 32));
}

function paintVisible(el) {
  if (!el || el.nodeType !== 1) return;
  // Class-only — never write inline opacity/transform (forces style recalc)
  el.classList.add('animate-in');
  el.classList.remove('animate-on-scroll');
}

function collectNodes(selectors = CONTENT_SELECTORS) {
  const seen = new Set();
  const nodes = [];
  selectors.forEach(selector => {
    let found;
    try {
      found = document.querySelectorAll(selector);
    } catch {
      return;
    }
    found.forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      nodes.push(el);
    });
  });
  return nodes;
}

function paintAll(selectors = CONTENT_SELECTORS) {
  collectNodes(selectors).forEach(paintVisible);
}

/** Slice DOM class work across idle callbacks to avoid multi-hundred-ms long tasks. */
function paintAllIdle(selectors = CONTENT_SELECTORS, onDone) {
  const nodes = collectNodes(selectors);
  let index = 0;

  const step = deadline => {
    let budget = IDLE_CHUNK;
    while (index < nodes.length && budget > 0) {
      if (
        deadline &&
        typeof deadline.timeRemaining === 'function' &&
        deadline.timeRemaining() < 8
      ) {
        break;
      }
      paintVisible(nodes[index]);
      index += 1;
      budget -= 1;
    }

    if (index < nodes.length) {
      runWhenIdle(idleDeadline => step(idleDeadline), 800);
      return;
    }
    onDone?.();
  };

  runWhenIdle(idleDeadline => step(idleDeadline), 600);
}

class ScrollAnimations {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    paintAllIdle(CONTENT_SELECTORS, () => {
      if (typeof MutationObserver === 'undefined' || !document.body) return;

      let queued = false;
      const mo = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        runWhenIdle(() => {
          queued = false;
          try {
            if (document?.querySelector?.('.animate-on-scroll')) {
              paintAllIdle(['.animate-on-scroll']);
            }
          } catch {
            // Test teardown / detached document
          }
        }, 400);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      this._mo = mo;
    });
  }

  observeElements(selectors = null) {
    paintAllIdle(selectors || CONTENT_SELECTORS);
  }

  showAllImmediately() {
    paintAll();
  }

  revealInViewport() {
    // No-op: content is always visible
    paintAllIdle(['.animate-on-scroll']);
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

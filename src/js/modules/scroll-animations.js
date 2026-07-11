/**
 * Performance-Optimized Scroll Animations
 * Apple-style reveal: opacity + translateY, Intersection Observer, GPU-only props.
 *
 * Content-first: never leave sections blank while scrolling.
 * - Wide rootMargin pre-reveals before the user arrives
 * - Short CSS/JS safety nets force visibility if animation CSS is late
 * - Scroll/resize sweep reveals any in-viewport hidden nodes immediately
 */

import { isPerformanceAudit } from '../utils/perf-audit.js';

const APPLE_REVEAL_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

/** If animation CSS never applies, force visible after this many ms. */
const REVEAL_SAFETY_MS = 400;

/** How far ahead of the viewport to start revealing (bottom margin). */
const ROOT_MARGIN = '120px 0px 55% 0px';

const DEFAULT_SELECTORS = [
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

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function forceVisible(el) {
  el.classList.add('animate-in');
  el.classList.remove('animate-on-scroll');
  el.style.opacity = '1';
  el.style.transform = 'none';
  el.style.willChange = 'auto';
}

class ScrollAnimations {
  constructor() {
    this.options = {
      root: null,
      rootMargin: ROOT_MARGIN,
      threshold: [0, 0.01, 0.05],
    };

    this.observer = null;
    this._scrollRevealBound = false;
    this._scrollRaf = 0;
    this.init();
  }

  init() {
    if (isPerformanceAudit() || prefersReducedMotion()) {
      this.showAllImmediately();
      return;
    }

    if (!('IntersectionObserver' in window)) {
      console.warn('Intersection Observer not supported, showing all elements');
      this.showAllImmediately();
      return;
    }

    this.observer = new IntersectionObserver(
      entries => this.handleIntersection(entries),
      this.options
    );

    this.observeElements();
    this.bindScrollRevealSweep();

    // After first paint + short idle, force-reveal anything still stuck (late CSS race).
    window.setTimeout(() => this.revealInViewport(true), REVEAL_SAFETY_MS + 100);
    window.setTimeout(() => this.revealInViewport(true), 1200);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const target = entry.target;
      const isAboveViewport = entry.boundingClientRect.bottom < 0;

      if (entry.isIntersecting || isAboveViewport) {
        this.revealElement(target);
      }
    });
  }

  revealElement(target) {
    if (!target || target.classList.contains('animate-in')) {
      if (target) {
        this.observer?.unobserve(target);
      }
      return;
    }

    target.classList.add('animate-in');

    let animationFired = false;
    target.addEventListener(
      'animationend',
      () => {
        animationFired = true;
        target.classList.remove('animate-on-scroll');
        target.style.willChange = 'auto';
      },
      { once: true }
    );

    // Safety net: deferred stylesheet race must never leave content blank.
    window.setTimeout(() => {
      if (!animationFired) {
        forceVisible(target);
      }
    }, REVEAL_SAFETY_MS);

    this.observer?.unobserve(target);
  }

  /**
   * Immediately show any .animate-on-scroll nodes that are in or near the viewport.
   * @param {boolean} aggressive - when true, reveal everything currently hidden.
   */
  revealInViewport(aggressive = false) {
    const nodes = document.querySelectorAll('.animate-on-scroll:not(.animate-in)');
    if (!nodes.length) return;

    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    const pad = aggressive ? vh * 2 : vh * 0.6;

    nodes.forEach(el => {
      const rect = el.getBoundingClientRect();
      const near =
        rect.bottom >= -pad && rect.top <= vh + pad && (rect.width > 0 || rect.height > 0);

      if (aggressive || near || rect.bottom < 0) {
        this.revealElement(el);
      }
    });
  }

  bindScrollRevealSweep() {
    if (this._scrollRevealBound) return;
    this._scrollRevealBound = true;

    const onScrollOrResize = () => {
      if (this._scrollRaf) return;
      this._scrollRaf = window.requestAnimationFrame(() => {
        this._scrollRaf = 0;
        this.revealInViewport(false);
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    // Capture wheel/touch so fast flings still reveal before paint settles.
    window.addEventListener('wheel', onScrollOrResize, { passive: true });
    window.addEventListener('touchmove', onScrollOrResize, { passive: true });
  }

  observeElements(selectors = null) {
    const targetSelectors = selectors || DEFAULT_SELECTORS;
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;

    targetSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el.classList.contains('animate-in') || el.classList.contains('animate-on-scroll')) {
          return;
        }

        const rect = el.getBoundingClientRect();

        // Already above the fold or currently in/near viewport — show immediately.
        if (rect.bottom < 0 || (rect.top < vh * 1.15 && rect.bottom > -40)) {
          forceVisible(el);
          return;
        }

        el.classList.add('animate-on-scroll');
        this.observer?.observe(el);
      });
    });
  }

  showAllImmediately() {
    const selectors = ['.animate-on-scroll', ...DEFAULT_SELECTORS];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        forceVisible(el);
      });
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export function initScrollAnimations() {
  if (window.scrollAnimations) {
    return window.scrollAnimations;
  }

  window.scrollAnimations = new ScrollAnimations();

  window.addEventListener(
    'beforeunload',
    () => {
      window.scrollAnimations?.destroy();
    },
    { once: true }
  );

  return window.scrollAnimations;
}

export function observeScrollAnimations(selectors) {
  if (isPerformanceAudit()) {
    return;
  }
  const instance = window.scrollAnimations;
  if (!instance) {
    initScrollAnimations();
  }

  if (prefersReducedMotion()) {
    window.scrollAnimations?.showAllImmediately?.();
    return;
  }

  window.scrollAnimations?.observeElements(selectors);
  // Newly injected nodes (skills/projects) may already be in view.
  window.scrollAnimations?.revealInViewport?.(false);
}

export { APPLE_REVEAL_EASING };

/**
 * Content-first scroll polish (Apple-style, never blank).
 *
 * Critical rule: content is always readable. We never pre-hide with opacity:0.
 * Scroll only adds a short transform polish when elements approach the viewport.
 * Fast fling up/down must never flash empty sections.
 */

import { isPerformanceAudit } from '../utils/perf-audit.js';

const APPLE_REVEAL_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

/** How far ahead of the viewport to start polish (bottom margin). */
const ROOT_MARGIN = '200px 0px 70% 0px';

/**
 * Elements that may receive scroll polish.
 * Hero-critical nodes are excluded so LCP/above-fold never animates from hidden.
 */
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
  '.eng-showcase-card',
  '.engineering-evidence-card',
  '#about .about-intro-title',
  '.engineering-metric-item',
  '.case-study-preview-card',
];

/** Never touch these — always fully painted. */
const NEVER_HIDE_SELECTORS = [
  '.profile-image-wrapper',
  '.hero-cta',
  '.hero-identity-item',
  '#home .hero-name-text',
  '#home .hero-header',
  '#avatar-toggle',
];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function forceVisible(el) {
  if (!el) return;
  el.classList.add('animate-in');
  el.classList.remove('animate-on-scroll');
  el.style.opacity = '1';
  el.style.transform = 'none';
  el.style.willChange = 'auto';
  el.style.visibility = 'visible';
}

function isNeverHide(el) {
  return NEVER_HIDE_SELECTORS.some(sel => {
    try {
      return el.matches(sel) || el.closest(sel);
    } catch {
      return false;
    }
  });
}

class ScrollAnimations {
  constructor() {
    this.options = {
      root: null,
      rootMargin: ROOT_MARGIN,
      threshold: [0, 0.01],
    };

    this.observer = null;
    this._scrollRevealBound = false;
    this._scrollRaf = 0;
    this.init();
  }

  init() {
    // Performance audits and reduced motion: fully visible, no polish.
    if (isPerformanceAudit() || prefersReducedMotion()) {
      this.showAllImmediately();
      this.ensureNeverHideVisible();
      return;
    }

    if (!('IntersectionObserver' in window)) {
      this.showAllImmediately();
      this.ensureNeverHideVisible();
      return;
    }

    this.observer = new IntersectionObserver(
      entries => this.handleIntersection(entries),
      this.options
    );

    this.ensureNeverHideVisible();
    this.observeElements();
    this.bindScrollRevealSweep();

    // Progressive reveal of far content without ever blanking the viewport.
    window.setTimeout(() => this.revealInViewport(true), 0);
    window.setTimeout(() => this.revealInViewport(true), 250);
    window.setTimeout(() => this.revealInViewport(true), 800);
    // After page settles, unlock any remaining pending nodes so reverse-scroll
    // (up) never hits opacity traps from late-loaded modules.
    window.setTimeout(() => this.showAllImmediately(), 2500);
  }

  ensureNeverHideVisible() {
    NEVER_HIDE_SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(forceVisible);
    });
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
    if (!target) return;

    if (
      target.classList.contains('animate-in') &&
      !target.classList.contains('animate-on-scroll')
    ) {
      this.observer?.unobserve(target);
      return;
    }

    // Content-first: mark in, then drop pending class so CSS never leaves opacity:0
    target.classList.add('animate-in');
    target.classList.remove('animate-on-scroll');
    target.style.opacity = '1';
    target.style.visibility = 'visible';

    // Optional short transform polish only (opacity stays 1 via CSS)
    target.addEventListener(
      'animationend',
      () => {
        target.style.willChange = 'auto';
        target.style.transform = 'none';
      },
      { once: true }
    );

    // Absolute safety: transform cleaned even if animation CSS missing
    window.setTimeout(() => {
      target.style.transform = 'none';
      target.style.willChange = 'auto';
      target.style.opacity = '1';
    }, 500);

    this.observer?.unobserve(target);
  }

  /**
   * Reveal pending nodes near (or in) the viewport.
   * @param {boolean} aggressive - also reveal far nodes
   */
  revealInViewport(aggressive = false) {
    const nodes = document.querySelectorAll('.animate-on-scroll');
    if (!nodes.length) return;

    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    const pad = aggressive ? vh * 3 : vh * 1.25;

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
        this.ensureNeverHideVisible();
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    window.addEventListener('wheel', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('touchmove', onScrollOrResize, { passive: true, capture: true });
  }

  observeElements(selectors = null) {
    const targetSelectors = selectors || DEFAULT_SELECTORS;
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;

    targetSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (isNeverHide(el)) {
          forceVisible(el);
          return;
        }

        if (el.classList.contains('animate-in') || el.classList.contains('animate-on-scroll')) {
          return;
        }

        const rect = el.getBoundingClientRect();

        // First ~1.5 viewports: fully visible immediately (no pending state).
        if (rect.bottom < 0 || rect.top < vh * 1.5) {
          forceVisible(el);
          return;
        }

        // Far below fold: mark for polish only — CSS keeps opacity:1.
        el.classList.add('animate-on-scroll');
        this.observer?.observe(el);
      });
    });
  }

  showAllImmediately() {
    const selectors = ['.animate-on-scroll', ...DEFAULT_SELECTORS, ...NEVER_HIDE_SELECTORS];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(forceVisible);
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
  if (!window.scrollAnimations) {
    initScrollAnimations();
  }

  if (prefersReducedMotion()) {
    window.scrollAnimations?.showAllImmediately?.();
    return;
  }

  window.scrollAnimations?.observeElements(selectors);
  window.scrollAnimations?.revealInViewport?.(true);
}

export { APPLE_REVEAL_EASING };

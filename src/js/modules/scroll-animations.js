/**
 * Performance-Optimized Scroll Animations
 * Apple-style reveal: opacity + translateY, Intersection Observer, GPU-only props
 */

import { isPerformanceAudit } from '../utils/perf-audit.js';

const APPLE_REVEAL_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

class ScrollAnimations {
  constructor() {
    this.options = {
      root: null,
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.12,
    };

    this.observer = null;
    this.init();
  }

  init() {
    if (prefersReducedMotion()) {
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
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const target = entry.target;
      target.classList.add('animate-in');
      target.addEventListener(
        'animationend',
        () => {
          target.classList.remove('animate-on-scroll');
          target.style.willChange = 'auto';
        },
        { once: true }
      );
      this.observer.unobserve(target);
    });
  }

  observeElements(selectors = null) {
    const targetSelectors = selectors || [
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
    ];

    targetSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el.classList.contains('animate-in') || el.classList.contains('animate-on-scroll')) {
          return;
        }
        el.classList.add('animate-on-scroll');
        this.observer?.observe(el);
      });
    });
  }

  showAllImmediately() {
    const selectors = [
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
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('animate-in');
        el.classList.remove('animate-on-scroll');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.willChange = 'auto';
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
}

export { APPLE_REVEAL_EASING };

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
      rootMargin: '0px 0px 200px 0px',
      threshold: 0.01,
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
      const target = entry.target;
      const isAboveViewport = entry.boundingClientRect.bottom < 0;

      if (entry.isIntersecting || isAboveViewport) {
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

        // Safety net: if CSS animation never fires (deferred stylesheet race),
        // force the element visible after 3 s so content is never permanently hidden.
        window.setTimeout(() => {
          if (!animationFired) {
            target.classList.remove('animate-on-scroll');
            target.style.opacity = '1';
            target.style.transform = 'none';
            target.style.willChange = 'auto';
          }
        }, 3000);

        this.observer.unobserve(target);
      }
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

    targetSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el.classList.contains('animate-in') || el.classList.contains('animate-on-scroll')) {
          return;
        }

        // If the element is already above the viewport, do not hide it
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0) {
          el.classList.add('animate-in');
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

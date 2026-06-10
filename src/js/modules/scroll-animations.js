/**
 * Performance-Optimized Scroll Animations
 * Uses Intersection Observer for 60fps smooth animations
 */

class ScrollAnimations {
  constructor() {
    this.options = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1,
    };

    this.observer = null;
    this.init();
  }

  init() {
    if (!('IntersectionObserver' in window)) {
      console.warn('Intersection Observer not supported, showing all elements');
      this.fallbackAnimation();
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
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        this.observer.unobserve(entry.target);
      }
    });
  }

  observeElements() {
    const selectors = [
      '.showcase-project-card',
      '.experience-content',
      '.education-card',
      '.publication-card',
      '.award-card',
      '.blog-card',
      '.recommendation-card',
      '.certification-card',
      'section h2',
      '.skill-badge',
      '.stat-card',
      '.portfolio-reach-badge',
      '.vibe-coder-badge',
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('animate-on-scroll');
        this.observer.observe(el);
      });
    });
  }

  fallbackAnimation() {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.classList.add('animate-in');
      el.style.opacity = '1';
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

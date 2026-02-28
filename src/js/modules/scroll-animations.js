/**
 * Performance-Optimized Scroll Animations
 * Uses Intersection Observer for 60fps smooth animations
 * Phase 1: High-Impact, Low-Cost Implementation
 */

class ScrollAnimations {
  constructor() {
    this.options = {
      root: null,
      rootMargin: '0px 0px -100px 0px', // Trigger 100px before element enters viewport
      threshold: 0.1, // 10% of element must be visible
    };

    this.observer = null;
    this.init();
  }

  init() {
    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      console.warn('Intersection Observer not supported, showing all elements');
      this.fallbackAnimation();
      return;
    }

    // Create observer
    this.observer = new IntersectionObserver(
      entries => this.handleIntersection(entries),
      this.options
    );

    // Observe all animation targets
    this.observeElements();

    // Lazy load images
    this.lazyLoadImages();

    console.log('✨ Scroll animations initialized');
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add animation class
        entry.target.classList.add('animate-in');

        // Stop observing after animation (performance optimization)
        this.observer.unobserve(entry.target);
      }
    });
  }

  observeElements() {
    // Selectors for elements to animate
    const selectors = [
      '.showcase-project-card',
      '.experience-content',
      '.education-card',
      '.publication-card',
      '.award-card',
      '.blog-card',
      '.recommendation-card',
      '.cert-card',
      'section h2',
      '.skill-badge',
      '.stat-card',
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Add animation class marker
        el.classList.add('animate-on-scroll');
        // Start observing
        this.observer.observe(el);
      });
    });

    console.log(`🎬 Observing ${selectors.length} element types for scroll animations`);
  }

  lazyLoadImages() {
    // Lazy load images with fade-in
    const images = document.querySelectorAll('img[loading="lazy"]');

    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });

        img.addEventListener('error', () => {
          img.classList.add('loaded'); // Still fade in even on error
        });
      }
    });

    console.log(`🖼️  Lazy loading ${images.length} images`);
  }

  fallbackAnimation() {
    // Fallback for browsers without Intersection Observer
    // Just show everything immediately
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => {
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

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollAnimations = new ScrollAnimations();
  });
} else {
  // DOM already loaded
  window.scrollAnimations = new ScrollAnimations();
}

// Cleanup on page unload (good practice)
window.addEventListener('beforeunload', () => {
  if (window.scrollAnimations) {
    window.scrollAnimations.destroy();
  }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollAnimations;
}

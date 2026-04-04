class ScrollAnimations {
  constructor() {
    ((this.options = { root: null, rootMargin: '0px 0px -100px 0px', threshold: 0.1 }),
      (this.observer = null),
      this.init());
  }
  init() {
    if (!('IntersectionObserver' in window))
      return (
        console.warn('Intersection Observer not supported, showing all elements'),
        void this.fallbackAnimation()
      );
    ((this.observer = new IntersectionObserver(e => this.handleIntersection(e), this.options)),
      this.observeElements(),
      this.lazyLoadImages(),
      console.log('✨ Scroll animations initialized'));
  }
  handleIntersection(e) {
    e.forEach(e => {
      e.isIntersecting && (e.target.classList.add('animate-in'), this.observer.unobserve(e.target));
    });
  }
  observeElements() {
    const e =
      '.showcase-project-card, .experience-content, .education-card, .publication-card, .award-card, .blog-card, .recommendation-card, .cert-card, section h2, .skill-badge, .stat-card';
    (document.querySelectorAll(e).forEach(e => {
      (e.classList.add('animate-on-scroll'), this.observer.observe(e));
    }),
      console.log('🎬 Observing elements for scroll animations'));
  }
  lazyLoadImages() {
    const e = document.querySelectorAll('img[loading="lazy"]');
    (e.forEach(e => {
      e.complete
        ? e.classList.add('loaded')
        : (e.addEventListener('load', () => {
            e.classList.add('loaded');
          }),
          e.addEventListener('error', () => {
            e.classList.add('loaded');
          }));
    }),
      console.log(`🖼️  Lazy loading ${e.length} images`));
  }
  fallbackAnimation() {
    document.querySelectorAll('.animate-on-scroll').forEach(e => {
      (e.classList.add('animate-in'), (e.style.opacity = '1'));
    });
  }
  destroy() {
    this.observer && this.observer.disconnect();
  }
}
('loading' === document.readyState
  ? document.addEventListener('DOMContentLoaded', () => {
      window.scrollAnimations = new ScrollAnimations();
    })
  : (window.scrollAnimations = new ScrollAnimations()),
  window.addEventListener('beforeunload', () => {
    window.scrollAnimations && window.scrollAnimations.destroy();
  }),
  'undefined' != typeof module && module.exports && (module.exports = ScrollAnimations));

/**
 * Go to Top Button Functionality
 * Shows/hides button based on scroll position
 * Smooth scroll to top on click with accessibility improvements
 */

(function () {
  'use strict';

  function runWhenIdle(callback, timeout = 2000) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => callback(), { timeout });
      return;
    }
    setTimeout(callback, timeout);
  }

  function initGoToTop() {
    const goToTopBtn = document.getElementById('go-to-top');
    const root = document.documentElement;

    if (!goToTopBtn) {
      return;
    }

    if (goToTopBtn.dataset.goToTopBound === 'true') {
      return;
    }
    goToTopBtn.dataset.goToTopBound = 'true';

    // Ensure button is accessible
    goToTopBtn.setAttribute('aria-label', 'Scroll to top of page');
    goToTopBtn.setAttribute('role', 'button');
    goToTopBtn.setAttribute('tabindex', '-1'); // Start hidden from tab order
    goToTopBtn.setAttribute('aria-hidden', 'true');

    // Label styled via CSS (.go-to-top-label) — avoid inline style writes on load
    if (!goToTopBtn.querySelector('.go-to-top-label')) {
      const label = document.createElement('span');
      label.className = 'go-to-top-label';
      label.textContent = 'TOP';
      goToTopBtn.appendChild(label);
    }

    // Show/hide button based on scroll position - throttled for performance
    let isScrolling = false;
    function throttleScroll() {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset || root.scrollTop;
          const showThreshold = 320;
          const visible = scrollPosition > showThreshold;

          goToTopBtn.classList.toggle('visible', visible);
          goToTopBtn.setAttribute('aria-hidden', visible ? 'false' : 'true');
          goToTopBtn.tabIndex = visible ? 0 : -1;
          isScrolling = false;
        });
        isScrolling = true;
      }
    }

    // Scroll to top smoothly (respecting reduced motion preferences)
    function scrollToTop(e) {
      if (e) e.preventDefault();

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const scrollOptions = {
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      };

      try {
        window.scrollTo(scrollOptions);
      } catch {
        window.scrollTo(0, 0);
      }

      // Accessibility: Move focus to the top after scrolling
      setTimeout(() => {
        const topTarget = document.querySelector('h1') || document.body;
        topTarget.tabIndex = -1;
        topTarget.focus({ preventScroll: true });

        if (topTarget !== document.body) {
          topTarget.addEventListener('blur', () => topTarget.removeAttribute('tabindex'), {
            once: true,
          });
        }
      }, 600);
    }

    goToTopBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        scrollToTop(e);
      }
    });

    window.addEventListener('scroll', throttleScroll, { passive: true });
    goToTopBtn.addEventListener('click', scrollToTop);

    // Initial check only when already scrolled (avoids layout work on top of page)
    if ((window.pageYOffset || root.scrollTop) > 0) {
      throttleScroll();
    }
  }

  const boot = () => runWhenIdle(initGoToTop, 2500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

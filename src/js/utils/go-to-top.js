/**
 * Go to Top Button Functionality
 * Shows/hides button based on scroll position
 * Smooth scroll to top on click with accessibility improvements
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const goToTopBtn = document.getElementById('go-to-top');
    const root = document.documentElement;

    if (!goToTopBtn) {
      console.warn('Go to Top button not found');
      return;
    }

    // Ensure button is accessible
    goToTopBtn.setAttribute('aria-label', 'Scroll to top of page');
    goToTopBtn.setAttribute('role', 'button');
    goToTopBtn.setAttribute('tabindex', '-1'); // Start hidden from tab order
    goToTopBtn.style.display = 'flex';
    goToTopBtn.style.alignItems = 'center';
    goToTopBtn.style.justifyContent = 'center';
    goToTopBtn.style.flexDirection = 'column';
    goToTopBtn.style.gap = '2px';
    
    // Add a visible label for better clarity (can be styled to appear on hover/focus)
    const label = document.createElement('span');
    label.className = 'go-to-top-label';
    label.textContent = 'TOP';
    label.style.fontSize = '9px';
    label.style.fontWeight = '700';
    label.style.opacity = '0.9';
    goToTopBtn.appendChild(label);

    // Show/hide button based on scroll position - throttled for performance
    let isScrolling = false;
    function throttleScroll() {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset || root.scrollTop;
          const showThreshold = 500; 

          if (scrollPosition > showThreshold) {
            goToTopBtn.classList.add('visible');
            goToTopBtn.setAttribute('aria-hidden', 'false');
            goToTopBtn.tabIndex = 0;
          } else {
            goToTopBtn.classList.remove('visible');
            goToTopBtn.setAttribute('aria-hidden', 'true');
            goToTopBtn.tabIndex = -1;
          }
          isScrolling = false;
        });
        isScrolling = true;
      }
    }

    // Scroll to top smoothly
    function scrollToTop(e) {
      if (e) e.preventDefault();

      // Cross-browser smooth scroll to top
      const scrollOptions = {
        top: 0,
        behavior: 'smooth'
      };

      // Try window.scrollTo first
      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo(scrollOptions);
      } else {
        // Fallback for browsers without smooth scroll support
        const scrollStep = -window.scrollY / 20;
        const scrollInterval = setInterval(() => {
          if (window.scrollY > 0) {
            window.scrollBy(0, scrollStep);
          } else {
            clearInterval(scrollInterval);
          }
        }, 16);
      }

      // Accessibility: Move focus to the top after scrolling
      // We look for a focus target at the top
      setTimeout(() => {
        const topTarget = document.querySelector('h1') || document.body;
        topTarget.tabIndex = -1; // Make it focusable if not already
        topTarget.focus({ preventScroll: true });
        
        // Remove tabindex after focus if we added it
        if (topTarget !== document.body) {
          topTarget.addEventListener('blur', () => topTarget.removeAttribute('tabindex'), { once: true });
        }
      }, 600); // Wait for smooth scroll to finish mostly
    }

    // Keyboard support (Space/Enter is handled by <button> naturally, but good to be sure)
    goToTopBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        scrollToTop(e);
      }
    });

    // Event listeners
    window.addEventListener('scroll', throttleScroll, { passive: true });
    goToTopBtn.addEventListener('click', scrollToTop);

    // Initial check
    throttleScroll();
    
    // Set initial accessibility state
    goToTopBtn.setAttribute('aria-hidden', 'true');
    goToTopBtn.tabIndex = -1;

    console.log('✅ Go to Top button enhanced for accessibility');
  });
})();

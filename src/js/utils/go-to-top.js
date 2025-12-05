/**
 * Go to Top Button Functionality
 * Shows/hides button based on scroll position
 * Smooth scroll to top on click
 */

(function () {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function () {
        const goToTopBtn = document.getElementById('go-to-top');

        if (!goToTopBtn) {
            console.warn('Go to Top button not found');
            return;
        }

        // Show/hide button based on scroll position
        function toggleGoToTopButton() {
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            const showThreshold = 300; // Show button after scrolling 300px

            if (scrollPosition > showThreshold) {
                goToTopBtn.classList.add('visible');
            } else {
                goToTopBtn.classList.remove('visible');
            }
        }

        // Scroll to top smoothly
        function scrollToTop(e) {
            e.preventDefault();

            // Try multiple scroll targets to ensure it works
            const options = { top: 0, behavior: 'smooth' };
            window.scrollTo(options);
            document.documentElement.scrollTo(options);
            document.body.scrollTo(options);

            // Focus on the top of the page for accessibility
            document.body.focus();
        }

        // Event listeners
        window.addEventListener('scroll', toggleGoToTopButton, { passive: true });
        goToTopBtn.addEventListener('click', scrollToTop);

        // Initial check
        toggleGoToTopButton();

        console.log('✅ Go to Top button initialized');
    });
})();

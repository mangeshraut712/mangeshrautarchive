/**
 * Smart Navbar and Scroll-Aware Chatbot
 * Responsive interface elements that adapt to scroll behavior
 */

let lastScrollTop = 0;
let scrollThreshold = 10;
let isScrolling;

function handleSmartNavbar() {
    const nav = document.querySelector('.global-nav');
    if (!nav) return;

    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // Scrolling down - hide navbar
    if (currentScroll > lastScrollTop && currentScroll > 100) {
        nav.classList.add('nav-hidden');
        nav.classList.remove('nav-visible');
    }
    // Scrolling up - show navbar
    else if (currentScroll < lastScrollTop) {
        nav.classList.remove('nav-hidden');
        nav.classList.add('nav-visible');
    }

    // At top - always show
    if (currentScroll < 50) {
        nav.classList.remove('nav-hidden');
        nav.classList.add('nav-visible');
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}

function handleScrollAwareChatbot() {
    const toggle = document.getElementById('chatbot-toggle');
    if (!toggle) return;

    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // When scrolling down past threshold, move button up
    if (currentScroll > lastScrollTop && currentScroll > 50) {
        toggle.style.transform = 'translate3d(0, -20px, 0)';
    }
    // When scrolling up, bring it back down
    else if (currentScroll < lastScrollTop) {
        toggle.style.transform = 'translate3d(0, 0, 0)';
    }

    // Reset at top
    if (currentScroll < 30) {
        toggle.style.transform = 'translate3d(0, 0, 0)';
    }
}

// Combined scroll handler using requestAnimationFrame for 120Hz smoothness
function smoothScrollHandler() {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            handleSmartNavbar();
            handleScrollAwareChatbot();
            isScrolling = false;
        });
        isScrolling = true;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', smoothScrollHandler, { passive: true });
    console.log('✅ Smart navbar and scroll-aware chatbot initialized');
});

export { handleSmartNavbar, handleScrollAwareChatbot };

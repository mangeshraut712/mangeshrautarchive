/**
 * Smart Navbar - Apple.com Style
 * Shows/hides on scroll direction
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

// Use requestAnimationFrame for 120Hz smoothness
function smoothScrollHandler() {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            handleSmartNavbar();
            isScrolling = false;
        });
        isScrolling = true;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', smoothScrollHandler, { passive: true });
    console.log('✅ Smart navbar initialized');
});

export { handleSmartNavbar };

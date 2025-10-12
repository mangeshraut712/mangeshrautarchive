/**
 * Performance Optimizations - Apple.com Style
 * Smooth animations, lazy loading, and optimal rendering
 */

// Optimize animations on scroll
let ticking = false;

function optimizeScrollPerformance() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            // Handle scroll-based animations
            const scrolled = window.pageYOffset || document.documentElement.scrollTop;
            const nav = document.querySelector('.global-nav');
            
            if (nav) {
                if (scrolled > 10) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }
            
            ticking = false;
        });
        
        ticking = true;
    }
}

// Throttled scroll listener
window.addEventListener('scroll', optimizeScrollPerformance, { passive: true });

// Optimize animations using Intersection Observer
const animationObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Unobserve after animation to save resources
                animationObserver.unobserve(entry.target);
            }
        });
    },
    {
        root: null,
        threshold: 0.1,
        rootMargin: '50px'
    }
);

// Observe all animatable elements
document.addEventListener('DOMContentLoaded', () => {
    const animatableElements = document.querySelectorAll('[data-animate]');
    animatableElements.forEach(el => {
        animationObserver.observe(el);
    });
});

// Optimize image loading
function optimizeImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        },
        {
            rootMargin: '100px'
        }
    );
    
    images.forEach(img => imageObserver.observe(img));
}

// Run optimizations
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeImages);
} else {
    optimizeImages();
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize window resize events
const optimizedResize = debounce(() => {
    // Handle responsive adjustments
    document.body.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}, 150);

window.addEventListener('resize', optimizedResize, { passive: true });

// Set initial viewport height
document.body.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

// Prefetch important resources
function prefetchResources() {
    const links = [
        '/api/status',
        '/js/chat.js',
        '/js/services.js'
    ];
    
    links.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
    });
}

// Run prefetch after page load
if (document.readyState === 'complete') {
    prefetchResources();
} else {
    window.addEventListener('load', prefetchResources);
}

// Export for use in other modules
export { debounce, optimizeScrollPerformance, animationObserver };

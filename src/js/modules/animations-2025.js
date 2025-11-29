/**
 * Advanced Animations Module 2025
 * Handles scroll animations, text reveals, flashlight effects, and carousels.
 */

export function initAnimations() {
    initScrollAnimations();
    initTextReveal();
    initFlashlightEffect();
    initProfileCarousel();
    initMarquees();
}

/**
 * 1. Scroll Animations (Fade, Slide, Blur)
 * Uses IntersectionObserver to trigger animations when elements enter viewport.
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animationType = element.dataset.animateType || 'fade-in';
                element.classList.add(`animate-${animationType}`);
                element.style.opacity = '1'; // Ensure visibility after animation starts
                observer.unobserve(element);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

/**
 * 2. Text Reveal Animation
 * Splits text into characters and animates them vertically.
 */
function initTextReveal() {
    const elements = document.querySelectorAll('.text-reveal');
    
    elements.forEach(el => {
        const text = el.textContent.trim();
        el.textContent = '';
        el.style.opacity = '1'; // Make container visible

        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'text-reveal-char';
            span.style.animationDelay = `${index * 0.05}s`;
            el.appendChild(span);
        });
    });
}

/**
 * 3. Flashlight Effect
 * Adds a spotlight effect that follows the mouse cursor on cards.
 */
function initFlashlightEffect() {
    const cards = document.querySelectorAll('.flashlight-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    });
}

/**
 * 4. Profile Carousel
 * Rotates between images in the profile section.
 */
function initProfileCarousel() {
    const container = document.getElementById('profile-carousel');
    if (!container) return;

    const track = container.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextBtn = container.querySelector('.carousel-next');
    const prevBtn = container.querySelector('.carousel-prev');
    let currentIndex = 0;

    function updateSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        
        currentIndex = index;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    if (nextBtn) nextBtn.addEventListener('click', () => updateSlide(currentIndex + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => updateSlide(currentIndex - 1));

    // Auto rotate
    setInterval(() => {
        updateSlide(currentIndex + 1);
    }, 5000);
}

/**
 * 5. Marquee Initialization
 * Clones content to create a seamless infinite loop.
 */
function initMarquees() {
    const marquees = document.querySelectorAll('.marquee-content');
    
    marquees.forEach(marquee => {
        // Clone children to ensure seamless scrolling
        const content = Array.from(marquee.children);
        content.forEach(item => {
            const clone = item.cloneNode(true);
            marquee.appendChild(clone);
        });
        
        // Double up if content is short to ensure full width coverage
        if (marquee.scrollWidth < window.innerWidth * 2) {
             content.forEach(item => {
                const clone = item.cloneNode(true);
                marquee.appendChild(clone);
            });
        }
    });
}

// Auto-initialize if loaded as a module
document.addEventListener('DOMContentLoaded', initAnimations);

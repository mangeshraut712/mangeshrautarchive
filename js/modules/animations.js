const DEFAULT_SELECTOR = '[data-animate], .apple-reveal';
const DEFAULT_THRESHOLD = 0.18;
const AUTO_REVEAL_SELECTORS = [
    'section[id]',
    '.education-card',
    '.project-card',
    '.timeline-item',
    '.timeline-item > div',
    '.contact-card',
    '.experience-card',
    '.feature-card',
    '.overlay-nav-link',
    '.nav-link'
];
const AUTO_DATA_ATTRIBUTES = [
    { selector: '.education-card', animation: 'tilt-in', delayStep: 60, baseDelay: 120 },
    { selector: '.project-card', animation: 'tilt-in', delayStep: 80, baseDelay: 140 },
    { selector: '.timeline-item', animation: 'fade-up', delayStep: 90, baseDelay: 160 },
    { selector: '.overlay-nav-link', animation: 'fade-up', delayStep: 50, baseDelay: 120 },
    { selector: '.nav-link', animation: 'fade-up', delayStep: 40, baseDelay: 220 },
    { selector: 'footer', animation: 'fade-up', baseDelay: 0, duration: 900 }
];

function applyDatasetTiming(element) {
    const delay = element.dataset.animateDelay;
    const duration = element.dataset.animateDuration;
    const easing = element.dataset.animateEasing;

    if (delay) {
        element.style.setProperty('--animate-delay', isNaN(delay) ? delay : `${delay}ms`);
    }
    if (duration) {
        element.style.setProperty('--animate-duration', isNaN(duration) ? duration : `${duration}ms`);
    }
    if (easing) {
        element.style.setProperty('--animate-easing', easing);
    }
}

function setupParallax(elements, { documentRef = document } = {}) {
    const parallaxItems = elements.filter((el) => el.dataset.animateParallax !== undefined);
    if (!parallaxItems.length) return;

    const targetWindow = documentRef.defaultView || window;
    let ticking = false;
    const update = () => {
        parallaxItems.forEach((el) => {
            const speed = parseFloat(el.dataset.animateParallax) || 0.2;
            const rect = el.getBoundingClientRect();
            const viewportHeight = targetWindow.innerHeight || documentRef.documentElement.clientHeight;
            const progress = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
            const translate = progress * speed * -100;
            el.style.setProperty('--parallax-offset', `${translate.toFixed(3)}%`);
        });
        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    };

    update();
    targetWindow.addEventListener('scroll', onScroll, { passive: true });
}

export function initFadeInAnimation(selector = DEFAULT_SELECTOR, options = {}) {
    const {
        documentRef = document,
        threshold = DEFAULT_THRESHOLD,
        root = null,
        rootMargin = '0px'
    } = options;

    AUTO_REVEAL_SELECTORS.forEach((sel) => {
        documentRef.querySelectorAll(sel).forEach((el) => {
            el.classList.add('apple-reveal');
        });
    });

    AUTO_DATA_ATTRIBUTES.forEach(({ selector, animation, delayStep = 0, baseDelay = 0, duration }) => {
        const nodes = Array.from(documentRef.querySelectorAll(selector));
        nodes.forEach((el, index) => {
            if (animation && !el.dataset.animate) {
                el.dataset.animate = animation;
            }
            if (delayStep && !el.dataset.animateDelay) {
                const delayValue = baseDelay + delayStep * index;
                el.dataset.animateDelay = `${delayValue}`;
            }
            if (duration && !el.dataset.animateDuration) {
                el.dataset.animateDuration = `${duration}`;
            }
        });
    });

    const elements = Array.from(documentRef.querySelectorAll(selector));
    if (!elements.length) return;

    elements.forEach(applyDatasetTiming);

    const targetWindow = documentRef.defaultView || window;
    const observer = new IntersectionObserver((entries, observerRef) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                requestAnimationFrame(() => {
                    entry.target.classList.remove('is-queued');
                    entry.target.classList.add('is-visible');
                });
                observerRef.unobserve(entry.target);
            }
        });
    }, { threshold, root, rootMargin });

    const viewportHeight = targetWindow.innerHeight || documentRef.documentElement.clientHeight;
    const viewportWidth = targetWindow.innerWidth || documentRef.documentElement.clientWidth;
    const immediateReveal = [];

    const isElementInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.bottom >= 0 &&
            rect.right >= 0 &&
            rect.top <= viewportHeight &&
            rect.left <= viewportWidth
        );
    };

    elements.forEach((element) => {
        element.classList.add('is-queued');
        observer.observe(element);
        if (isElementInViewport(element)) {
            immediateReveal.push(element);
        }
    });

    if (immediateReveal.length) {
        targetWindow.requestAnimationFrame(() => {
            immediateReveal.forEach((element) => {
                element.classList.remove('is-queued');
                element.classList.add('is-visible');
                observer.unobserve(element);
            });
        });
    }

    setupParallax(elements, { documentRef });
}

export default initFadeInAnimation;

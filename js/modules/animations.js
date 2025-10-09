export function initFadeInAnimation(selector = '.fade-in', options = {}) {
    const { documentRef = document, threshold = 0.1 } = options;
    const elements = Array.from(documentRef.querySelectorAll(selector));
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries, observerRef) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observerRef.unobserve(entry.target);
            }
        });
    }, { threshold });

    elements.forEach((element) => observer.observe(element));
}

export default initFadeInAnimation;

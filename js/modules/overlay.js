const DEFAULT_NAV_OFFSET_SELECTOR = 'nav';

export function initOverlayMenu(options = {}) {
    const {
        menuButtonId = 'menu-btn',
        closeButtonId = 'menu-close',
        menuId = 'overlay-menu',
        documentRef = document
    } = options;

    const menuToggle = documentRef.getElementById(menuButtonId);
    const menuClose = documentRef.getElementById(closeButtonId);
    const overlayMenu = documentRef.getElementById(menuId);
    const body = documentRef.body;

    if (!menuToggle || !menuClose || !overlayMenu || !body) {
        return;
    }

    menuToggle.addEventListener('click', () => {
        body.classList.add('menu-open');
    });

    menuClose.addEventListener('click', () => {
        body.classList.remove('menu-open');
    });
}

export function initOverlayNavigation(options = {}) {
    const {
        linkSelector = '.overlay-nav-link',
        offsetSelector = DEFAULT_NAV_OFFSET_SELECTOR,
        closeClass = 'menu-open',
        documentRef = document
    } = options;

    const links = Array.from(documentRef.querySelectorAll(linkSelector));
    if (!links.length) return;

    const body = documentRef.body;

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;

            event.preventDefault();
            const targetElement = documentRef.querySelector(href);
            if (!targetElement) return;

            if (body && closeClass) {
                body.classList.remove(closeClass);
            }

            setTimeout(() => {
                const navHeight = documentRef.querySelector(offsetSelector)?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top +
                    window.pageYOffset - navHeight - 10;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }, 120);
        });
    });
}

export function initSmoothScroll(selector = 'a[href^="#"]', options = {}) {
    const { documentRef = document, behavior = 'smooth', block = 'start' } = options;
    const links = Array.from(documentRef.querySelectorAll(selector));
    if (!links.length) return;

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            const targetId = href.startsWith('#') ? href.slice(1) : href;
            const target = documentRef.getElementById(targetId);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior, block });
        });
    });
}

export default {
    initOverlayMenu,
    initOverlayNavigation,
    initSmoothScroll
};

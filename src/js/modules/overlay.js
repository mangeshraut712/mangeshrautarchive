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
        console.error('❌ Mobile menu initialization failed - missing elements');
        return;
    }

    if (menuToggle.dataset.overlayBound === 'true') return;
    menuToggle.dataset.overlayBound = 'true';

    const openMenu = () => {
        if (body.classList.contains('menu-open')) return;
        body.classList.add('menu-open');
        overlayMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
        if (!body.classList.contains('menu-open')) return;
        body.classList.remove('menu-open');
        overlayMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        if (typeof menuToggle.focus === 'function') {
            menuToggle.focus();
        }
    };

    menuToggle.addEventListener('click', () => {
        if (body.classList.contains('menu-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    menuClose.addEventListener('click', () => {
        closeMenu();
    });

    overlayMenu.addEventListener('click', (event) => {
        if (event.target === overlayMenu) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
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
            const overlayMenu = documentRef.getElementById('overlay-menu');
            if (overlayMenu) {
                overlayMenu.setAttribute('aria-hidden', 'true');
            }
            const menuToggle = documentRef.getElementById('menu-btn');
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.focus();
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

// Auto-init on DOM ready as a safety net (in case inline scripts fail to run)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initOverlayMenu();
        initOverlayNavigation({ offsetSelector: '.global-nav' });
    });
}

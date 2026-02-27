/**
 * Smart Dynamic Island Navbar
 * Single source of truth for navbar scroll behavior + active section state.
 */

const DESKTOP_BREAKPOINT = 1150;
const SCROLLED_THRESHOLD = 36;
const AUTO_HIDE_THRESHOLD = 220;
const DELTA_THRESHOLD = 6;

const state = {
    nav: null,
    navLinks: [],
    overlayLinks: [],
    lastY: 0,
    direction: 'still',
    ticking: false,
    observer: null
};

function isDesktop() {
    return window.innerWidth > DESKTOP_BREAKPOINT;
}

function shouldAutoHide() {
    if (!state.nav || !isDesktop()) return false;
    if (document.body.classList.contains('menu-open')) return false;
    if (state.nav.contains(document.activeElement)) return false;

    const searchOverlay = document.getElementById('search-overlay');
    if (searchOverlay?.classList.contains('active')) return false;
    return true;
}

function setNavVisibility(hidden) {
    if (!state.nav) return;
    state.nav.classList.toggle('nav-hidden', hidden);
    state.nav.classList.toggle('nav-visible', !hidden);
}

function centerActiveDesktopLink() {
    if (!isDesktop()) return;
    const activeLink = state.navLinks.find((link) => link.classList.contains('active'));
    if (!activeLink) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeLink.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center'
    });
}

function setActiveLinkBySectionId(sectionId) {
    if (!sectionId) return;
    const targetHref = `#${sectionId}`;
    const allLinks = [...state.navLinks, ...state.overlayLinks];

    allLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === targetHref;
        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    centerActiveDesktopLink();
}

function getVisibleSectionId() {
    const navHeight = state.nav?.offsetHeight || 0;
    const probe = navHeight + 120;
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const topToBottom = sections
        .filter((section) => state.navLinks.some((link) => link.getAttribute('href') === `#${section.id}`))
        .sort((a, b) => a.offsetTop - b.offsetTop);

    for (let i = topToBottom.length - 1; i >= 0; i -= 1) {
        if (window.scrollY + probe >= topToBottom[i].offsetTop) {
            return topToBottom[i].id;
        }
    }
    return topToBottom[0]?.id || null;
}

function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target || !state.nav) return;

    const navOffset = state.nav.offsetHeight + 12;
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
}

function bindNavLinks() {
    state.navLinks.forEach((link) => {
        if (link.dataset.navBound === 'true') return;
        link.dataset.navBound = 'true';

        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;

            const sectionId = href.slice(1);
            event.preventDefault();
            setNavVisibility(false);
            setActiveLinkBySectionId(sectionId);
            scrollToSection(sectionId);
            if (window.location.hash !== href) {
                history.replaceState(null, '', href);
            }
        });
    });
}

function bindHashSync() {
    window.addEventListener('hashchange', () => {
        const id = window.location.hash.replace('#', '').trim();
        if (id) {
            setActiveLinkBySectionId(id);
        }
    });
}

function bindScrollWheelForDesktopNav() {
    const navRail = state.nav?.querySelector('.nav-links.scrollable-nav');
    if (!navRail || navRail.dataset.wheelBound === 'true') return;
    navRail.dataset.wheelBound = 'true';

    navRail.addEventListener('wheel', (event) => {
        if (!isDesktop()) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        navRail.scrollLeft += event.deltaY;
    }, { passive: false });
}

function initSectionObserver() {
    const sections = Array.from(document.querySelectorAll('section[id]')).filter((section) =>
        state.navLinks.some((link) => link.getAttribute('href') === `#${section.id}`)
    );
    if (!sections.length || !('IntersectionObserver' in window)) return;

    if (state.observer) {
        state.observer.disconnect();
    }

    state.observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
            setActiveLinkBySectionId(visible[0].target.id);
            return;
        }

        const fallbackId = getVisibleSectionId();
        if (fallbackId) {
            setActiveLinkBySectionId(fallbackId);
        }
    }, {
        threshold: [0.2, 0.4, 0.65],
        rootMargin: '-20% 0px -55% 0px'
    });

    sections.forEach((section) => state.observer.observe(section));
}

function updateSmartNavbar() {
    if (!state.nav) return;

    const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);
    const delta = currentY - state.lastY;
    const magnitude = Math.abs(delta);

    if (delta > 0) {
        state.direction = 'down';
    } else if (delta < 0) {
        state.direction = 'up';
    } else {
        state.direction = 'still';
    }

    state.nav.classList.toggle('scrolled', currentY > SCROLLED_THRESHOLD);

    if (currentY < 28 || !shouldAutoHide()) {
        setNavVisibility(false);
    } else if (magnitude > DELTA_THRESHOLD) {
        if (state.direction === 'down' && currentY > AUTO_HIDE_THRESHOLD) {
            setNavVisibility(true);
        }
        if (state.direction === 'up') {
            setNavVisibility(false);
        }
    }

    state.lastY = currentY;
}

function updateChatbotOffset() {
    const toggle = document.getElementById('chatbot-toggle');
    if (!toggle) return;

    const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);
    if (state.direction === 'down' && currentY > 96) {
        toggle.style.transform = 'translate3d(0, -18px, 0)';
    } else {
        toggle.style.transform = 'translate3d(0, 0, 0)';
    }
}

function handleSmartNavbar() {
    updateSmartNavbar();
}

function handleScrollAwareChatbot() {
    updateChatbotOffset();
}

function onScroll() {
    if (state.ticking) return;
    state.ticking = true;
    requestAnimationFrame(() => {
        handleSmartNavbar();
        handleScrollAwareChatbot();
        state.ticking = false;
    });
}

function onResize() {
    if (!state.nav) return;
    const desktop = isDesktop();
    if (!desktop) {
        setNavVisibility(false);
    } else {
        document.body.classList.remove('menu-open');
        const overlayMenu = document.getElementById('overlay-menu');
        overlayMenu?.setAttribute('aria-hidden', 'true');
        const menuToggle = document.getElementById('menu-btn');
        menuToggle?.setAttribute('aria-expanded', 'false');
    }
    centerActiveDesktopLink();
}

function initSmartNavbar() {
    state.nav = document.querySelector('.global-nav.dynamic-island');
    if (!state.nav) return;

    state.navLinks = Array.from(state.nav.querySelectorAll('.nav-link[href^="#"]'));
    state.overlayLinks = Array.from(document.querySelectorAll('.menu-item[href^="#"]'));
    state.lastY = Math.max(0, window.scrollY || window.pageYOffset || 0);

    window.__smartNavbarHandlesDynamicIsland = true;
    state.nav.dataset.smartNav = 'true';

    bindNavLinks();
    bindHashSync();
    bindScrollWheelForDesktopNav();
    initSectionObserver();

    const initialHash = window.location.hash.replace('#', '').trim();
    setActiveLinkBySectionId(initialHash || getVisibleSectionId() || 'home');
    setNavVisibility(false);
    updateSmartNavbar();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('focusin', () => setNavVisibility(false));

    console.log('✅ Smart Dynamic Island navbar initialized');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartNavbar, { once: true });
} else {
    initSmartNavbar();
}

export { handleSmartNavbar, handleScrollAwareChatbot };

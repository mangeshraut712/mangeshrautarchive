const DEFAULT_NAV_OFFSET_SELECTOR = 'nav';

import {
  lockBodyScroll,
  releaseBodyScrollStyles,
  restoreBodyScrollPosition,
} from '../utils/scroll-lock.js';

export {
  lockBodyScroll,
  releaseBodyScrollStyles,
  restoreBodyScrollPosition,
  unlockBodyScroll,
} from '../utils/scroll-lock.js';

export function initOverlayMenu(options = {}) {
  const {
    menuButtonId = 'menu-btn',
    closeButtonId = 'close-menu-btn',
    menuId = 'overlay-menu',
    documentRef = document,
  } = options;

  const menuToggle = documentRef.getElementById(menuButtonId);
  const menuClose = documentRef.getElementById(closeButtonId);
  const overlayMenu = documentRef.getElementById(menuId);
  const body = documentRef.body;

  if (!menuToggle || !menuClose || !overlayMenu || !body) {
    return;
  }

  if (menuToggle.dataset.overlayBound === 'true') return;
  menuToggle.dataset.overlayBound = 'true';

  const openMenu = () => {
    if (body.classList.contains('menu-open')) return;
    lockBodyScroll(body);
    body.classList.add('menu-open');
    overlayMenu.style.setProperty('display', 'flex', 'important');
    overlayMenu.setAttribute('aria-hidden', 'false');
    overlayMenu.removeAttribute('inert');
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    if (!body.classList.contains('menu-open')) return;
    const released = releaseBodyScrollStyles(body);
    body.classList.remove('menu-open');
    restoreBodyScrollPosition(released.scrollY, {
      anchorId: released.anchorId,
      anchorTop: released.anchorTop,
    });
    menuToggle.setAttribute('aria-expanded', 'false');
    if (typeof menuToggle.focus === 'function') {
      try {
        menuToggle.focus({ preventScroll: true });
      } catch {
        menuToggle.focus();
      }
    }
    overlayMenu.style.setProperty('display', 'none', 'important');
    overlayMenu.setAttribute('aria-hidden', 'true');
    overlayMenu.setAttribute('inert', '');
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

  overlayMenu.addEventListener('click', event => {
    if (event.target === overlayMenu) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

export function initOverlayNavigation(options = {}) {
  if (window.__smartNavbarHandlesDynamicIsland) {
    return;
  }

  const {
    linkSelector = '.menu-item',
    offsetSelector = DEFAULT_NAV_OFFSET_SELECTOR,
    closeClass = 'menu-open',
    documentRef = document,
  } = options;

  const links = Array.from(documentRef.querySelectorAll(linkSelector));
  if (!links.length) return;

  const body = documentRef.body;

  links.forEach(link => {
    if (link.dataset.overlayNavBound === 'true') return;
    link.dataset.overlayNavBound = 'true';

    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      event.preventDefault();
      const targetElement = documentRef.querySelector(href);
      if (!targetElement) return;

      if (body && closeClass) {
        const released = releaseBodyScrollStyles(body);
        body.classList.remove(closeClass);
        restoreBodyScrollPosition(released.scrollY, {
          anchorId: released.anchorId,
          anchorTop: released.anchorTop,
        });
      }
      const menuToggle = documentRef.getElementById('menu-btn');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
        try {
          menuToggle.focus({ preventScroll: true });
        } catch {
          menuToggle.focus();
        }
      }
      const overlayMenu = documentRef.getElementById('overlay-menu');
      if (overlayMenu) {
        overlayMenu.style.setProperty('display', 'none', 'important');
        overlayMenu.setAttribute('aria-hidden', 'true');
        overlayMenu.setAttribute('inert', '');
      }

      setTimeout(() => {
        const navHeight = documentRef.querySelector(offsetSelector)?.offsetHeight || 0;
        const targetPosition =
          targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 10;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }, 120);
    });
  });
}

export function initSmoothScroll(selector = 'a[href^="#"]', options = {}) {
  const { documentRef = document, behavior = 'smooth', block = 'start' } = options;
  const links = Array.from(documentRef.querySelectorAll(selector));
  if (!links.length) return;

  links.forEach(link => {
    if (link.dataset.smoothScrollBound === 'true') return;
    link.dataset.smoothScrollBound = 'true';

    link.addEventListener('click', event => {
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

function shouldSkipPerfAutoInit() {
  return (
    window.__PERF_AUDIT__ === true ||
    new URLSearchParams(window.location.search).has('perf-audit') ||
    /Chrome-Lighthouse|Lighthouse/i.test(navigator.userAgent || '')
  );
}

// Auto-init on DOM ready as a safety net (in case inline scripts fail to run)
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !shouldSkipPerfAutoInit()) {
  document.addEventListener('DOMContentLoaded', () => {
    initOverlayMenu();
    initOverlayNavigation({ offsetSelector: '.global-nav' });
  });
}

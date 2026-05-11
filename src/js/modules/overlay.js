const DEFAULT_NAV_OFFSET_SELECTOR = 'nav';

function lockBodyScroll(body, windowRef = window) {
  const scrollY = windowRef.scrollY || windowRef.pageYOffset || 0;
  const anchor = Array.from(document.querySelectorAll('section[id]'))
    .map(section => ({ id: section.id, rect: section.getBoundingClientRect() }))
    .filter(({ rect }) => rect.bottom > 80 && rect.top < windowRef.innerHeight - 80)
    .sort((a, b) => Math.abs(a.rect.top - 80) - Math.abs(b.rect.top - 80))[0];

  if (anchor) {
    body.dataset.overlayAnchorId = anchor.id;
    body.dataset.overlayAnchorTop = String(anchor.rect.top);
  }

  body.dataset.overlayScrollY = String(scrollY);
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
}

function unlockBodyScroll(body, windowRef = window) {
  const scrollY = Number.parseInt(body.dataset.overlayScrollY || '0', 10) || 0;
  const anchorId = body.dataset.overlayAnchorId;
  const anchorTop = Number.parseFloat(body.dataset.overlayAnchorTop || '');
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.width = '';
  delete body.dataset.overlayScrollY;
  delete body.dataset.overlayAnchorId;
  delete body.dataset.overlayAnchorTop;

  const anchor = anchorId ? document.getElementById(anchorId) : null;
  const restoredY =
    anchor && Number.isFinite(anchorTop)
      ? anchor.getBoundingClientRect().top + windowRef.scrollY - anchorTop
      : scrollY;
  windowRef.scrollTo(0, Math.max(0, restoredY));
}

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
    console.error('❌ Mobile menu initialization failed - missing elements');
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
    body.classList.remove('menu-open');
    unlockBodyScroll(body);
    overlayMenu.style.setProperty('display', 'none', 'important');
    overlayMenu.setAttribute('aria-hidden', 'true');
    overlayMenu.setAttribute('inert', '');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (typeof menuToggle.focus === 'function') {
      try {
        menuToggle.focus({ preventScroll: true });
      } catch {
        menuToggle.focus();
      }
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
        body.classList.remove(closeClass);
      }
      const overlayMenu = documentRef.getElementById('overlay-menu');
      if (overlayMenu) {
        overlayMenu.style.setProperty('display', 'none', 'important');
        overlayMenu.setAttribute('aria-hidden', 'true');
        overlayMenu.setAttribute('inert', '');
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

export default {
  initOverlayMenu,
  initOverlayNavigation,
  initSmoothScroll,
};

// Auto-init on DOM ready as a safety net (in case inline scripts fail to run)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initOverlayMenu();
    initOverlayNavigation({ offsetSelector: '.global-nav' });
  });
}

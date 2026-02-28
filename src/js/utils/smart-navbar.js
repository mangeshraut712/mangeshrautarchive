/**
 * Apple-Inspired Navbar
 * Matches apple.com navigation behavior exactly.
 * Features: Fixed position, scroll-aware background, section highlighting
 */

const DESKTOP_BREAKPOINT = 1150;
const SCROLLED_THRESHOLD = 50;
const DELTA_THRESHOLD = 4;
const COMPACT_THRESHOLD = 120;

const state = {
  nav: null,
  navLinks: [],
  overlayLinks: [],
  lastY: 0,
  direction: 'still',
  ticking: false,
  observer: null,
  stabilizeTimers: [],
  hashSyncBound: false,
  isCompact: false,
};

function isDesktop() {
  return window.innerWidth > DESKTOP_BREAKPOINT;
}

/**
 * Update scrolled state for navbar background
 */
function updateScrolledState() {
  if (!state.nav) return;
  const currentY = window.scrollY || window.pageYOffset || 0;
  const isScrolled = currentY > SCROLLED_THRESHOLD;
  state.nav.classList.toggle('scrolled', isScrolled);
  state.nav.dataset.morphState = isScrolled ? 'scrolled' : 'default';
}

function setNavVisibility(hidden) {
  if (!state.nav) return;
  const shouldHide = Boolean(hidden);
  state.nav.classList.toggle('is-hidden', shouldHide);
  state.nav.dataset.navVisibility = shouldHide ? 'hidden' : 'visible';
}

function setMorphState(nextState = 'default') {
  if (!state.nav) return;

  const allowedStates = new Set(['default', 'scrolled', 'hidden']);
  const morphState = allowedStates.has(nextState) ? nextState : 'default';

  state.nav.dataset.morphState = morphState;
  state.nav.classList.toggle('scrolled', morphState === 'scrolled');
  setNavVisibility(morphState === 'hidden');
}

function setCompactState(compact) {
  if (!state.nav) return;

  const shouldCompact = Boolean(compact) && isDesktop();
  if (state.isCompact === shouldCompact) return;

  state.isCompact = shouldCompact;
  state.nav.classList.toggle('is-compact', shouldCompact);
  state.nav.dataset.compactState = shouldCompact ? 'compact' : 'default';
}

function centerActiveDesktopLink() {
  if (!isDesktop()) return;
  const activeLink = state.navLinks.find(link => link.classList.contains('active'));
  if (!activeLink) return;

  activeLink.scrollIntoView({
    behavior: 'auto',
    block: 'nearest',
    inline: 'center',
  });
}

function setActiveLinkBySectionId(sectionId) {
  if (!sectionId) return;
  const targetHref = `#${sectionId}`;
  const allLinks = [...state.navLinks, ...state.overlayLinks];
  const currentActiveHref = allLinks
    .find(link => link.classList.contains('active'))
    ?.getAttribute('href');
  if (currentActiveHref === targetHref) return;

  allLinks.forEach(link => {
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
    .filter(section => state.navLinks.some(link => link.getAttribute('href') === `#${section.id}`))
    .sort((a, b) => a.offsetTop - b.offsetTop);

  for (let i = topToBottom.length - 1; i >= 0; i -= 1) {
    if (window.scrollY + probe >= topToBottom[i].offsetTop) {
      return topToBottom[i].id;
    }
  }
  return topToBottom[0]?.id || null;
}

function clearStabilizeTimers() {
  state.stabilizeTimers.forEach(timerId => window.clearTimeout(timerId));
  state.stabilizeTimers = [];
}

function stabilizeScrollToSection(sectionId) {
  clearStabilizeTimers();

  // Cancel timers instantly if the user starts manually scrolling or interacting
  const cancelTimers = () => clearStabilizeTimers();
  window.addEventListener('wheel', cancelTimers, { passive: true, once: true });
  window.addEventListener('touchstart', cancelTimers, { passive: true, once: true });
  window.addEventListener('mousedown', cancelTimers, { passive: true, once: true });
  window.addEventListener('keydown', cancelTimers, { passive: true, once: true });

  // Sections above target can expand during lazy load; keep re-aligning for a longer window.
  // CI runs and slower devices often finish project/content inflation after 1s.
  const checkpoints = [120, 280, 480, 760, 1100, 1500, 1900, 2300, 2700];
  checkpoints.forEach(delay => {
    const timerId = window.setTimeout(() => {
      const target = document.getElementById(sectionId);
      if (!target || !state.nav) return;
      if (window.location.hash.replace('#', '').trim() !== sectionId) return;

      const expectedTop = (state.nav.offsetHeight || 60) + 12;
      const delta = target.getBoundingClientRect().top - expectedTop;
      if (Math.abs(delta) <= 8) return;

      window.scrollBy({
        top: delta,
        behavior: 'auto',
      });
    }, delay);

    state.stabilizeTimers.push(timerId);
  });
}

function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target || !state.nav) return;

  const navOffset = (state.nav.offsetHeight || 60) + 12;
  const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });

  stabilizeScrollToSection(sectionId);
}

function closeOverlayMenu() {
  document.body.classList.remove('menu-open');
  const overlayMenu = document.getElementById('overlay-menu');
  overlayMenu?.setAttribute('aria-hidden', 'true');
  overlayMenu?.setAttribute('inert', '');
  const menuToggle = document.getElementById('menu-btn');
  menuToggle?.setAttribute('aria-expanded', 'false');
}

function bindNavLinks() {
  state.navLinks.forEach(link => {
    if (link.dataset.navBound === 'true') return;
    link.dataset.navBound = 'true';

    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const sectionId = href.slice(1);
      event.preventDefault();
      setActiveLinkBySectionId(sectionId);
      scrollToSection(sectionId);
      if (window.location.hash !== href) {
        history.replaceState(null, '', href);
      }
    });
  });
}

function bindOverlayLinks() {
  state.overlayLinks.forEach(link => {
    if (link.dataset.navBound === 'true') return;
    link.dataset.navBound = 'true';

    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const sectionId = href.slice(1);
      if (!document.getElementById(sectionId)) return;

      event.preventDefault();
      closeOverlayMenu();
      setActiveLinkBySectionId(sectionId);
      scrollToSection(sectionId);
      if (window.location.hash !== href) {
        history.replaceState(null, '', href);
      }
    });
  });
}

function bindHashSync() {
  if (state.hashSyncBound) return;
  state.hashSyncBound = true;

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

  navRail.addEventListener(
    'wheel',
    event => {
      if (!isDesktop()) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      navRail.scrollLeft += event.deltaY;
    },
    { passive: false }
  );
}

function bindKeyboardNavigation() {
  const navRail = state.nav?.querySelector('.nav-links.scrollable-nav');
  if (!navRail || navRail.dataset.keyboardBound === 'true') return;
  navRail.dataset.keyboardBound = 'true';

  if (!navRail.hasAttribute('tabindex')) {
    navRail.tabIndex = 0;
  }
  if (!navRail.hasAttribute('aria-label')) {
    navRail.setAttribute('aria-label', 'Primary sections');
  }

  navRail.addEventListener('keydown', event => {
    if (!isDesktop()) return;

    const supportedKeys = new Set(['ArrowRight', 'ArrowLeft', 'Home', 'End']);
    if (!supportedKeys.has(event.key)) return;

    const links = state.navLinks;
    if (!links.length) return;

    const focusedIndex = links.indexOf(document.activeElement);
    const activeIndex = links.findIndex(link => link.classList.contains('active'));
    let nextIndex = focusedIndex >= 0 ? focusedIndex : Math.max(0, activeIndex);

    if (event.key === 'ArrowRight') {
      nextIndex = Math.min(links.length - 1, nextIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      nextIndex = Math.max(0, nextIndex - 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = links.length - 1;
    }

    const targetLink = links[nextIndex];
    if (!targetLink) return;

    event.preventDefault();
    targetLink.focus({ preventScroll: true });
    targetLink.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
      inline: 'center',
    });
  });
}

function initSectionObserver() {
  const sections = Array.from(document.querySelectorAll('section[id]')).filter(section =>
    state.navLinks.some(link => link.getAttribute('href') === `#${section.id}`)
  );
  if (!sections.length || !('IntersectionObserver' in window)) return;

  if (state.observer) {
    state.observer.disconnect();
  }

  state.observer = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        setActiveLinkBySectionId(visible[0].target.id);
        return;
      }

      const fallbackId = getVisibleSectionId();
      if (fallbackId) {
        setActiveLinkBySectionId(fallbackId);
      }
    },
    {
      threshold: [0.2, 0.4, 0.65],
      rootMargin: '-20% 0px -55% 0px',
    }
  );

  sections.forEach(section => state.observer.observe(section));
}

function updateSmartNavbar() {
  if (!state.nav) return;

  const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);
  const delta = currentY - state.lastY;

  if (delta > DELTA_THRESHOLD) {
    state.direction = 'down';
  } else if (delta < -DELTA_THRESHOLD) {
    state.direction = 'up';
  } else {
    state.direction = 'still';
  }

  // Update scrolled state for background effect (apple.com style)
  updateScrolledState();

  const isNearTop = currentY <= SCROLLED_THRESHOLD + 8;
  const canCompact = isDesktop() && currentY > COMPACT_THRESHOLD;
  if (isNearTop || !canCompact) {
    setCompactState(false);
  } else if (state.direction === 'down') {
    setCompactState(true);
  } else if (state.direction === 'up') {
    setCompactState(false);
  }

  // Update active link based on visible section
  const visibleSectionId = getVisibleSectionId();
  if (visibleSectionId) {
    setActiveLinkBySectionId(visibleSectionId);
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
    setCompactState(false);
  }

  setNavVisibility(false);

  if (desktop) {
    closeOverlayMenu();
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
  state.nav.dataset.morphState = 'default';
  state.nav.dataset.navVisibility = 'visible';
  state.nav.dataset.compactState = 'default';

  bindNavLinks();
  bindOverlayLinks();
  bindHashSync();
  bindScrollWheelForDesktopNav();
  bindKeyboardNavigation();
  initSectionObserver();

  const initialHash = window.location.hash.replace('#', '').trim();
  setActiveLinkBySectionId(initialHash || getVisibleSectionId() || 'home');
  updateSmartNavbar();
  updateScrolledState();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  console.log('✅ Apple-inspired navbar initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSmartNavbar, {
    once: true,
  });
} else {
  initSmartNavbar();
}

/**
 * Cleanup function for the navbar
 */
function destroySmartNavbar() {
  clearStabilizeTimers();

  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }

  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);

  if (state.nav) {
    state.nav.dataset.smartNav = 'false';
    state.nav.dataset.navVisibility = 'visible';
    state.nav.dataset.compactState = 'default';
  }

  state.nav = null;
  state.navLinks = [];
  state.overlayLinks = [];
  state.isCompact = false;
}

export {
  handleSmartNavbar,
  handleScrollAwareChatbot,
  initSmartNavbar,
  destroySmartNavbar,
  setMorphState,
  setNavVisibility,
  updateScrolledState,
};

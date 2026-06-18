/**
 * Site-wide same-origin view transitions for multi-page navigation.
 * Complements CSS @view-transition { navigation: auto } with explicit
 * startViewTransition on internal link clicks (Safari/Chromium polish).
 */

const HTML_PAGE = /\.html?$/i;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function isSameOriginHtmlNavigation(anchor) {
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
    return false;
  }

  const rawHref = anchor.getAttribute('href');
  if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
    return false;
  }

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) {
    return false;
  }

  const path = url.pathname;
  if (path === window.location.pathname && url.hash) {
    return false;
  }

  if (path === window.location.pathname) {
    return false;
  }

  return HTML_PAGE.test(path) || path.endsWith('/');
}

export function initViewTransitionNavigation() {
  window.__portfolioViewNavReady = true;

  if (typeof document.startViewTransition !== 'function' || window.__portfolioViewNavBound) {
    window.__portfolioViewNavSupported = false;
    return;
  }

  window.__portfolioViewNavBound = true;
  window.__portfolioViewNavSupported = true;

  document.addEventListener(
    'click',
    event => {
      if (prefersReducedMotion() || isModifiedClick(event)) {
        return;
      }

      const anchor = event.target.closest('a[href]');
      if (!isSameOriginHtmlNavigation(anchor)) {
        return;
      }

      event.preventDefault();
      const destination = anchor.href;
      document.startViewTransition(() => {
        window.location.assign(destination);
      });
    },
    { capture: true }
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewTransitionNavigation, { once: true });
} else {
  initViewTransitionNavigation();
}

/**
 * Central scroll-lock helpers for overlays, menus, and modals.
 * Prevents orphaned `position: fixed` / overflow locks from freezing page scroll.
 */

function readStoredScrollY(body) {
  return Number.parseInt(body?.dataset?.overlayScrollY || '0', 10) || 0;
}

export function lockBodyScroll(body = document.body, windowRef = window) {
  if (!body || body.dataset.scrollLocked === 'true') {
    return;
  }

  const scrollY = windowRef.scrollY || windowRef.pageYOffset || 0;
  body.dataset.overlayScrollY = String(scrollY);
  body.dataset.scrollLocked = 'true';

  Object.assign(body.style, {
    position: 'fixed',
    top: `-${scrollY}px`,
    left: '0',
    right: '0',
    width: '100%',
  });
}

export function releaseBodyScrollStyles(body = document.body) {
  if (!body) {
    return { scrollY: 0, anchorId: '', anchorTop: Number.NaN };
  }

  const scrollY = readStoredScrollY(body);
  const anchorId = body.dataset.overlayAnchorId || '';
  const anchorTop = Number.parseFloat(body.dataset.overlayAnchorTop || '');

  body.style.removeProperty('position');
  body.style.removeProperty('top');
  body.style.removeProperty('left');
  body.style.removeProperty('right');
  body.style.removeProperty('width');
  delete body.dataset.overlayScrollY;
  delete body.dataset.overlayAnchorId;
  delete body.dataset.overlayAnchorTop;
  delete body.dataset.scrollLocked;

  return { scrollY, anchorId, anchorTop };
}

export function restoreBodyScrollPosition(
  scrollY,
  { anchorId = '', anchorTop = Number.NaN, windowRef = window } = {}
) {
  const anchor = anchorId ? document.getElementById(anchorId) : null;
  const restoredY =
    anchor && Number.isFinite(anchorTop)
      ? anchor.getBoundingClientRect().top + windowRef.scrollY - anchorTop
      : scrollY;
  const targetY = Math.max(0, restoredY);

  const applyScroll = () => {
    windowRef.scrollTo(0, targetY);
    if (Math.abs((windowRef.scrollY || 0) - targetY) > 2) {
      document.documentElement.scrollTop = targetY;
    }
  };

  applyScroll();

  if (typeof windowRef.requestAnimationFrame === 'function') {
    windowRef.requestAnimationFrame(() => {
      if (Math.abs((windowRef.scrollY || 0) - targetY) > 2) {
        windowRef.requestAnimationFrame(applyScroll);
      }
    });
  }

  return targetY;
}

export function unlockBodyScroll(body = document.body, windowRef = window) {
  const { scrollY, anchorId, anchorTop } = releaseBodyScrollStyles(body);
  restoreBodyScrollPosition(scrollY, { anchorId, anchorTop, body, windowRef });
}

export function recoverPageScroll() {
  const body = document.body;
  const html = document.documentElement;
  if (!body || !html) return false;

  let recovered = false;
  const intro = document.getElementById('launch-intro');
  const introComplete =
    intro?.dataset?.launchIntroComplete === 'true' ||
    intro?.hidden ||
    intro?.getAttribute('aria-hidden') === 'true';

  if (introComplete && html.classList.contains('launch-intro-active')) {
    html.classList.remove('launch-intro-active');
    body.style.removeProperty('overflow');
    recovered = true;
  }

  const hasScrollLockClass =
    body.classList.contains('menu-open') ||
    body.classList.contains('chatbot-open') ||
    body.classList.contains('share-dialog-open');

  const fixedBody = body.style.position === 'fixed';
  const hiddenOverflow = body.style.overflow === 'hidden';

  if (!hasScrollLockClass && (fixedBody || body.dataset.scrollLocked === 'true')) {
    unlockBodyScroll(body);
    recovered = true;
  }

  if (!hasScrollLockClass && hiddenOverflow) {
    body.style.removeProperty('overflow');
    recovered = true;
  }

  if (!body.classList.contains('chatbot-open') && window.innerWidth <= 768) {
    body.style.removeProperty('touch-action');
  }

  return recovered;
}

export function initScrollLockRecovery() {
  if (window.__portfolioScrollLockRecoveryBound) {
    return;
  }
  window.__portfolioScrollLockRecoveryBound = true;

  const runRecovery = () => {
    recoverPageScroll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runRecovery, { once: true });
  } else {
    runRecovery();
  }

  window.addEventListener('pageshow', runRecovery);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      runRecovery();
    }
  });
}

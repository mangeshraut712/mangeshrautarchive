/**
 * Always-On Display–style dim for OLED dark mode when tab is hidden or idle.
 */

const IDLE_MS = 45_000;

export function initAodDimMode() {
  if (window.__portfolioAodDimBound) {
    return;
  }
  window.__portfolioAodDimBound = true;

  const root = document.documentElement;
  let idleTimer = null;

  const shouldDim = () => root.classList.contains('dark');

  const setDim = dim => {
    if (!shouldDim()) {
      if (root.classList.contains('aod-dim')) {
        root.classList.remove('aod-dim');
      }
      return;
    }
    if (root.classList.contains('aod-dim') !== !!dim) {
      root.classList.toggle('aod-dim', dim);
    }
  };

  const clearIdle = () => {
    setDim(false);
    clearTimeout(idleTimer);
    if (document.visibilityState === 'visible' && shouldDim()) {
      idleTimer = window.setTimeout(() => setDim(true), IDLE_MS);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      setDim(shouldDim());
      clearTimeout(idleTimer);
      return;
    }
    clearIdle();
  });

  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(eventName => {
    document.addEventListener(eventName, clearIdle, { passive: true });
  });

  const themeObserver = new MutationObserver(() => {
    if (!shouldDim()) {
      if (root.classList.contains('aod-dim')) {
        setDim(false);
      }
      clearTimeout(idleTimer);
      return;
    }
    // Do not strip aod-dim on unrelated class churn (e.g. scroll / is-scrolling)
  });
  themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

  clearIdle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAodDimMode, { once: true });
} else {
  initAodDimMode();
}

/**
 * Pause infinite CSS animations when elements leave the viewport.
 * Respects prefers-reduced-motion (global CSS already limits motion).
 */

const PAUSE_CLASS = 'is-offscreen-paused';
const STYLE_ID = 'offscreen-animation-pause-style';
const ANIMATED_SELECTOR =
  '[class*="marquee"], [class*="orb"], [class*="glow"], [class*="siri"], [class*="pulse"], .siri-orb, #chatbot-toggle';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensurePauseStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${PAUSE_CLASS},
    .${PAUSE_CLASS}::before,
    .${PAUSE_CLASS}::after {
      animation-play-state: paused !important;
    }
  `;
  document.head.appendChild(style);
}

function hasInfiniteAnimation(element) {
  const style = getComputedStyle(element);
  if (!style.animationName || style.animationName === 'none') {
    return false;
  }

  const iteration = style.animationIterationCount;
  return iteration === 'infinite' || iteration === 'Infinity';
}

export function initOffscreenAnimationPause() {
  if (window.__portfolioOffscreenPauseBound) {
    return;
  }
  window.__portfolioOffscreenPauseBound = true;

  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    return;
  }

  ensurePauseStyles();

  const tracked = new WeakSet();
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle(PAUSE_CLASS, !entry.isIntersecting);
      });
    },
    { rootMargin: '80px 0px', threshold: 0 }
  );

  const trackElement = element => {
    if (!element || element.nodeType !== 1 || tracked.has(element)) {
      return;
    }

    if (!hasInfiniteAnimation(element)) {
      return;
    }

    tracked.add(element);
    observer.observe(element);
  };

  const scan = root => {
    if (!root || root.nodeType !== 1) return;

    if (root.matches?.(ANIMATED_SELECTOR)) {
      trackElement(root);
    }

    root.querySelectorAll(ANIMATED_SELECTOR).forEach(trackElement);
  };

  const scheduleScan = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => scan(document.body), { timeout: 2000 });
      return;
    }

    window.setTimeout(() => scan(document.body), 300);
  };

  if (document.body) {
    scheduleScan();
  } else {
    document.addEventListener('DOMContentLoaded', scheduleScan, { once: true });
  }

  let scanQueued = false;
  const queueScan = root => {
    if (scanQueued) return;
    scanQueued = true;
    const run = () => {
      scanQueued = false;
      scan(root);
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 1200 });
    } else {
      window.setTimeout(run, 120);
    }
  };

  const mutationObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          queueScan(node);
        }
      }
    }
  });

  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
    if (!event.matches) return;
    mutationObserver.disconnect();
    observer.disconnect();
    document.querySelectorAll(`.${PAUSE_CLASS}`).forEach(element => {
      element.classList.remove(PAUSE_CLASS);
    });
  });
}

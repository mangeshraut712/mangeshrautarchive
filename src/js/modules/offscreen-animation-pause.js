/**
 * Pause infinite CSS animations when elements leave the viewport.
 * Respects prefers-reduced-motion (global CSS already limits motion).
 */

const PAUSE_CLASS = 'is-offscreen-paused';
const STYLE_ID = 'offscreen-animation-pause-style';
const ANIMATED_SELECTOR =
  '[class*="marquee"], [class*="orb"], [class*="glow"], [class*="siri"], [class*="pulse"], .siri-orb, #chatbot-toggle, .skill-scroll-wrapper, .dream-companies-track, .dream-cars-track, [class*="-track"]';

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

  const pendingRoots = new Set();
  const pendingElements = new Set();
  let scanQueued = false;
  let active = true;
  const runScan = deadline => {
    scanQueued = false;
    if (!active) return;

    for (const root of pendingRoots) {
      if (root.matches?.(ANIMATED_SELECTOR)) pendingElements.add(root);
      root.querySelectorAll(ANIMATED_SELECTOR).forEach(element => pendingElements.add(element));
    }
    pendingRoots.clear();

    let processed = 0;
    for (const element of pendingElements) {
      pendingElements.delete(element);
      trackElement(element);
      processed += 1;
      if (processed >= 12 || (deadline && !deadline.didTimeout && deadline.timeRemaining() < 2)) {
        break;
      }
    }
    if (pendingRoots.size || pendingElements.size) scheduleScan();
  };

  const scheduleScan = () => {
    if (scanQueued || !active) return;
    scanQueued = true;
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runScan, { timeout: 1200 });
    } else {
      window.setTimeout(runScan, 50);
    }
  };

  const queueScan = root => {
    if (!root || root.nodeType !== 1 || !active) return;
    pendingRoots.add(root);
    scheduleScan();
  };

  if (document.body) {
    queueScan(document.body);
  } else {
    document.addEventListener('DOMContentLoaded', () => queueScan(document.body), { once: true });
  }

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
    active = false;
    pendingRoots.clear();
    pendingElements.clear();
    mutationObserver.disconnect();
    observer.disconnect();
    document.querySelectorAll(`.${PAUSE_CLASS}`).forEach(element => {
      element.classList.remove(PAUSE_CLASS);
    });
  });
}

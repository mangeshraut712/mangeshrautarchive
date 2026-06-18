/**
 * Web haptic feedback — Vibration API (Android) + iOS tactile click fallback.
 * iOS Safari has no navigator.vibrate; uses ultra-short Apple sound tap instead.
 */

const IOS_DEVICE = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const HAPTIC_SELECTOR =
  '#chatbot-toggle, #go-to-top, #website-share-toggle, .global-nav a, .hero-actions button, .hero-actions a.btn, .a11y-toolbar button';

const PATTERNS = {
  light: [8],
  medium: [16],
  heavy: [28],
  selection: [5],
  success: [10, 40, 12],
};

export function triggerHaptic(style = 'light') {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  const pattern = PATTERNS[style] || PATTERNS.light;

  if (typeof navigator.vibrate === 'function') {
    try {
      return navigator.vibrate(pattern);
    } catch {
      /* fall through */
    }
  }

  if (IOS_DEVICE && globalThis.appleSounds?.playClick) {
    globalThis.appleSounds.playClick();
    return true;
  }

  return false;
}

export function initAppleHaptics() {
  if (window.__portfolioHapticsBound) {
    return;
  }
  window.__portfolioHapticsBound = true;

  document.addEventListener(
    'click',
    event => {
      const target = event.target.closest?.(HAPTIC_SELECTOR);
      if (target) {
        triggerHaptic('light');
      }
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    'touchstart',
    event => {
      const target = event.target.closest?.(HAPTIC_SELECTOR);
      if (target) {
        triggerHaptic('selection');
      }
    },
    { capture: true, passive: true }
  );
}

globalThis.appleHaptics = { trigger: triggerHaptic, init: initAppleHaptics };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppleHaptics, { once: true });
} else {
  initAppleHaptics();
}

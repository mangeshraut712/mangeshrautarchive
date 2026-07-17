/**
 * Sync Liquid Glass + WebGL when iOS/macOS Reduce Transparency changes mid-session.
 */
import { syncLiquidGlassTokens } from './liquid-glass-tokens.js';

function readTintPercent() {
  try {
    const raw = localStorage.getItem('wwdc26-liquid-glass-tint');
    if (raw !== null) {
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0 && value <= 100) return value;
    }
  } catch (_error) {
    // ignore
  }
  return 100;
}

function applyReducedTransparencyState(reduced, { forceTokens = false } = {}) {
  const root = document.documentElement;
  const wasReduced = root.classList.contains('lg-reduced-transparency');
  root.classList.toggle('lg-reduced-transparency', reduced);

  // Boot already applied tokens; only rewrite CSS vars when the preference changes
  // or when explicitly forced (e.g. media change mid-session).
  if (forceTokens || wasReduced !== reduced) {
    syncLiquidGlassTokens(readTintPercent() / 100, { instant: true });
  }

  if (forceTokens || wasReduced !== reduced) {
    import('../modules/liquid-glass-chrome.js')
      .then(module => module.syncLiquidGlassChrome?.())
      .catch(() => {});
  }
}

export function initReducedTransparencySync() {
  const media = window.matchMedia('(prefers-reduced-transparency: reduce)');
  // Class sync only on first run — avoid liquid-glass-tokens style thrash on load.
  applyReducedTransparencyState(media.matches, { forceTokens: false });
  media.addEventListener('change', event => {
    applyReducedTransparencyState(event.matches, { forceTokens: true });
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReducedTransparencySync, { once: true });
  } else {
    initReducedTransparencySync();
  }
}

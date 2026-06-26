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
  return 0;
}

function applyReducedTransparencyState(reduced) {
  const root = document.documentElement;
  root.classList.toggle('lg-reduced-transparency', reduced);
  syncLiquidGlassTokens(readTintPercent() / 100, { instant: true });

  import('../modules/liquid-glass-chrome.js')
    .then(module => module.syncLiquidGlassChrome?.())
    .catch(() => {});
}

export function initReducedTransparencySync() {
  const media = window.matchMedia('(prefers-reduced-transparency: reduce)');
  applyReducedTransparencyState(media.matches);
  media.addEventListener('change', event => {
    applyReducedTransparencyState(event.matches);
  });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReducedTransparencySync, { once: true });
  } else {
    initReducedTransparencySync();
  }
}

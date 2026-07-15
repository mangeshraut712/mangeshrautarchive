/** Sync WWDC26 Liquid Glass custom properties when --lg-tint changes via the a11y slider. */
export function syncLiquidGlassTokens(tintRatio, { instant = false } = {}) {
  const t = Math.min(1, Math.max(0, Number(tintRatio)));
  const clear = 1 - t;
  const root = document.documentElement;

  if (instant) {
    root.classList.add('lg-tint-instant');
  }

  const style = root.style;

  style.setProperty('--lg-tint', String(t));
  style.setProperty('--lg-blur-nav', `${10 + clear * 38}px`);
  style.setProperty('--lg-blur-panel', `${14 + clear * 42}px`);
  style.setProperty('--lg-blur-card', `${12 + clear * 36}px`);
  style.setProperty('--lg-blur-control', `${6 + clear * 22}px`);
  style.setProperty('--lg-saturate', `${132 + clear * 88}%`);

  // Clear = solid opaque theme (default). Glass fill/alpha only when user tints.
  // Inline vars override stylesheet tokens, so clear must pin 100% opacity.
  if (t <= 0.12) {
    root.dataset.lgMode = 'clear';
    style.setProperty('--lg-light-fill', '100%');
    style.setProperty('--lg-dark-fill', '100%');
    style.setProperty('--lg-nav-light-fill', '100%');
    style.setProperty('--lg-nav-dark-fill', '100%');
    style.setProperty('--lg-card-light-fill', '100%');
    style.setProperty('--lg-card-dark-fill', '100%');
    style.setProperty('--lg-card-light-alpha', '100%');
    style.setProperty('--lg-card-dark-alpha', '100%');
    style.setProperty('--lg-card-highlight-light', '0%');
    style.setProperty('--lg-card-highlight-dark', '0%');
    style.setProperty('--lg-card-shadow-light', '0%');
    style.setProperty('--lg-card-shadow-dark', '0%');
    style.setProperty('--lg-specular-light', '0%');
    style.setProperty('--lg-specular-dark', '0%');
    style.setProperty('--lg-border-light', '100%');
    style.setProperty('--lg-border-dark', '100%');
  } else {
    root.dataset.lgMode = t >= 0.88 ? 'tinted' : 'balanced';
    style.setProperty('--lg-light-fill', `${6 + t * 76}%`);
    style.setProperty('--lg-dark-fill', `${10 + t * 74}%`);
    style.setProperty('--lg-nav-light-fill', `${4 + t * 78}%`);
    style.setProperty('--lg-nav-dark-fill', `${8 + t * 76}%`);
    style.setProperty('--lg-card-light-fill', `${18 + t * 76}%`);
    style.setProperty('--lg-card-dark-fill', `${24 + t * 68}%`);
    style.setProperty('--lg-card-light-alpha', `${Math.round(12 + t * 86)}%`);
    style.setProperty('--lg-card-dark-alpha', `${Math.round(16 + t * 82)}%`);
    style.setProperty('--lg-card-highlight-light', `${Math.round(42 + t * 48)}%`);
    style.setProperty('--lg-card-highlight-dark', `${Math.round(8 + t * 10)}%`);
    style.setProperty('--lg-card-shadow-light', `${Math.round(8 + clear * 10)}%`);
    style.setProperty('--lg-card-shadow-dark', `${Math.round(42 + clear * 12)}%`);
    style.setProperty('--lg-specular-light', `${Math.round(58 + clear * 38)}%`);
    style.setProperty('--lg-specular-dark', `${Math.round(6 + clear * 14)}%`);
    style.setProperty('--lg-border-light', `${Math.round(18 + clear * 28 + t * 12)}%`);
    style.setProperty('--lg-border-dark', `${Math.round(6 + clear * 10 + t * 8)}%`);
  }

  if (instant) {
    requestAnimationFrame(() => {
      root.classList.remove('lg-tint-instant');
    });
  }

  if (typeof window !== 'undefined' && window.liquidGlassEngine) {
    window.liquidGlassEngine.setTintRatio(t);
  }
}

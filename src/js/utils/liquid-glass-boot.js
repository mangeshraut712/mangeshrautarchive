/**
 * Early Liquid Glass boot — runs before paint to set data-lg-mode and core tokens
 * from localStorage (matches liquid-glass-tokens.js / accessibility slider).
 */
(function liquidGlassBoot() {
  const root = document.documentElement;
  let stored = 0;

  // Flag iPhone / iPad early so CSS can prefer lighter glass (no multi-WebGL)
  try {
    const ua = navigator.userAgent || '';
    const iosLike =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1);
    if (iosLike) {
      root.dataset.iosSafe = '1';
    }
  } catch (_e) {
    // ignore
  }

  try {
    const raw = localStorage.getItem('wwdc26-liquid-glass-tint');
    if (raw !== null) {
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0 && value <= 100) {
        stored = value;
      }
    }
  } catch (_error) {
    // Storage unavailable — default clear glass.
  }

  const t = stored / 100;
  const clear = 1 - t;

  root.style.setProperty('--lg-tint', String(t));
  root.style.setProperty('--lg-blur-nav', `${10 + clear * 38}px`);
  root.style.setProperty('--lg-blur-panel', `${14 + clear * 42}px`);
  root.style.setProperty('--lg-blur-card', `${12 + clear * 36}px`);
  root.style.setProperty('--lg-blur-control', `${6 + clear * 22}px`);
  root.style.setProperty('--lg-saturate', `${132 + clear * 88}%`);
  root.style.setProperty('--lg-card-light-alpha', `${Math.round(12 + t * 86)}%`);
  root.style.setProperty('--lg-card-dark-alpha', `${Math.round(16 + t * 82)}%`);
  root.style.setProperty('--lg-specular-light', `${Math.round(58 + clear * 38)}%`);
  root.style.setProperty('--lg-specular-dark', `${Math.round(6 + clear * 14)}%`);
  root.style.setProperty('--lg-card-shadow-light', `${Math.round(8 + clear * 10)}%`);
  root.style.setProperty('--lg-card-shadow-dark', `${Math.round(42 + clear * 12)}%`);
  root.style.setProperty('--lg-card-highlight-light', `${Math.round(42 + t * 48)}%`);
  root.style.setProperty('--lg-card-highlight-dark', `${Math.round(8 + t * 10)}%`);

  if (t <= 0.12) {
    root.dataset.lgMode = 'clear';
  } else if (t >= 0.88) {
    root.dataset.lgMode = 'tinted';
  } else {
    root.dataset.lgMode = 'balanced';
  }
})();

/**
 * Early Liquid Glass boot — runs before paint to set data-lg-mode and core tokens
 * from localStorage (matches liquid-glass-tokens.js / accessibility slider).
 * Default: balanced liquid glass (42) — Apple-like frosted material.
 */
(function liquidGlassBoot() {
  const root = document.documentElement;
  const DEFAULT_TINT = 42;
  let stored = DEFAULT_TINT;

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
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
      stored = 100;
      root.dataset.lgReducedTransparency = '1';
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
    // Storage unavailable — default balanced glass.
  }

  const t = stored / 100;
  const clear = 1 - t;

  root.style.setProperty('--lg-tint', String(t));
  root.style.setProperty('--lg-blur-nav', `${22 + clear * 28}px`);
  root.style.setProperty('--lg-blur-panel', `${26 + clear * 32}px`);
  root.style.setProperty('--lg-blur-card', `${20 + clear * 30}px`);
  root.style.setProperty('--lg-blur-control', `${14 + clear * 18}px`);
  root.style.setProperty('--lg-saturate', `${155 + clear * 55}%`);

  if (t <= 0.12) {
    root.dataset.lgMode = 'clear';
    root.style.setProperty('--lg-card-light-alpha', `${Math.round(18 + t * 24)}%`);
    root.style.setProperty('--lg-card-dark-alpha', `${Math.round(22 + t * 24)}%`);
    root.style.setProperty('--lg-specular-light', `${Math.round(74 + clear * 18)}%`);
    root.style.setProperty('--lg-specular-dark', `${Math.round(14 + clear * 12)}%`);
    root.style.setProperty('--lg-card-shadow-light', `${Math.round(12 + clear * 8)}%`);
    root.style.setProperty('--lg-card-shadow-dark', `${Math.round(50 + clear * 10)}%`);
    root.style.setProperty('--lg-card-highlight-light', `${Math.round(78 + clear * 14)}%`);
    root.style.setProperty('--lg-card-highlight-dark', `${Math.round(16 + clear * 10)}%`);
    root.style.setProperty('--lg-light-fill', `${6 + t * 36}%`);
    root.style.setProperty('--lg-dark-fill', `${10 + t * 32}%`);
    root.style.setProperty('--lg-nav-light-fill', `${8 + t * 32}%`);
    root.style.setProperty('--lg-nav-dark-fill', `${12 + t * 30}%`);
    root.style.setProperty('--lg-card-light-fill', `${12 + t * 36}%`);
    root.style.setProperty('--lg-card-dark-fill', `${16 + t * 34}%`);
    root.style.setProperty('--lg-border-light', `${Math.round(32 + clear * 24)}%`);
    root.style.setProperty('--lg-border-dark', `${Math.round(12 + clear * 12)}%`);
  } else if (t >= 0.88) {
    root.dataset.lgMode = 'tinted';
    const tintLift = (t - 0.88) / 0.12;
    root.style.setProperty('--lg-card-light-alpha', `${Math.round(94 + tintLift * 6)}%`);
    root.style.setProperty('--lg-card-dark-alpha', `${Math.round(92 + tintLift * 8)}%`);
    root.style.setProperty('--lg-specular-light', `${Math.round(22 + clear * 12)}%`);
    root.style.setProperty('--lg-specular-dark', `${Math.round(6 + clear * 6)}%`);
    root.style.setProperty('--lg-card-shadow-light', `${Math.round(4 + clear * 4)}%`);
    root.style.setProperty('--lg-card-shadow-dark', `${Math.round(28 + clear * 8)}%`);
    root.style.setProperty('--lg-card-highlight-light', `${Math.round(28 + clear * 12)}%`);
    root.style.setProperty('--lg-card-highlight-dark', `${Math.round(6 + clear * 6)}%`);
    root.style.setProperty('--lg-light-fill', `${88 + tintLift * 12}%`);
    root.style.setProperty('--lg-dark-fill', `${86 + tintLift * 14}%`);
    root.style.setProperty('--lg-nav-light-fill', `${90 + tintLift * 10}%`);
    root.style.setProperty('--lg-nav-dark-fill', `${88 + tintLift * 12}%`);
    root.style.setProperty('--lg-card-light-fill', `${92 + tintLift * 8}%`);
    root.style.setProperty('--lg-card-dark-fill', `${90 + tintLift * 10}%`);
    root.style.setProperty('--lg-border-light', `${Math.round(18 + t * 8)}%`);
    root.style.setProperty('--lg-border-dark', `${Math.round(10 + t * 6)}%`);
  } else {
    root.dataset.lgMode = 'balanced';
    root.style.setProperty('--lg-card-light-alpha', `${Math.round(32 + t * 42)}%`);
    root.style.setProperty('--lg-card-dark-alpha', `${Math.round(36 + t * 40)}%`);
    root.style.setProperty('--lg-specular-light', `${Math.round(58 + clear * 30)}%`);
    root.style.setProperty('--lg-specular-dark', `${Math.round(10 + clear * 12)}%`);
    root.style.setProperty('--lg-card-shadow-light', `${Math.round(9 + clear * 9)}%`);
    root.style.setProperty('--lg-card-shadow-dark', `${Math.round(42 + clear * 12)}%`);
    root.style.setProperty('--lg-card-highlight-light', `${Math.round(52 + clear * 30)}%`);
    root.style.setProperty('--lg-card-highlight-dark', `${Math.round(10 + clear * 12)}%`);
    root.style.setProperty('--lg-light-fill', `${18 + t * 48}%`);
    root.style.setProperty('--lg-dark-fill', `${22 + t * 46}%`);
    root.style.setProperty('--lg-nav-light-fill', `${16 + t * 50}%`);
    root.style.setProperty('--lg-nav-dark-fill', `${20 + t * 48}%`);
    root.style.setProperty('--lg-card-light-fill', `${24 + t * 46}%`);
    root.style.setProperty('--lg-card-dark-fill', `${28 + t * 44}%`);
    root.style.setProperty('--lg-border-light', `${Math.round(24 + clear * 20 + t * 10)}%`);
    root.style.setProperty('--lg-border-dark', `${Math.round(10 + clear * 10 + t * 8)}%`);
  }
})();

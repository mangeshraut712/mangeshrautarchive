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
    root.style.setProperty('--lg-card-light-alpha', `${Math.round(22 + t * 28)}%`);
    root.style.setProperty('--lg-card-dark-alpha', `${Math.round(26 + t * 28)}%`);
    root.style.setProperty('--lg-specular-light', `${Math.round(68 + clear * 22)}%`);
    root.style.setProperty('--lg-specular-dark', `${Math.round(12 + clear * 12)}%`);
    root.style.setProperty('--lg-card-shadow-light', `${Math.round(10 + clear * 8)}%`);
    root.style.setProperty('--lg-card-shadow-dark', `${Math.round(48 + clear * 10)}%`);
    root.style.setProperty('--lg-card-highlight-light', `${Math.round(72 + clear * 18)}%`);
    root.style.setProperty('--lg-card-highlight-dark', `${Math.round(14 + clear * 10)}%`);
    root.style.setProperty('--lg-light-fill', `${8 + t * 40}%`);
    root.style.setProperty('--lg-dark-fill', `${12 + t * 36}%`);
    root.style.setProperty('--lg-nav-light-fill', `${10 + t * 36}%`);
    root.style.setProperty('--lg-nav-dark-fill', `${14 + t * 34}%`);
    root.style.setProperty('--lg-card-light-fill', `${14 + t * 42}%`);
    root.style.setProperty('--lg-card-dark-fill', `${18 + t * 40}%`);
    root.style.setProperty('--lg-border-light', `${Math.round(28 + clear * 22)}%`);
    root.style.setProperty('--lg-border-dark', `${Math.round(10 + clear * 12)}%`);
  } else if (t >= 0.88) {
    root.dataset.lgMode = 'tinted';
    root.style.setProperty('--lg-card-light-alpha', `${Math.round(82 + t * 14)}%`);
    root.style.setProperty('--lg-card-dark-alpha', `${Math.round(80 + t * 14)}%`);
    root.style.setProperty('--lg-specular-light', `${Math.round(36 + clear * 20)}%`);
    root.style.setProperty('--lg-specular-dark', `${Math.round(8 + clear * 8)}%`);
    root.style.setProperty('--lg-card-shadow-light', `${Math.round(6 + clear * 6)}%`);
    root.style.setProperty('--lg-card-shadow-dark', `${Math.round(36 + clear * 10)}%`);
    root.style.setProperty('--lg-card-highlight-light', `${Math.round(48 + t * 20)}%`);
    root.style.setProperty('--lg-card-highlight-dark', `${Math.round(10 + t * 8)}%`);
    root.style.setProperty('--lg-light-fill', `${72 + (t - 0.88) * 180}%`);
    root.style.setProperty('--lg-dark-fill', `${70 + (t - 0.88) * 180}%`);
    root.style.setProperty('--lg-nav-light-fill', `${74 + (t - 0.88) * 160}%`);
    root.style.setProperty('--lg-nav-dark-fill', `${72 + (t - 0.88) * 160}%`);
    root.style.setProperty('--lg-card-light-fill', `${78 + (t - 0.88) * 140}%`);
    root.style.setProperty('--lg-card-dark-fill', `${76 + (t - 0.88) * 140}%`);
    root.style.setProperty('--lg-border-light', `${Math.round(22 + t * 18)}%`);
    root.style.setProperty('--lg-border-dark', `${Math.round(12 + t * 10)}%`);
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

/**
 * Early Liquid Glass boot — runs before paint to set data-lg-mode and core tokens
 * from localStorage (matches liquid-glass-tokens.js / accessibility slider).
 * Default: tinted solid (100) — max readability; Clear slider = full liquid glass.
 */
(function liquidGlassBoot() {
  const root = document.documentElement;
  const DEFAULT_TINT = 100;
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
    // Storage unavailable — default tinted solid.
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
    // Product-grade clear glass (readable, still translucent) — mirrors liquid-glass-tokens.js
    const cLift = t / 0.12;
    root.style.setProperty('--lg-card-light-alpha', `${Math.round(70 + cLift * 6)}%`);
    root.style.setProperty('--lg-card-dark-alpha', `${Math.round(68 + cLift * 6)}%`);
    root.style.setProperty('--lg-specular-light', `${Math.round(76 + clear * 12)}%`);
    root.style.setProperty('--lg-specular-dark', `${Math.round(18 + clear * 8)}%`);
    root.style.setProperty('--lg-card-shadow-light', `${Math.round(8 + clear * 5)}%`);
    root.style.setProperty('--lg-card-shadow-dark', `${Math.round(38 + clear * 8)}%`);
    root.style.setProperty('--lg-card-highlight-light', `${Math.round(78 + clear * 10)}%`);
    root.style.setProperty('--lg-card-highlight-dark', `${Math.round(18 + clear * 8)}%`);
    root.style.setProperty('--lg-light-fill', `${52 + cLift * 10}%`);
    root.style.setProperty('--lg-dark-fill', `${48 + cLift * 12}%`);
    root.style.setProperty('--lg-nav-light-fill', `${46 + cLift * 8}%`);
    root.style.setProperty('--lg-nav-dark-fill', `${44 + cLift * 8}%`);
    root.style.setProperty('--lg-card-light-fill', `${66 + cLift * 8}%`);
    root.style.setProperty('--lg-card-dark-fill', `${64 + cLift * 8}%`);
    root.style.setProperty('--lg-border-light', `${Math.round(10 + cLift * 4)}%`);
    root.style.setProperty('--lg-border-dark', `${Math.round(14 + cLift * 4)}%`);
    root.style.setProperty('--lg-hairline-light', 'rgb(0 0 0 / 10%)');
    root.style.setProperty('--lg-hairline-dark', 'rgb(255 255 255 / 14%)');
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
    root.style.setProperty('--lg-card-light-alpha', `${Math.round(52 + t * 38)}%`);
    root.style.setProperty('--lg-card-dark-alpha', `${Math.round(50 + t * 38)}%`);
    root.style.setProperty('--lg-specular-light', `${Math.round(54 + clear * 22)}%`);
    root.style.setProperty('--lg-specular-dark', `${Math.round(12 + clear * 10)}%`);
    root.style.setProperty('--lg-card-shadow-light', `${Math.round(9 + clear * 7)}%`);
    root.style.setProperty('--lg-card-shadow-dark', `${Math.round(38 + clear * 10)}%`);
    root.style.setProperty('--lg-card-highlight-light', `${Math.round(58 + clear * 20)}%`);
    root.style.setProperty('--lg-card-highlight-dark', `${Math.round(12 + clear * 10)}%`);
    root.style.setProperty('--lg-light-fill', `${40 + t * 42}%`);
    root.style.setProperty('--lg-dark-fill', `${38 + t * 42}%`);
    root.style.setProperty('--lg-nav-light-fill', `${38 + t * 44}%`);
    root.style.setProperty('--lg-nav-dark-fill', `${36 + t * 44}%`);
    root.style.setProperty('--lg-card-light-fill', `${48 + t * 40}%`);
    root.style.setProperty('--lg-card-dark-fill', `${46 + t * 40}%`);
    root.style.setProperty('--lg-border-light', `${Math.round(32 + clear * 14 + t * 8)}%`);
    root.style.setProperty('--lg-border-dark', `${Math.round(14 + clear * 8 + t * 6)}%`);
  }
})();

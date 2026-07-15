/**
 * Sync WWDC26 Liquid Glass custom properties from tint ratio (0–1).
 * Apple material model:
 *  - clear    (≤0.12): highly translucent liquid glass, strong blur
 *  - balanced (0.12–0.88): frosted liquid glass (default site look)
 *  - tinted   (≥0.88): dense frost for max readability
 * prefers-reduced-transparency: force near-solid via CSS (not here).
 */
export function syncLiquidGlassTokens(tintRatio, { instant = false } = {}) {
  const t = Math.min(1, Math.max(0, Number(tintRatio)));
  const clear = 1 - t;
  const root = document.documentElement;

  if (instant) {
    root.classList.add('lg-tint-instant');
  }

  const style = root.style;

  style.setProperty('--lg-tint', String(t));

  // Blur is strongest when glass is clearest (Apple: deep optical blur)
  style.setProperty('--lg-blur-nav', `${22 + clear * 28}px`);
  style.setProperty('--lg-blur-panel', `${26 + clear * 32}px`);
  style.setProperty('--lg-blur-card', `${20 + clear * 30}px`);
  style.setProperty('--lg-blur-control', `${14 + clear * 18}px`);
  style.setProperty('--lg-saturate', `${155 + clear * 55}%`);

  if (t <= 0.12) {
    root.dataset.lgMode = 'clear';
    // True clear liquid glass — light material, high refraction feel
    style.setProperty('--lg-light-fill', `${8 + t * 40}%`);
    style.setProperty('--lg-dark-fill', `${12 + t * 36}%`);
    style.setProperty('--lg-nav-light-fill', `${10 + t * 36}%`);
    style.setProperty('--lg-nav-dark-fill', `${14 + t * 34}%`);
    style.setProperty('--lg-card-light-fill', `${14 + t * 42}%`);
    style.setProperty('--lg-card-dark-fill', `${18 + t * 40}%`);
    style.setProperty('--lg-card-light-alpha', `${Math.round(22 + t * 28)}%`);
    style.setProperty('--lg-card-dark-alpha', `${Math.round(26 + t * 28)}%`);
    style.setProperty('--lg-card-highlight-light', `${Math.round(72 + clear * 18)}%`);
    style.setProperty('--lg-card-highlight-dark', `${Math.round(14 + clear * 10)}%`);
    style.setProperty('--lg-card-shadow-light', `${Math.round(10 + clear * 8)}%`);
    style.setProperty('--lg-card-shadow-dark', `${Math.round(48 + clear * 10)}%`);
    style.setProperty('--lg-specular-light', `${Math.round(68 + clear * 22)}%`);
    style.setProperty('--lg-specular-dark', `${Math.round(12 + clear * 12)}%`);
    style.setProperty('--lg-border-light', `${Math.round(28 + clear * 22)}%`);
    style.setProperty('--lg-border-dark', `${Math.round(10 + clear * 12)}%`);
  } else if (t >= 0.88) {
    root.dataset.lgMode = 'tinted';
    // Dense frost — still glass, higher opacity for long-form reading
    style.setProperty('--lg-light-fill', `${72 + (t - 0.88) * 180}%`);
    style.setProperty('--lg-dark-fill', `${70 + (t - 0.88) * 180}%`);
    style.setProperty('--lg-nav-light-fill', `${74 + (t - 0.88) * 160}%`);
    style.setProperty('--lg-nav-dark-fill', `${72 + (t - 0.88) * 160}%`);
    style.setProperty('--lg-card-light-fill', `${78 + (t - 0.88) * 140}%`);
    style.setProperty('--lg-card-dark-fill', `${76 + (t - 0.88) * 140}%`);
    style.setProperty('--lg-card-light-alpha', `${Math.round(82 + t * 14)}%`);
    style.setProperty('--lg-card-dark-alpha', `${Math.round(80 + t * 14)}%`);
    style.setProperty('--lg-card-highlight-light', `${Math.round(48 + t * 20)}%`);
    style.setProperty('--lg-card-highlight-dark', `${Math.round(10 + t * 8)}%`);
    style.setProperty('--lg-card-shadow-light', `${Math.round(6 + clear * 6)}%`);
    style.setProperty('--lg-card-shadow-dark', `${Math.round(36 + clear * 10)}%`);
    style.setProperty('--lg-specular-light', `${Math.round(36 + clear * 20)}%`);
    style.setProperty('--lg-specular-dark', `${Math.round(8 + clear * 8)}%`);
    style.setProperty('--lg-border-light', `${Math.round(22 + t * 18)}%`);
    style.setProperty('--lg-border-dark', `${Math.round(12 + t * 10)}%`);
  } else {
    root.dataset.lgMode = 'balanced';
    // Signature Apple frosted liquid glass
    style.setProperty('--lg-light-fill', `${18 + t * 48}%`);
    style.setProperty('--lg-dark-fill', `${22 + t * 46}%`);
    style.setProperty('--lg-nav-light-fill', `${16 + t * 50}%`);
    style.setProperty('--lg-nav-dark-fill', `${20 + t * 48}%`);
    style.setProperty('--lg-card-light-fill', `${24 + t * 46}%`);
    style.setProperty('--lg-card-dark-fill', `${28 + t * 44}%`);
    style.setProperty('--lg-card-light-alpha', `${Math.round(32 + t * 42)}%`);
    style.setProperty('--lg-card-dark-alpha', `${Math.round(36 + t * 40)}%`);
    style.setProperty('--lg-card-highlight-light', `${Math.round(52 + clear * 30)}%`);
    style.setProperty('--lg-card-highlight-dark', `${Math.round(10 + clear * 12)}%`);
    style.setProperty('--lg-card-shadow-light', `${Math.round(9 + clear * 9)}%`);
    style.setProperty('--lg-card-shadow-dark', `${Math.round(42 + clear * 12)}%`);
    style.setProperty('--lg-specular-light', `${Math.round(58 + clear * 30)}%`);
    style.setProperty('--lg-specular-dark', `${Math.round(10 + clear * 12)}%`);
    style.setProperty('--lg-border-light', `${Math.round(24 + clear * 20 + t * 10)}%`);
    style.setProperty('--lg-border-dark', `${Math.round(10 + clear * 10 + t * 8)}%`);
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

/** Default site material — balanced liquid glass (Apple-like). */
export const DEFAULT_LIQUID_GLASS_TINT = 42;

/**
 * Sync WWDC26 Liquid Glass custom properties from tint ratio (0–1).
 * Apple material model:
 *  - clear    (≤0.12): highly translucent liquid glass sitewide
 *  - balanced (0.12–0.88): frosted liquid glass
 *  - tinted   (≥0.88): solid surfaces (default — max readability)
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
    // Clear liquid glass — product-grade (readable like tinted, still real glass).
    // Apple materials: dense frost + strong blur + specular edge, not ultra-thin film.
    const cLift = t / 0.12; // 0→1 across clear band
    // Dense frost: readable on solid white/black canvas, still glassy vs tinted solid
    style.setProperty('--lg-light-fill', `${52 + cLift * 10}%`);
    style.setProperty('--lg-dark-fill', `${48 + cLift * 12}%`);
    // Nav slightly more translucent than cards so scroll content reads through the island
    style.setProperty('--lg-nav-light-fill', `${46 + cLift * 8}%`);
    style.setProperty('--lg-nav-dark-fill', `${44 + cLift * 8}%`);
    style.setProperty('--lg-card-light-fill', `${66 + cLift * 8}%`);
    style.setProperty('--lg-card-dark-fill', `${64 + cLift * 8}%`);
    style.setProperty('--lg-card-light-alpha', `${Math.round(70 + cLift * 6)}%`);
    style.setProperty('--lg-card-dark-alpha', `${Math.round(68 + cLift * 6)}%`);
    style.setProperty('--lg-card-highlight-light', `${Math.round(78 + clear * 10)}%`);
    style.setProperty('--lg-card-highlight-dark', `${Math.round(18 + clear * 8)}%`);
    style.setProperty('--lg-card-shadow-light', `${Math.round(8 + clear * 5)}%`);
    style.setProperty('--lg-card-shadow-dark', `${Math.round(38 + clear * 8)}%`);
    style.setProperty('--lg-specular-light', `${Math.round(76 + clear * 12)}%`);
    style.setProperty('--lg-specular-dark', `${Math.round(18 + clear * 8)}%`);
    // Border tokens: light uses dark hairline opacity, dark uses white hairline opacity
    style.setProperty('--lg-border-light', `${Math.round(10 + cLift * 4)}%`);
    style.setProperty('--lg-border-dark', `${Math.round(14 + cLift * 4)}%`);
    style.setProperty('--lg-hairline-light', 'rgb(0 0 0 / 10%)');
    style.setProperty('--lg-hairline-dark', 'rgb(255 255 255 / 14%)');
  } else if (t >= 0.88) {
    root.dataset.lgMode = 'tinted';
    // Tinted endpoint — near-solid frosted materials (max readability, Apple “opaque” material)
    const tintLift = (t - 0.88) / 0.12; // 0→1 across tinted band
    style.setProperty('--lg-light-fill', `${88 + tintLift * 12}%`);
    style.setProperty('--lg-dark-fill', `${86 + tintLift * 14}%`);
    style.setProperty('--lg-nav-light-fill', `${90 + tintLift * 10}%`);
    style.setProperty('--lg-nav-dark-fill', `${88 + tintLift * 12}%`);
    style.setProperty('--lg-card-light-fill', `${92 + tintLift * 8}%`);
    style.setProperty('--lg-card-dark-fill', `${90 + tintLift * 10}%`);
    style.setProperty('--lg-card-light-alpha', `${Math.round(94 + tintLift * 6)}%`);
    style.setProperty('--lg-card-dark-alpha', `${Math.round(92 + tintLift * 8)}%`);
    style.setProperty('--lg-card-highlight-light', `${Math.round(28 + clear * 12)}%`);
    style.setProperty('--lg-card-highlight-dark', `${Math.round(6 + clear * 6)}%`);
    style.setProperty('--lg-card-shadow-light', `${Math.round(4 + clear * 4)}%`);
    style.setProperty('--lg-card-shadow-dark', `${Math.round(28 + clear * 8)}%`);
    style.setProperty('--lg-specular-light', `${Math.round(22 + clear * 12)}%`);
    style.setProperty('--lg-specular-dark', `${Math.round(6 + clear * 6)}%`);
    style.setProperty('--lg-border-light', `${Math.round(18 + t * 8)}%`);
    style.setProperty('--lg-border-dark', `${Math.round(10 + t * 6)}%`);
  } else {
    root.dataset.lgMode = 'balanced';
    // Balanced — bridge clear frost → tinted solid (smooth slider)
    style.setProperty('--lg-light-fill', `${40 + t * 42}%`);
    style.setProperty('--lg-dark-fill', `${38 + t * 42}%`);
    style.setProperty('--lg-nav-light-fill', `${38 + t * 44}%`);
    style.setProperty('--lg-nav-dark-fill', `${36 + t * 44}%`);
    style.setProperty('--lg-card-light-fill', `${48 + t * 40}%`);
    style.setProperty('--lg-card-dark-fill', `${46 + t * 40}%`);
    style.setProperty('--lg-card-light-alpha', `${Math.round(52 + t * 38)}%`);
    style.setProperty('--lg-card-dark-alpha', `${Math.round(50 + t * 38)}%`);
    style.setProperty('--lg-card-highlight-light', `${Math.round(58 + clear * 20)}%`);
    style.setProperty('--lg-card-highlight-dark', `${Math.round(12 + clear * 10)}%`);
    style.setProperty('--lg-card-shadow-light', `${Math.round(9 + clear * 7)}%`);
    style.setProperty('--lg-card-shadow-dark', `${Math.round(38 + clear * 10)}%`);
    style.setProperty('--lg-specular-light', `${Math.round(54 + clear * 22)}%`);
    style.setProperty('--lg-specular-dark', `${Math.round(12 + clear * 10)}%`);
    style.setProperty('--lg-border-light', `${Math.round(32 + clear * 14 + t * 8)}%`);
    style.setProperty('--lg-border-dark', `${Math.round(14 + clear * 8 + t * 6)}%`);
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

/** Default site material — tinted solid (max readability). Slider → Clear for full liquid glass. */
export const DEFAULT_LIQUID_GLASS_TINT = 100;

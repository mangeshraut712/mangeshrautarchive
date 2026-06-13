/** Sync WWDC26 Liquid Glass custom properties when --lg-tint changes via the a11y slider. */
export function syncLiquidGlassTokens(tintRatio, { instant = false } = {}) {
  const t = Math.min(1, Math.max(0, Number(tintRatio)));
  const root = document.documentElement;
  const clear = 1 - t;

  if (instant) {
    root.classList.add('lg-tint-instant');
  }

  const style = root.style;

  style.setProperty('--lg-tint', String(t));

  // Clear = heavy blur + low fill (see-through reflections). Tinted = light blur + high fill (frosted).
  style.setProperty('--lg-blur-nav', `${10 + clear * 38}px`);
  style.setProperty('--lg-blur-panel', `${14 + clear * 42}px`);
  style.setProperty('--lg-blur-card', `${12 + clear * 36}px`);
  style.setProperty('--lg-blur-control', `${6 + clear * 22}px`);
  style.setProperty('--lg-saturate', `${132 + clear * 88}%`);
  style.setProperty('--lg-light-fill', `${6 + t * 76}%`);
  style.setProperty('--lg-dark-fill', `${10 + t * 74}%`);
  style.setProperty('--lg-nav-light-fill', `${4 + t * 78}%`);
  style.setProperty('--lg-nav-dark-fill', `${8 + t * 76}%`);
  style.setProperty('--lg-card-light-fill', `${18 + t * 76}%`);
  style.setProperty('--lg-card-dark-fill', `${24 + t * 68}%`);
  style.setProperty('--lg-card-light-alpha', `${18 + t * 76}%`);
  style.setProperty('--lg-card-dark-alpha', `${24 + t * 68}%`);
  style.setProperty('--lg-specular-light', `${58 + clear * 38}%`);
  style.setProperty('--lg-specular-dark', `${6 + clear * 14}%`);
  style.setProperty('--lg-border-light', `${18 + clear * 28 + t * 12}%`);
  style.setProperty('--lg-border-dark', `${6 + clear * 10 + t * 8}%`);

  if (t <= 0.12) {
    root.dataset.lgMode = 'clear';
  } else if (t >= 0.88) {
    root.dataset.lgMode = 'tinted';
  } else {
    root.dataset.lgMode = 'balanced';
  }

  if (instant) {
    requestAnimationFrame(() => {
      root.classList.remove('lg-tint-instant');
    });
  }
}

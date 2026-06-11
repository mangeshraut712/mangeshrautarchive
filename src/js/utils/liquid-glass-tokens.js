/** Sync WWDC26 Liquid Glass custom properties when --lg-tint changes via the a11y slider. */
export function syncLiquidGlassTokens(tintRatio) {
  const t = Math.min(1, Math.max(0, Number(tintRatio)));
  const root = document.documentElement.style;

  root.setProperty('--lg-tint', String(t));
  root.setProperty('--lg-blur-nav', `${14 + (1 - t) * 16}px`);
  root.setProperty('--lg-blur-panel', `${26 + (1 - t) * 28}px`);
  root.setProperty('--lg-blur-card', `${20 + (1 - t) * 24}px`);
  root.setProperty('--lg-blur-control', `${10 + (1 - t) * 14}px`);
  root.setProperty('--lg-saturate', `${155 + (1 - t) * 45}%`);
  root.setProperty('--lg-light-fill', `${44 + t * 52}%`);
  root.setProperty('--lg-dark-fill', `${50 + t * 48}%`);
  root.setProperty('--lg-card-light-fill', `${62 + t * 32}%`);
  root.setProperty('--lg-card-dark-fill', `${68 + t * 28}%`);
}

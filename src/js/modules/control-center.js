/** Control Center panel for uses page — toggles glass, haptics, text size, AOD dim. */

const STORAGE_KEYS = {
  haptics: 'mr-haptics-enabled',
  aod: 'mr-aod-dim-enabled',
};

function readBool(key, fallback = true) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
  } catch (_error) {
    // ignore
  }
  return fallback;
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch (_error) {
    // ignore
  }
}

function initControlCenter() {
  const grid = document.getElementById('uses-grid');
  if (!grid || document.getElementById('uses-control-center')) return;

  const panel = document.createElement('section');
  panel.id = 'uses-control-center';
  panel.className = 'uses-control-center lg-glass-card';
  panel.innerHTML = `
    <header class="uses-control-center__header">
      <p class="uses-control-center__eyebrow">Control Center</p>
      <h2 class="uses-control-center__title">Site preferences</h2>
    </header>
    <div class="uses-control-center__grid" role="group" aria-label="Site controls">
      <button type="button" class="uses-control-tile" data-control="glass-clear"><i class="fas fa-droplet"></i><span>Clear glass</span></button>
      <button type="button" class="uses-control-tile" data-control="glass-tinted"><i class="fas fa-square"></i><span>Tinted glass</span></button>
      <button type="button" class="uses-control-tile" data-control="text-up"><i class="fas fa-text-height"></i><span>Larger text</span></button>
      <button type="button" class="uses-control-tile" data-control="text-down"><i class="fas fa-text-width"></i><span>Smaller text</span></button>
      <button type="button" class="uses-control-tile" data-control="haptics"><i class="fas fa-hand-pointer"></i><span>Haptics</span></button>
      <button type="button" class="uses-control-tile" data-control="aod"><i class="fas fa-moon"></i><span>AOD dim</span></button>
    </div>`;

  grid.insertAdjacentElement('beforebegin', panel);

  const applyTint = async value => {
    const { syncLiquidGlassTokens } = await import('../utils/liquid-glass-tokens.js');
    syncLiquidGlassTokens(value / 100);
    try {
      localStorage.setItem('wwdc26-liquid-glass-tint', String(value));
    } catch (_error) {
      // ignore
    }
    const chrome = await import('./liquid-glass-chrome.js');
    chrome.syncLiquidGlassChrome?.();
  };

  panel.addEventListener('click', async event => {
    const tile = event.target.closest('[data-control]');
    if (!tile) return;
    const control = tile.dataset.control;
    const root = document.documentElement;

    if (control === 'glass-clear') await applyTint(8);
    if (control === 'glass-tinted') await applyTint(100);
    if (control === 'text-up') {
      const size = parseFloat(getComputedStyle(root).fontSize) * 1.08;
      root.style.fontSize = `${size}px`;
    }
    if (control === 'text-down') {
      const size = parseFloat(getComputedStyle(root).fontSize) * 0.92;
      root.style.fontSize = `${size}px`;
    }
    if (control === 'haptics') {
      const next = !readBool(STORAGE_KEYS.haptics, true);
      writeBool(STORAGE_KEYS.haptics, next);
      tile.classList.toggle('is-active', next);
    }
    if (control === 'aod') {
      const next = !readBool(STORAGE_KEYS.aod, false);
      writeBool(STORAGE_KEYS.aod, next);
      root.classList.toggle('aod-dim', next && root.classList.contains('dark'));
      tile.classList.toggle('is-active', next);
    }
  });

  panel
    .querySelector('[data-control="haptics"]')
    ?.classList.toggle('is-active', readBool(STORAGE_KEYS.haptics, true));
  panel
    .querySelector('[data-control="aod"]')
    ?.classList.toggle('is-active', readBool(STORAGE_KEYS.aod, false));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initControlCenter, { once: true });
} else {
  initControlCenter();
}

export default initControlCenter;

/**
 * Shared helpers for clearing portfolio-owned browser storage.
 * Keeps unrelated app data intact while removing stale portfolio state.
 */

const PORTFOLIO_STORAGE_KEYS = [
  'portfolio-version',
  'portfolio-theme',
  'wwdc26-liquid-glass-tint',
  'portfolio-sw-cleanup-v20260509',
  'portfolio-sw-cleanup-v20260615',
];

const PORTFOLIO_SESSION_KEYS = ['portfolio-session'];

function clearPortfolioStorage() {
  if (typeof window === 'undefined') return;

  try {
    const storage = window.localStorage;
    PORTFOLIO_STORAGE_KEYS.forEach(key => storage.removeItem(key));
  } catch (_error) {
    // Storage access can fail in privacy-restricted contexts; ignore and keep the page usable.
  }

  try {
    const storage = window.sessionStorage;
    PORTFOLIO_SESSION_KEYS.forEach(key => storage.removeItem(key));
  } catch (_error) {
    // Storage access can fail in privacy-restricted contexts; ignore and keep the page usable.
  }
}

export { clearPortfolioStorage };

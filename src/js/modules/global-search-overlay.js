/**
 * Ensures command palette DOM exists on any page, then boots PortfolioSearch.
 */

const OVERLAY_HTML = `
<div id="search-overlay" role="dialog" aria-modal="true" aria-label="Command palette" hidden>
  <div class="search-overlay-backdrop" data-search-close></div>
  <div class="search-panel">
    <div class="search-header">
      <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
      <input id="search-input" type="search" placeholder="Search pages, writing, projects, actions…" autocomplete="off" spellcheck="false" aria-label="Search" />
      <button id="search-close" type="button" aria-label="Close search"><i class="fas fa-xmark" aria-hidden="true"></i></button>
    </div>
    <div id="search-results" role="listbox" aria-label="Search results"></div>
    <p class="search-footer-hint">↑↓ to move · Enter to open · Esc to close · ⌘K anytime</p>
  </div>
</div>
<button id="search-toggle" type="button" hidden aria-hidden="true" tabindex="-1" aria-label="Open command palette"></button>`;

export function ensureSearchOverlay() {
  if (document.getElementById('search-overlay')) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = OVERLAY_HTML.trim();
  while (wrapper.firstChild) {
    document.body.appendChild(wrapper.firstChild);
  }
}

export async function initGlobalSearch() {
  ensureSearchOverlay();
  if (!window.portfolioSearch) {
    const { PortfolioSearch } = await import('./search.js');
    window.portfolioSearch = new PortfolioSearch();
  }
  return window.portfolioSearch;
}

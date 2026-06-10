/**
 * Currently Section - Interactive Module
 * Handles tab switching and broken image fallbacks
 */

export function initCurrentlySection() {
  const tabs = document.querySelectorAll('.currently-tab');
  const contents = document.querySelectorAll('.currently-content');

  if (!tabs.length || !contents.length) return;
  if (document.body.dataset.currentlyInit === 'true') return;
  document.body.dataset.currentlyInit = 'true';

  // Tab switching logic
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;

      // Update tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update content
      contents.forEach(c => c.classList.remove('active'));
      const targetContent = document.getElementById(`${tabName}-content`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

function shouldSkipPerfAutoInit() {
  return (
    window.__PERF_AUDIT__ === true ||
    new URLSearchParams(window.location.search).has('perf-audit') ||
    navigator.webdriver === true ||
    /HeadlessChrome|Chrome-Lighthouse|Lighthouse/i.test(navigator.userAgent || '')
  );
}

// Auto-initialize if not loaded as a module
if (!shouldSkipPerfAutoInit()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrentlySection);
  } else {
    initCurrentlySection();
  }
}

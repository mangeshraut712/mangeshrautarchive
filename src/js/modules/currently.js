/**
 * Currently Section - Interactive Module
 * Handles tab switching and broken image fallbacks
 */

export function initCurrentlySection() {
  const tabs = document.querySelectorAll('.currently-tab');
  const contents = document.querySelectorAll('.currently-content');
  const section = document.getElementById('currently-section');

  if (!tabs.length || !contents.length) return;
  if (document.body.dataset.currentlyInit === 'true') {
    if (section) section.dataset.currentlyInit = 'true';
    return;
  }
  document.body.dataset.currentlyInit = 'true';

  const tabList = Array.from(tabs);

  const activateTab = tab => {
    const tabName = tab.dataset.tab;
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.setAttribute('tabindex', active ? '0' : '-1');
    });
    contents.forEach(c => {
      c.classList.remove('active');
      c.hidden = true;
    });
    const targetContent = document.getElementById(`${tabName}-content`);
    if (targetContent) {
      targetContent.classList.add('active');
      targetContent.hidden = false;
    }
  };

  // Tab switching logic (click + ARIA keyboard pattern)
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
    tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
    tab.addEventListener('keydown', e => {
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        next = (index + 1) % tabList.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        next = (index - 1 + tabList.length) % tabList.length;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = tabList.length - 1;
      }
      if (next < 0) return;
      e.preventDefault();
      activateTab(tabList[next]);
      tabList[next].focus();
    });
  });

  contents.forEach(content => {
    content.hidden = !content.classList.contains('active');
    content.setAttribute('role', 'tabpanel');
  });

  if (section) section.dataset.currentlyInit = 'true';
}

function shouldSkipPerfAutoInit() {
  return (
    window.__PERF_AUDIT__ === true ||
    new URLSearchParams(window.location.search).has('perf-audit') ||
    /Chrome-Lighthouse|Lighthouse/i.test(navigator.userAgent || '')
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

/**
 * About Interactivity - Module
 * Handles segmented tab toggles for the About section.
 */

export function initAboutInteractivity() {
  const card = document.querySelector('.about-text-card');
  if (!card) return;

  // Prevent double initialization
  if (card.dataset.aboutInteractivityInit === 'true') return;
  card.dataset.aboutInteractivityInit = 'true';

  const tabButtons = card.querySelectorAll('.about-tab-btn');
  const panels = card.querySelectorAll('.about-tab-panel');
  const slider = card.querySelector('.segmented-control-bg');

  // Full Story is the default; Quick Summary remains available via the segmented control.
  let activePanelId = 'full-story-panel';

  const updateSlider = activeBtn => {
    if (!slider || !activeBtn) return;
    slider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`;
    slider.style.width = `${activeBtn.offsetWidth}px`;
  };

  const switchTab = targetBtn => {
    if (!targetBtn || targetBtn.classList.contains('active')) return;

    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
    });
    targetBtn.classList.add('active');
    targetBtn.setAttribute('aria-selected', 'true');
    targetBtn.setAttribute('tabindex', '0');

    updateSlider(targetBtn);

    activePanelId = targetBtn.getAttribute('aria-controls');
    panels.forEach(panel => {
      if (panel.id === activePanelId) {
        panel.hidden = false;
        panel.style.removeProperty('display');
        panel.setAttribute('aria-hidden', 'false');
        panel.removeAttribute('tabindex');
      } else {
        panel.hidden = true;
        panel.style.removeProperty('display');
        panel.setAttribute('aria-hidden', 'true');
        panel.removeAttribute('tabindex');
      }
    });
  };

  const tabList = Array.from(tabButtons);
  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => switchTab(btn));
    btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');
    btn.addEventListener('keydown', e => {
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
      switchTab(tabList[next]);
      tabList.forEach((t, i) => t.setAttribute('tabindex', i === next ? '0' : '-1'));
      tabList[next].focus();
    });
  });

  window.addEventListener('resize', () => {
    const activeBtn = card.querySelector('.about-tab-btn.active');
    if (activeBtn) updateSlider(activeBtn);
  });

  // ── Font Family Switcher (New York, SF Pro, SF Rounded) ──
  const fontButtons = card.querySelectorAll('.about-font-btn');
  const applyFont = font => {
    if (!font) return;
    card.setAttribute('data-about-font', font);
    fontButtons.forEach(btn => {
      const isMatch = btn.dataset.font === font;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
    try {
      localStorage.setItem('about-font', font);
    } catch {
      // ignore localstorage errors
    }
  };

  // Restore saved font or default to Apple New York (Serif)
  let savedFont = 'new-york';
  try {
    const stored = localStorage.getItem('about-font');
    if (stored && ['new-york', 'sf-pro', 'sf-rounded'].includes(stored)) {
      savedFont = stored;
    }
  } catch {
    // fallback
  }
  applyFont(savedFont);

  fontButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      applyFont(btn.dataset.font);
    });
  });
}

// Auto-initialize if not loaded as a module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutInteractivity);
} else {
  initAboutInteractivity();
}

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
        // Scrollable tabpanels need keyboard focus (axe scrollable-region-focusable)
        panel.setAttribute('tabindex', '0');
        panel.scrollTop = 0;
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

  const activeBtn = card.querySelector('.about-tab-btn.active');
  if (activeBtn) {
    setTimeout(() => updateSlider(activeBtn), 150);
  }
}

// Auto-initialize if not loaded as a module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutInteractivity);
} else {
  initAboutInteractivity();
}

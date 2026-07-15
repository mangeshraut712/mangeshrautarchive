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
    });
    targetBtn.classList.add('active');
    targetBtn.setAttribute('aria-selected', 'true');

    updateSlider(targetBtn);

    activePanelId = targetBtn.getAttribute('aria-controls');
    panels.forEach(panel => {
      if (panel.id === activePanelId) {
        panel.style.display = 'block';
        panel.setAttribute('aria-hidden', 'false');
        panel.scrollTop = 0;
      } else {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn));
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

/**
 * Apple-Style Resume Dropdown Interactivity
 * Manages toggle state, click-outside handling, and keyboard navigation (Escape, Arrow keys)
 */

export function initResumeDropdown() {
  const wrapper = document.querySelector('.resume-dropdown-wrapper');
  const toggle = document.getElementById('resume-dropdown-toggle');
  const menu = document.getElementById('resume-dropdown-menu');

  if (!wrapper || !toggle || !menu) return;

  function openMenu() {
    wrapper.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    wrapper.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }

  function toggleMenu(e) {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains('is-open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  toggle.addEventListener('click', toggleMenu);

  // Close on item click
  const items = menu.querySelectorAll('.resume-dropdown-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close on click outside
  document.addEventListener('click', e => {
    if (!wrapper.contains(e.target)) {
      closeMenu();
    }
  });

  // Keyboard navigation: Escape closes menu
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && wrapper.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResumeDropdown);
  } else {
    initResumeDropdown();
  }
}

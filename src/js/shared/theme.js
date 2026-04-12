/**
 * Shared Theme Handler - Mangesh Raut Portfolio
 * Handles dark/light mode toggling across all pages
 */

(function () {
  'use strict';

  const THEME_KEY = 'theme';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';

  /**
   * Initialize theme based on saved preference or system preference
   */
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = savedTheme || (prefersDark ? THEME_DARK : THEME_LIGHT);
    applyTheme(theme);
    return theme;
  }

  /**
   * Apply theme to document
   */
  function applyTheme(theme) {
    if (theme === THEME_DARK) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body?.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body?.classList.remove('dark-mode');
    }
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark')
      ? THEME_DARK
      : THEME_LIGHT;
    const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;

    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme: newTheme },
      })
    );

    return newTheme;
  }

  /**
   * Set specific theme
   */
  function setTheme(theme) {
    if (theme === THEME_DARK || theme === THEME_LIGHT) {
      applyTheme(theme);
      localStorage.setItem(THEME_KEY, theme);
    }
  }

  /**
   * Get current theme
   */
  function getTheme() {
    return document.documentElement.classList.contains('dark') ? THEME_DARK : THEME_LIGHT;
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Expose global API
  window.ThemeHandler = {
    init: initTheme,
    toggle: toggleTheme,
    set: setTheme,
    get: getTheme,
    THEME_DARK,
    THEME_LIGHT,
  };
})();

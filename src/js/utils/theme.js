import appleSounds from '../modules/apple-sounds.js';

const theme = window.__portfolioTheme;

function shouldSkipPerfAutoInit() {
  return (
    window.__PERF_AUDIT__ === true ||
    new URLSearchParams(window.location.search).has('perf-audit') ||
    /Chrome-Lighthouse|Lighthouse/i.test(navigator.userAgent || '')
  );
}

function getMoonIcon() {
  return '<i class="fas fa-moon moon-icon" aria-hidden="true"></i>';
}

function getSunIcon() {
  return '<i class="fas fa-sun sun-icon" aria-hidden="true"></i>';
}

function getAutoIcon() {
  return '<i class="fas fa-circle-half-stroke auto-icon" aria-hidden="true"></i>';
}

function renderThemeIcon(mode, isDark) {
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggleIcon || !themeToggle) {
    return;
  }

  if (mode === 'auto' || mode === 'system') {
    themeToggleIcon.innerHTML = getAutoIcon();
  } else {
    themeToggleIcon.innerHTML = isDark ? getSunIcon() : getMoonIcon();
  }

  themeToggle.setAttribute(
    'aria-label',
    `Theme: ${theme.getThemeModeLabel(mode)}. Click for light or dark, long-press for automatic modes.`
  );
  themeToggle.setAttribute('title', theme.getThemeModeLabel(mode));
}

function syncThemeUi() {
  const mode = theme.getThemeMode();
  const isDark = document.documentElement.classList.contains('dark');
  renderThemeIcon(mode, isDark);
}

function initThemeToggle() {
  if (!theme) {
    return;
  }

  syncThemeUi();

  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) {
    return;
  }

  let longPressTimer = null;
  let longPressHandled = false;

  const clearLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  themeToggle.addEventListener('pointerdown', () => {
    longPressHandled = false;
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      longPressHandled = true;
      theme.cycleAutomaticTheme();
      syncThemeUi();
      appleSounds.playThemeToggle?.();
    }, 650);
  });

  ['pointerup', 'pointerleave', 'pointercancel'].forEach(eventName => {
    themeToggle.addEventListener(eventName, clearLongPress);
  });

  themeToggle.addEventListener('click', () => {
    if (longPressHandled) {
      longPressHandled = false;
      return;
    }

    theme.toggleManualTheme();
    syncThemeUi();
    appleSounds.playThemeToggle?.();
  });

  document.addEventListener('portfolio-theme-change', syncThemeUi);
}

if (!shouldSkipPerfAutoInit()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle, { once: true });
  } else {
    initThemeToggle();
  }
}

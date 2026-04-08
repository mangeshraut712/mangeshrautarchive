// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.getElementById('theme-toggle-icon');

function applyThemeState(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (document.body) {
    document.body.classList.toggle('dark-mode', isDark);
  }
}

function getMoonIcon() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
    </svg>
  `;
}

function getSunIcon() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  `;
}

function renderThemeIcon(isDark) {
  if (!themeToggleIcon) return;
  themeToggleIcon.innerHTML = isDark ? getSunIcon() : getMoonIcon();
}

function setInitialTheme() {
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  applyThemeState(isDark);
  renderThemeIcon(isDark);
}

function initThemeToggle() {
  setInitialTheme();

  if (!themeToggle) {
    return;
  }

  themeToggle.addEventListener('click', () => {
    const isDark = !document.documentElement.classList.contains('dark');
    applyThemeState(isDark);
    renderThemeIcon(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// Initialize theme toggle on load
document.addEventListener('DOMContentLoaded', initThemeToggle);

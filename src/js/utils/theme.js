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
  return '<i class="fas fa-moon moon-icon" aria-hidden="true"></i>';
}

function getSunIcon() {
  return '<i class="fas fa-sun sun-icon" aria-hidden="true"></i>';
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

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const themeColorMetas = Array.from(document.querySelectorAll('meta[name="theme-color"]'));

function syncBrowserChromeColor(isDark) {
  const color = isDark ? '#000000' : '#ffffff';
  themeColorMetas.forEach(meta => {
    meta.setAttribute('content', color);
    meta.removeAttribute('media');
  });

  document.documentElement.style.backgroundColor = color;
  if (document.body) {
    document.body.style.backgroundColor = color;
  }
}

function applyThemeState(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (document.body) {
    document.body.classList.toggle('dark-mode', isDark);
  }
  syncBrowserChromeColor(isDark);
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

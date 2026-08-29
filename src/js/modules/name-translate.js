/**
 * Native Language Name Translation (English <-> Marathi)
 * Allows users to toggle Mangesh Raut's name between English ("Mangesh Raut")
 * and native Marathi script ("मंगेश राऊत") with smooth Apple typography transitions.
 */

const STORAGE_KEY = 'portfolio-name-lang';
const TEXT_EN = 'Mangesh Raut';
const TEXT_MR = 'मंगेश राऊत';

/**
 * Initialize the interactive name translation on the hero heading.
 */
export function initNameTranslate() {
  const heading = document.getElementById('home-heading');
  const nameText = heading?.querySelector('.hero-name-text');

  if (!heading || !nameText) {
    return;
  }

  // Load persisted language preference or default to English
  let currentLang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mr' || saved === 'en') {
      currentLang = saved;
    }
  } catch {
    currentLang = 'en';
  }

  function applyLanguage(lang, animate = false) {
    currentLang = lang;
    const isMarathi = lang === 'mr';
    const text = isMarathi ? TEXT_MR : TEXT_EN;
    const titleHint = isMarathi
      ? 'Click to translate to English'
      : 'Click to translate to Marathi (मराठी)';
    const ariaLabel = isMarathi
      ? 'Mangesh Raut (displayed in Marathi script: मंगेश राऊत). Click to translate to English.'
      : 'Mangesh Raut. Click to translate to native Marathi script (मंगेश राऊत).';

    heading.setAttribute('aria-label', ariaLabel);
    heading.setAttribute('title', titleHint);
    heading.setAttribute('role', 'button');
    heading.setAttribute('tabindex', '0');
    heading.classList.add('hero-name--interactive');

    if (animate) {
      nameText.classList.add('hero-name-text--flipping');
      setTimeout(() => {
        nameText.textContent = text;
        nameText.setAttribute('lang', lang);
        if (isMarathi) {
          nameText.classList.add('is-marathi');
        } else {
          nameText.classList.remove('is-marathi');
        }
        nameText.classList.remove('hero-name-text--flipping');
      }, 150);
    } else {
      nameText.textContent = text;
      nameText.setAttribute('lang', lang);
      if (isMarathi) {
        nameText.classList.add('is-marathi');
      } else {
        nameText.classList.remove('is-marathi');
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable
    }
  }

  function toggleLanguage() {
    const nextLang = currentLang === 'en' ? 'mr' : 'en';
    applyLanguage(nextLang, true);
  }

  // Click & touch interactions
  heading.addEventListener('click', e => {
    // Avoid interfering if the user clicks directly on the audio pronounce button
    if (e.target.closest('#name-pronounce-btn') || e.target.closest('.name-pronounce-btn')) {
      return;
    }
    toggleLanguage();
  });

  // Keyboard accessibility (Enter or Space)
  heading.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('#name-pronounce-btn') || e.target.closest('.name-pronounce-btn')) {
        return;
      }
      e.preventDefault();
      toggleLanguage();
    }
  });

  // Initialize initial state without animation
  applyLanguage(currentLang, false);
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNameTranslate);
  } else {
    initNameTranslate();
  }
}

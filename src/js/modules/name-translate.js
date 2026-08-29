/**
 * Native Language Name Translation (English <-> Marathi)
 * Fast, instant toggle between English ("Mangesh Raut") and native Marathi script ("मंगेश राऊत"),
 * mirroring the instant interactive behavior of the avatar toggle.
 */

const STORAGE_KEY = 'portfolio-name-lang';
const TEXT_EN = 'Mangesh Raut';
const TEXT_MR = 'मंगेश राऊत';

export function applyNameLanguage(lang) {
  const heading = document.getElementById('home-heading');
  const nameText =
    heading?.querySelector('.hero-name-text') || document.querySelector('.hero-name-text');
  const translateBtn = document.getElementById('name-translate-btn');

  if (!nameText) {
    return;
  }

  const isMarathi = lang === 'mr';
  const text = isMarathi ? TEXT_MR : TEXT_EN;
  const nextTarget = isMarathi ? 'English' : 'Marathi (मराठी)';
  const titleHint = `Click to translate name to ${nextTarget}`;
  const ariaLabel = isMarathi
    ? 'मंगेश राऊत (Marathi). Click to translate to English.'
    : 'Mangesh Raut (English). Click to translate to native Marathi script (मंगेश राऊत).';

  // Instant synchronous text update
  nameText.textContent = text;
  nameText.setAttribute('lang', isMarathi ? 'mr' : 'en');

  if (isMarathi) {
    nameText.classList.add('is-marathi');
    heading?.classList.add('is-marathi-mode');
    translateBtn?.classList.add('is-active');
  } else {
    nameText.classList.remove('is-marathi');
    heading?.classList.remove('is-marathi-mode');
    translateBtn?.classList.remove('is-active');
  }

  if (heading) {
    heading.setAttribute('aria-label', ariaLabel);
    heading.setAttribute('title', titleHint);
    heading.setAttribute('role', 'button');
    heading.setAttribute('tabindex', '0');
    heading.classList.add('hero-name--interactive');
  }

  if (translateBtn) {
    translateBtn.setAttribute('title', titleHint);
    translateBtn.setAttribute('aria-label', `Translate name to ${nextTarget}`);
    translateBtn.setAttribute('aria-pressed', isMarathi ? 'true' : 'false');
  }

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage unavailable
  }
}

export function toggleNameLanguage() {
  let currentLang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mr' || saved === 'en') {
      currentLang = saved;
    }
  } catch {
    currentLang = 'en';
  }

  const nextLang = currentLang === 'en' ? 'mr' : 'en';
  applyNameLanguage(nextLang);
  return nextLang;
}

export function initNameTranslate() {
  // Bind global handler for instant onclick invocation
  window.__toggleHeroName = event => {
    if (event) {
      if (
        event.target &&
        (event.target.closest('#name-pronounce-btn') || event.target.closest('.name-pronounce-btn'))
      ) {
        return;
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.stopPropagation) {
        event.stopPropagation();
      }
    }
    toggleNameLanguage();
  };

  const heading = document.getElementById('home-heading');
  const translateBtn = document.getElementById('name-translate-btn');

  // Load saved preference
  let initialLang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mr' || saved === 'en') {
      initialLang = saved;
    }
  } catch {
    initialLang = 'en';
  }

  applyNameLanguage(initialLang);

  // Keyboard accessibility on heading (Enter or Space)
  if (heading && !heading.dataset.translateBound) {
    heading.dataset.translateBound = 'true';
    heading.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('#name-pronounce-btn') || e.target.closest('.name-pronounce-btn')) {
          return;
        }
        e.preventDefault();
        toggleNameLanguage();
      }
    });
  }

  // Keyboard accessibility on translate button
  if (translateBtn && !translateBtn.dataset.translateBound) {
    translateBtn.dataset.translateBound = 'true';
    translateBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleNameLanguage();
      }
    });
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNameTranslate);
  } else {
    initNameTranslate();
  }
}

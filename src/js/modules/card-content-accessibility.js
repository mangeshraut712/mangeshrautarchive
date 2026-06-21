/**
 * Card Content Accessibility — Listen + Translate toolbars for narrative cards.
 * Apple-style read-aloud with paragraph highlighting and multilingual translation.
 */

const SPEAK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';

const TRANSLATE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>';

const RESTORE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', source: true },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ar', label: 'Arabic', native: 'العربية', rtl: true },
  { code: 'ur', label: 'Urdu', native: 'اردو', rtl: true },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
];

const TTS_LOCALE = {
  en: 'en-US',
  es: 'es-ES',
  mr: 'mr-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN',
  ar: 'ar-SA',
  ur: 'ur-PK',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  id: 'id-ID',
};

const REMOVED_CARD_SELECTORS = ['.education-content', '.publication-card'];

const CARD_PROFILES = [
  {
    selector: '.about-text-card',
    toolbarAnchor: '.about-card-header',
    contentRoot: card =>
      card.querySelector('.about-tab-panel:not([aria-hidden="true"])') ||
      card.querySelector('.about-tab-panel') ||
      card,
    blocks: '.highlight-target, .about-paragraph, .summary-item, .about-intro-title',
    watchTabs: true,
  },
  {
    selector: '.experience-content',
    toolbarMode: 'inline',
    blocks: 'li span',
  },
  {
    selector: '.award-card',
    toolbarAnchor: '.award-content',
    toolbarMode: 'inline',
    blocks: '.award-title, .award-description, .award-institution, .award-issuer',
  },
  {
    selector: '.recommendation-card',
    toolbarMode: 'inline',
    blocks: '.recommendation-text, .author-name, .author-title, .author-company',
  },
  {
    selector: '.blog-card',
    toolbarAnchor: '.blog-card-actions',
    toolbarMode: 'inline',
    blocks: '.blog-title, .blog-summary, .blog-card-quote, .blog-highlight-list li',
    dynamic: true,
  },
  {
    selector: '.blog-article',
    toolbarAnchor: '.article-header',
    toolbarMode: 'inline',
    blocks:
      '.article-title, .article-promise, .article-body p, .article-body li, .article-body h2, .article-body h3, .article-body blockquote',
    dynamic: true,
  },
  {
    selector: '.travel-stop',
    toolbarMode: 'inline',
    blocks:
      '.travel-stop__name, .travel-stop__tagline, .travel-stop__story, .travel-stop__detail-text, .place-guide-card__body p, .place-guide-card__body h4, .place-guide__header p',
    dynamic: true,
  },
];

const translationCache = new Map();
const activeCards = new WeakMap();
let observer = null;
let openPopover = null;

function getLanguageMeta(code) {
  return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[0];
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function supportsSpeech() {
  return 'speechSynthesis' in window;
}

function getChatApiUrl() {
  const configured = window.APP_CONFIG?.apiBaseUrl;
  if (configured) {
    return `${String(configured).replace(/\/$/, '')}/api/chat`;
  }
  return `${window.location.origin}/api/chat`;
}

function canUseAiTranslation() {
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app') ||
    Boolean(window.APP_CONFIG?.apiBaseUrl)
  );
}

function chunkText(text, size = 420) {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];
  if (normalized.length <= size) return [normalized];

  const chunks = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    let end = Math.min(cursor + size, normalized.length);
    if (end < normalized.length) {
      const slice = normalized.slice(cursor, end);
      const lastSpace = slice.lastIndexOf(' ');
      if (lastSpace > size * 0.55) {
        end = cursor + lastSpace;
      }
    }
    chunks.push(normalized.slice(cursor, end).trim());
    cursor = end;
  }
  return chunks.filter(Boolean);
}

async function translateViaMyMemory(text, targetLang) {
  const chunks = chunkText(text);
  const translated = [];

  for (const chunk of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${encodeURIComponent(targetLang)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Translation request failed');
    }
    const payload = await response.json();
    const piece = payload?.responseData?.translatedText;
    if (!piece) {
      throw new Error('Translation unavailable');
    }
    translated.push(piece);
  }

  return translated.join(' ');
}

async function translateViaAi(text, langMeta) {
  if (!canUseAiTranslation()) {
    throw new Error('AI translation unavailable');
  }

  const response = await fetch(getChatApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: window.location.origin,
    },
    body: JSON.stringify({
      message: `Translate the following English text into ${langMeta.label} (${langMeta.native}). Return ONLY the translated text with no quotes, labels, or commentary:\n\n${text}`,
      messages: [],
      context: { mode: 'card-translate', targetLang: langMeta.code },
      stream: false,
    }),
    signal: AbortSignal.timeout(28000),
  });

  if (!response.ok) {
    throw new Error(`AI translation failed (${response.status})`);
  }

  const payload = await response.json();
  const translated =
    payload?.answer ||
    payload?.response ||
    payload?.message ||
    payload?.content ||
    payload?.choices?.[0]?.message?.content ||
    '';

  const cleaned = String(translated).trim();
  if (!cleaned) {
    throw new Error('AI translation empty');
  }
  return cleaned;
}

async function translateText(text, targetLang) {
  if (!text?.trim() || targetLang === 'en') {
    return text;
  }

  const cacheKey = `${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const langMeta = getLanguageMeta(targetLang);

  try {
    const memoryResult = await translateViaMyMemory(text, targetLang);
    if (memoryResult && memoryResult.toLowerCase() !== text.trim().toLowerCase()) {
      translationCache.set(cacheKey, memoryResult);
      return memoryResult;
    }
  } catch (error) {
    console.warn('MyMemory translation fallback to AI:', error);
  }

  const aiResult = await translateViaAi(text, langMeta);
  translationCache.set(cacheKey, aiResult);
  return aiResult;
}

function pickVoice(langCode = 'en') {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const locale = TTS_LOCALE[langCode] || TTS_LOCALE.en;
  const prefix = locale.split('-')[0];

  return (
    voices.find(voice => voice.lang === locale) ||
    voices.find(voice => voice.lang.startsWith(`${prefix}-`)) ||
    voices.find(voice => voice.lang.startsWith(prefix)) ||
    voices.find(
      voice =>
        voice.lang.startsWith('en') &&
        /siri|enhanced|natural|premium|samantha|alex|karen|daniel/i.test(voice.name)
    ) ||
    voices.find(voice => voice.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
}

function speakText(text, langCode = 'en') {
  return new Promise(resolve => {
    if (!supportsSpeech() || !text?.trim()) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    const locale = TTS_LOCALE[langCode] || TTS_LOCALE.en;
    utterance.lang = locale;
    utterance.rate = prefersReducedMotion() ? 1 : langCode === 'en' ? 0.94 : 0.92;
    utterance.pitch = 1;
    utterance.volume = 0.92;
    const voice = pickVoice(langCode);
    if (voice) utterance.voice = voice;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

function getBlocks(card, profile) {
  const root = profile.contentRoot?.(card) || card;
  const nodes = Array.from(root.querySelectorAll(profile.blocks)).filter(node => {
    const text = node.textContent?.replace(/\s+/g, ' ').trim();
    return text && text.length > 2;
  });

  nodes.forEach(node => node.classList.add('highlight-target'));
  return nodes;
}

function buildToolbar(card, profile) {
  const toolbar = document.createElement('div');
  toolbar.className = 'card-read-toolbar';
  if (profile.toolbarMode === 'inline') {
    toolbar.classList.add('card-read-toolbar--inline');
  }
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Read and translate content');

  const speakBtn = document.createElement('button');
  speakBtn.type = 'button';
  speakBtn.className = 'card-speak-btn about-speak-btn';
  speakBtn.setAttribute('aria-pressed', 'false');
  speakBtn.setAttribute('aria-label', 'Listen to this card');
  speakBtn.title = 'Listen';
  speakBtn.innerHTML = `${SPEAK_ICON}<span class="sr-only">Listen</span>`;

  const translateWrap = document.createElement('div');
  translateWrap.className = 'card-translate-wrap';

  const translateBtn = document.createElement('button');
  translateBtn.type = 'button';
  translateBtn.className = 'card-translate-btn';
  translateBtn.setAttribute('aria-expanded', 'false');
  translateBtn.setAttribute('aria-label', 'Translate this card');
  translateBtn.title = 'Translate';
  translateBtn.innerHTML = `${TRANSLATE_ICON}<span class="sr-only">Translate</span>`;

  const popover = document.createElement('div');
  popover.className = 'card-translate-popover';
  popover.hidden = true;
  popover.innerHTML = `
    <p class="card-translate-popover__title">Translate to</p>
    <div class="card-translate-popover__scroll" tabindex="0" role="listbox" aria-label="Translation languages">
      <div class="card-translate-popover__grid">
        ${LANGUAGES.map(
          lang => `
            <button type="button" class="card-translate-option" data-lang="${lang.code}" role="option">
              <span class="card-translate-option__native"${lang.rtl ? ' dir="rtl"' : ''}>${lang.native}</span>
              <span class="card-translate-option__label">${lang.label}</span>
            </button>`
        ).join('')}
      </div>
    </div>
  `;

  translateWrap.appendChild(translateBtn);
  translateWrap.appendChild(popover);
  toolbar.appendChild(speakBtn);
  toolbar.appendChild(translateWrap);

  const state = {
    card,
    profile,
    toolbar,
    speakBtn,
    translateBtn,
    popover,
    restoreBtn: null,
    speaking: false,
    translatedLang: 'en',
    blocks: [],
  };

  speakBtn.addEventListener('click', () => toggleSpeak(state));
  translateBtn.addEventListener('click', event => {
    event.stopPropagation();
    togglePopover(state);
  });

  popover.querySelectorAll('.card-translate-option').forEach(option => {
    option.addEventListener('click', async event => {
      event.stopPropagation();
      const lang = option.getAttribute('data-lang');
      if (!lang) return;
      await applyTranslation(state, lang, option);
    });
  });

  activeCards.set(card, state);

  toolbar.addEventListener('click', event => {
    event.stopPropagation();
  });

  return toolbar;
}

function refreshBlocks(state) {
  state.blocks = getBlocks(state.card, state.profile);
}

function markActiveLanguage(state, langCode) {
  state.popover.querySelectorAll('.card-translate-option').forEach(option => {
    option.classList.toggle('is-active', option.getAttribute('data-lang') === langCode);
    option.setAttribute(
      'aria-selected',
      option.getAttribute('data-lang') === langCode ? 'true' : 'false'
    );
  });
}

async function toggleSpeak(state) {
  if (!supportsSpeech()) return;

  if (state.speaking) {
    window.speechSynthesis.cancel();
    stopSpeak(state);
    return;
  }

  refreshBlocks(state);
  if (!state.blocks.length) return;

  const speakLang = state.translatedLang || 'en';

  state.speaking = true;
  state.card.classList.add('speech-active', 'card-readable');
  state.speakBtn.classList.add('is-speaking');
  state.speakBtn.setAttribute('aria-pressed', 'true');
  window.speechSynthesis.cancel();

  for (const block of state.blocks) {
    if (!state.speaking) break;
    block.classList.add('is-speaking');
    await speakText(block.textContent, speakLang);
    block.classList.remove('is-speaking');
  }

  stopSpeak(state);
}

function stopSpeak(state) {
  state.speaking = false;
  state.card.classList.remove('speech-active');
  state.speakBtn.classList.remove('is-speaking');
  state.speakBtn.setAttribute('aria-pressed', 'false');
  state.blocks.forEach(block => block.classList.remove('is-speaking'));
}

function closePopover(state) {
  if (!state?.popover) return;
  state.popover.hidden = true;
  state.translateBtn.setAttribute('aria-expanded', 'false');
  if (openPopover === state) {
    openPopover = null;
  }
}

function togglePopover(state) {
  if (openPopover && openPopover !== state) {
    closePopover(openPopover);
  }

  const willOpen = state.popover.hidden;
  state.popover.hidden = !willOpen;
  state.translateBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  markActiveLanguage(state, state.translatedLang || 'en');
  openPopover = willOpen ? state : null;
}

function ensureRestoreButton(state) {
  if (state.restoreBtn) return state.restoreBtn;

  const restoreBtn = document.createElement('button');
  restoreBtn.type = 'button';
  restoreBtn.className = 'card-restore-btn';
  restoreBtn.hidden = true;
  restoreBtn.setAttribute('aria-label', 'Show original text');
  restoreBtn.title = 'Show original';
  restoreBtn.innerHTML = `${RESTORE_ICON}<span class="sr-only">Show original</span>`;
  restoreBtn.addEventListener('click', () => restoreOriginal(state));
  state.toolbar.insertBefore(restoreBtn, state.toolbar.firstChild);
  state.restoreBtn = restoreBtn;
  return restoreBtn;
}

async function applyTranslation(state, lang, optionButton) {
  if (lang === 'en') {
    restoreOriginal(state);
    closePopover(state);
    markActiveLanguage(state, 'en');
    return;
  }

  refreshBlocks(state);
  if (!state.blocks.length) return;

  optionButton.classList.add('is-loading');
  closePopover(state);

  try {
    for (const block of state.blocks) {
      if (block.dataset.originalText == null) {
        block.dataset.originalText = block.textContent;
      }
      const translated = await translateText(block.dataset.originalText, lang);
      block.textContent = translated;
    }

    state.translatedLang = lang;
    state.card.classList.add('is-translated', 'card-readable');
    const langMeta = getLanguageMeta(lang);
    state.blocks.forEach(block => {
      block.dir = langMeta.rtl ? 'rtl' : 'ltr';
    });
    ensureRestoreButton(state).hidden = false;
    markActiveLanguage(state, lang);
  } catch (error) {
    console.warn('Card translation failed:', error);
    state.translateBtn.title = 'Translation failed — try again';
    window.setTimeout(() => {
      state.translateBtn.title = 'Translate';
    }, 3200);
  } finally {
    optionButton.classList.remove('is-loading');
  }
}

function restoreOriginal(state) {
  refreshBlocks(state);
  state.blocks.forEach(block => {
    if (block.dataset.originalText != null) {
      block.textContent = block.dataset.originalText;
    }
    block.removeAttribute('dir');
  });
  state.translatedLang = 'en';
  state.card.classList.remove('is-translated');
  if (state.restoreBtn) {
    state.restoreBtn.hidden = true;
  }
  markActiveLanguage(state, 'en');
}

function removeToolbar(card) {
  card.querySelector('.card-read-toolbar')?.remove();
  delete card.dataset.cardReadableInit;
  card.classList.remove('card-readable', 'is-translated', 'speech-active');
}

function cleanupRemovedProfiles(root = document) {
  REMOVED_CARD_SELECTORS.forEach(selector => {
    root.querySelectorAll(selector).forEach(removeToolbar);
  });
}

function mountToolbar(card, profile) {
  if (card.dataset.cardReadableInit === 'true') {
    return;
  }

  card.dataset.cardReadableInit = 'true';
  card.classList.add('card-readable');

  const toolbar = buildToolbar(card, profile);
  const anchor = profile.toolbarAnchor ? card.querySelector(profile.toolbarAnchor) : null;

  if (anchor) {
    if (profile.toolbarMode === 'inline') {
      anchor.insertBefore(toolbar, anchor.firstChild);
    } else {
      anchor.appendChild(toolbar);
    }
  } else {
    card.insertBefore(toolbar, card.firstChild);
  }

  refreshBlocks(activeCards.get(card));
  markActiveLanguage(activeCards.get(card), 'en');

  if (profile.watchTabs) {
    card.querySelectorAll('.about-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        window.setTimeout(() => {
          const cardState = activeCards.get(card);
          if (!cardState) return;
          if (cardState.translatedLang && cardState.translatedLang !== 'en') {
            restoreOriginal(cardState);
          }
          refreshBlocks(cardState);
        }, 40);
      });
    });
  }
}

function scanCards(root = document) {
  cleanupRemovedProfiles(root);
  CARD_PROFILES.forEach(profile => {
    root.querySelectorAll(profile.selector).forEach(card => mountToolbar(card, profile));
  });
}

function bindGlobalHandlers() {
  if (window.__cardContentAccessibilityBound) return;
  window.__cardContentAccessibilityBound = true;

  document.addEventListener('click', event => {
    if (openPopover && !event.target.closest('.card-translate-wrap')) {
      closePopover(openPopover);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openPopover) {
      closePopover(openPopover);
    }
  });

  if (supportsSpeech()) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {}, { once: true });
  }

  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        scanCards(node);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function initCardContentAccessibility() {
  if (window.__cardContentAccessibilityReady) {
    rescanCardContentAccessibility();
    return;
  }

  window.__cardContentAccessibilityReady = true;
  bindGlobalHandlers();
  scanCards(document);
}

export function rescanCardContentAccessibility(root = document) {
  scanCards(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardContentAccessibility, { once: true });
} else {
  initCardContentAccessibility();
}

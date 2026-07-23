/**
 * Right-dock AssistMe chrome for subpages: go-to-top + chatbot toggle/panel.
 * Mirrors homepage IDs so go-to-top.js / chatbot.js work unchanged.
 */

import { sitePath } from '../utils/site-base.js';

const ASSISTANT_CSS = [
  '/assets/css/ai-assistant.css?v=20260722hide1',
  '/assets/css/ai-assistant-mobile.css?v=20260722hide1',
];

const CRITICAL_HIDE_STYLE_ID = 'assistme-critical-hide';

function ensureCriticalHideStyles() {
  if (document.getElementById(CRITICAL_HIDE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = CRITICAL_HIDE_STYLE_ID;
  // Sync hide BEFORE the widget enters the DOM — subpages lack homepage critical CSS,
  // so an unstyled #chatbot-widget flashes open until ai-assistant.css arrives.
  style.textContent = `
    #chatbot-widget.hidden,
    #chatbot-backdrop.hidden {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    #go-to-top:not(.visible) {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

function ensureStylesheet(href) {
  const resolved = href.startsWith('/') ? sitePath(href) : href;
  const file = resolved.split('?')[0].split('/').pop();
  const exists = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link =>
    (link.getAttribute('href') || '').includes(file)
  );
  if (exists) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = resolved;
  document.head.appendChild(link);
}

function ensureAssistMeStyles() {
  ensureCriticalHideStyles();
  ASSISTANT_CSS.forEach(ensureStylesheet);
}

function ensureGoToTopButton() {
  if (document.getElementById('go-to-top')) return;
  const button = document.createElement('button');
  button.id = 'go-to-top';
  button.type = 'button';
  button.setAttribute('aria-label', 'Go to top');
  button.title = 'Go to top';
  button.setAttribute('aria-hidden', 'true');
  button.tabIndex = -1;
  button.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
  document.body.appendChild(button);
}

function markChromeClosed(el) {
  if (!el) return;
  el.classList.add('hidden');
  el.classList.remove('visible', 'active');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('inert', '');
  el.style.setProperty('display', 'none', 'important');
}

function ensureChatbotChrome() {
  ensureCriticalHideStyles();

  if (document.getElementById('chatbot-toggle') && document.getElementById('chatbot-widget')) {
    markChromeClosed(document.getElementById('chatbot-widget'));
    markChromeClosed(document.getElementById('chatbot-backdrop'));
    return;
  }

  if (!document.getElementById('chatbot-toggle')) {
    const toggle = document.createElement('button');
    toggle.id = 'chatbot-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open AI Assistant');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'chatbot-widget');
    toggle.innerHTML = `
      <span class="inline-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>
        </svg>
      </span>
    `;
    document.body.appendChild(toggle);
  }

  if (!document.getElementById('chatbot-backdrop')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'chatbot-backdrop';
    backdrop.className = 'chatbot-backdrop hidden';
    markChromeClosed(backdrop);
    document.body.appendChild(backdrop);
  } else {
    markChromeClosed(document.getElementById('chatbot-backdrop'));
  }

  if (!document.getElementById('chatbot-widget')) {
    const widget = document.createElement('div');
    widget.id = 'chatbot-widget';
    widget.className = 'hidden';
    widget.setAttribute('role', 'dialog');
    widget.setAttribute('aria-modal', 'true');
    widget.setAttribute('aria-label', 'Apple Intelligence chat window');
    widget.tabIndex = -1;
    markChromeClosed(widget);
    widget.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-brand">
          <div class="chatbot-header-main">
            <div class="chatbot-title-row">
              <span class="siri-orb" aria-hidden="true"></span>
              <h3 class="chatbot-title">AssistMe</h3>
            </div>
            <div class="chatbot-header-actions">
              <button class="chatbot-settings-btn" aria-label="Privacy &amp; Settings" type="button"
                title="Privacy &amp; Personal Intelligence Settings" id="chatbot-privacy-btn">
                <i class="fas fa-shield-alt" aria-hidden="true"></i>
              </button>
              <button class="chatbot-settings-btn chatbot-clear-btn" aria-label="Hold to clear chat"
                title="Hold to clear conversation" type="button" id="chatbot-clear-btn">
                <span class="hold-confirm-fill" aria-hidden="true"></span>
                <i class="fas fa-trash-alt" aria-hidden="true"></i>
              </button>
              <button class="chatbot-close-btn" aria-label="Close chat" type="button">
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id="chatbot-messages" role="log" aria-live="polite" aria-relevant="additions" aria-busy="false"></div>
      <div class="chatbot-input-container">
        <form id="chatbot-form" class="chatbot-composer">
          <div class="input-wrapper" id="chatbot-input-wrapper">
            <button type="button" id="chatbot-voice-btn" class="chatbot-voice-btn"
              aria-label="Dictate message" aria-pressed="false"
              title="Tap to dictate · Hold to talk">
              <i class="fas fa-microphone" aria-hidden="true"></i>
              <span class="siri-voice-ring" aria-hidden="true"></span>
            </button>
            <label for="chatbot-input" class="sr-only">Message AssistMe</label>
            <textarea id="chatbot-input" placeholder="Ask anything..." rows="1" autocomplete="off"
              maxlength="1800" aria-describedby="chatbot-dictation-status chatbot-rate-status"></textarea>
            <button type="button" id="chatbot-plus-btn" class="chatbot-plus-btn"
              aria-label="Add to message" aria-expanded="false" aria-haspopup="menu" title="Add to message">
              <i class="fas fa-plus" aria-hidden="true"></i>
            </button>
            <input type="file" id="chatbot-attach-input" class="sr-only"
              accept="image/png,image/jpeg,image/webp,image/gif" />
            <button type="submit" class="chatbot-send-btn" aria-label="Send message">
              <i class="fas fa-arrow-up" aria-hidden="true"></i>
            </button>
          </div>
          <div id="chatbot-dictation-dock" class="chatbot-dictation-dock" hidden>
            <div class="dictation-waveform" data-dictation-waveform aria-hidden="true"></div>
            <div class="dictation-dock-body">
              <span class="dictation-dock-label" data-dictation-label>Listening</span>
              <div class="dictation-dock-actions">
                <button type="button" class="dictation-dock-btn is-ghost" data-dictation-action="discard">Discard</button>
                <button type="button" class="dictation-dock-btn" data-dictation-action="polish">Polish</button>
                <button type="button" class="dictation-dock-btn is-primary" data-dictation-action="send">Send</button>
              </div>
            </div>
          </div>
          <div id="chatbot-composer-status" class="chatbot-composer-status is-idle" role="status" aria-live="polite" hidden>
            <span class="composer-status-chip" data-chip="agent" data-state="idle" hidden>
              <span class="composer-status-dot" aria-hidden="true"></span>
              <span class="composer-status-label">Working</span>
            </span>
            <span class="composer-status-chip" data-chip="realtime" data-state="off" hidden>
              <span class="composer-status-dot" aria-hidden="true"></span>
              <span class="composer-status-label">Voice</span>
            </span>
          </div>
          <p id="chatbot-dictation-status" class="chatbot-dictation-status" aria-live="polite"></p>
          <p id="chatbot-rate-status" class="chatbot-rate-status" aria-live="polite"></p>
        </form>
      </div>
    `;
    document.body.appendChild(widget);
  } else {
    markChromeClosed(document.getElementById('chatbot-widget'));
  }
}

function bindLazyChatbot() {
  const toggle = document.getElementById('chatbot-toggle');
  if (!toggle || toggle.dataset.lazyModuleBound === 'true') return;
  toggle.dataset.lazyModuleBound = 'true';

  let loading = false;

  toggle.addEventListener(
    'click',
    async event => {
      if (window.appleIntelligenceChatbot) return;
      if (loading) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      loading = true;
      ensureAssistMeStyles();

      try {
        const mod = await import('../modules/chatbot.js');
        const bot = mod.initAppleIntelligenceChatbot?.();
        // Open directly — do NOT replay toggle.click(). A synthetic click bubbles to the
        // document outside-click closer and can open-then-immediately-close the panel.
        loading = false;
        if (bot && !bot.isOpen) {
          bot.openWidget();
        }
      } catch (_error) {
        loading = false;
      }
    },
    { capture: true }
  );
}

async function initAssistMeChrome() {
  ensureCriticalHideStyles();
  ensureGoToTopButton();
  ensureChatbotChrome();
  ensureAssistMeStyles();
  bindLazyChatbot();

  try {
    await import('../utils/go-to-top.js');
  } catch (_error) {
    /* go-to-top is optional chrome */
  }
}

export { initAssistMeChrome, ensureChatbotChrome, ensureGoToTopButton };

/**
 * Apple Intelligence Chatbot — 2026 Premium Edition
 * Enhanced with streaming responses, Markdown support, voice input,
 * contextual follow-up chips, agentic action detection, thinking animation,
 * auto-retry on empty responses, and condensed metadata.
 *
 * Improvements (27 Feb 2026):
 *   - Thinking + Generating + Streaming 3-stage animation
 *   - Agentic action detection with visual notification chips
 *   - Auto-retry on empty responses (1 silent retry before showing error)
 *   - Condensed metadata: model + runtime in one row, expandable details
 *   - Enhanced welcome with capability badges (AI/ML, RAG, Portfolio, Agents)
 *   - Quick-action row for immediate commands (Resume, GitHub, Navigate)
 *   - Improved follow-up chip sets with AI/ML domain-specific suggestions
 */

import { privacyDashboard } from './privacy-dashboard.js';
import { intelligentAssistant as chatAssistant } from '../core/chat.js';
import { limits } from '../core/config.js';
import { markdownService } from '../services/MarkdownService.js';
import { ChatScrollEngine } from '../utils/chat-scroll-engine.js';
import appleSounds from './apple-sounds.js';

const MAX_CHAT_INPUT_LENGTH = 1800;
const CLIENT_CHAT_MESSAGE_LIMIT = limits.dailyChatMessages;
const CLIENT_CHAT_RATE_KEY = 'assistme-chat-rate-v1';
const TRUSTED_ICON_CLASS = /^fa-[a-z0-9-]+$/i;

function stripUnsafeControlCharacters(value) {
  return Array.from(value)
    .filter(char => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join('');
}

// ── Context-aware follow-up chip sets ──────────────────────
const FOLLOWUP_CHIPS = {
  skills: ['🔧 Top frameworks?', '☁️ Cloud & DevOps?', '🤖 AI/ML expertise?'],
  experience: ['🏢 Current role?', '📈 Key achievements?', '🌍 Industry domains?'],
  projects: ['📁 Show all projects', '⭐ Most impactful?', '🛠️ Tech stack used?'],
  education: ['🎓 GPA & Honors?', '📚 Specialisations?', '🔬 Research work?'],
  contact: ['📧 Email address?', '🔗 LinkedIn?', '📄 Download resume'],
  publications: ['📄 Published papers?', '🔬 Research areas?', '🏆 Conference talks?'],
  certifications: ['🏅 AWS certified?', '☕ Java certifications?', '📊 ML certs?'],
  aiml: ['🧠 ML models used?', '📊 Data pipeline?', '🔮 NLP experience?'],
  agents: ['🤖 What can you do?', '📋 Schedule meeting', '📥 Download resume'],
  default: ['👨‍💻 About Mangesh', '🚀 Top projects', '🧠 AI/ML skills'],
};

function inferFollowupContext(assistantText) {
  const t = (assistantText || '').toLowerCase();
  if (
    /\b(tensorflow|pytorch|scikit|ml model|neural|nlp|deep learning|ai|machine learning)\b/.test(t)
  )
    return 'aiml';
  if (/\b(skill|stack|language|framework|proficient|expertise)\b/.test(t)) return 'skills';
  if (/\b(experience|role|company|achievement|position|engineer)\b/.test(t)) return 'experience';
  if (/\b(project|repo|github|built|developed)\b/.test(t)) return 'projects';
  if (/\b(degree|university|gpa|education|drexel|pune)\b/.test(t)) return 'education';
  if (/\b(contact|email|linkedin|phone|reach)\b/.test(t)) return 'contact';
  if (/\b(paper|publication|ieee|research)\b/.test(t)) return 'publications';
  if (/\b(certif|aws cloud|oracle|tensorflow dev)\b/.test(t)) return 'certifications';
  if (/\b(navigate|resume|download|schedule|action)\b/.test(t)) return 'agents';
  return 'default';
}

function normalizeFollowupPrompt(label) {
  if (!label || typeof label !== 'string') return '';
  return label.replace(/^[^A-Za-z0-9]+/, '').trim();
}

// ── Apple Intelligence Writing Tools (WWDC26) ──────────────────
const WRITING_TOOLS = [
  {
    id: 'proofread',
    icon: 'fa-spell-check',
    label: 'Proofread',
    instruction:
      'Proofread the following message. Fix spelling, grammar, and punctuation only. Reply with ONLY the corrected text, nothing else:',
  },
  {
    id: 'friendly',
    icon: 'fa-face-smile',
    label: 'Friendly',
    instruction:
      'Rewrite the following message in a warm, friendly tone. Keep it short. Reply with ONLY the rewritten text, nothing else:',
  },
  {
    id: 'professional',
    icon: 'fa-briefcase',
    label: 'Professional',
    instruction:
      'Rewrite the following message in a clear, professional tone. Reply with ONLY the rewritten text, nothing else:',
  },
  {
    id: 'concise',
    icon: 'fa-compress',
    label: 'Concise',
    instruction:
      'Rewrite the following message to be as concise as possible while keeping the meaning. Reply with ONLY the rewritten text, nothing else:',
  },
];

// On-screen awareness: section id → contextual prompt (Siri AI, WWDC26)
const SECTION_CONTEXT_PROMPTS = {
  about: ['About Me', 'Give me a quick intro to Mangesh'],
  skills: ['Skills', "What are Mangesh's strongest skills?"],
  experience: ['Experience', "Walk me through Mangesh's work experience"],
  projects: ['Projects', "What are Mangesh's most impressive projects?"],
  education: ['Education', "Tell me about Mangesh's education"],
  publications: ['Publications', 'What research has Mangesh published?'],
  certifications: ['Certifications', 'Which certifications does Mangesh hold?'],
  blog: ['Blog', 'What does Mangesh write about?'],
  contact: ['Contact', 'How do I get in touch with Mangesh?'],
};

// ── Agentic action patterns ──────────────────────
const AGENTIC_PATTERNS = [
  {
    pattern: /\b(download|get)\s+(my\s+)?resume\b/i,
    action: 'resume',
    icon: '📥',
    label: 'Download Resume',
  },
  {
    pattern:
      /\b(navigate|go|scroll)\s+(to\s+)?(projects?|skills?|about|contact|experience|education)\b/i,
    action: 'navigate',
    icon: '🧭',
    label: 'Navigate',
  },
  {
    pattern: /\b(schedule|book|set\s*up)\s+(a\s+)?(meeting|call|chat)\b/i,
    action: 'schedule',
    icon: '📅',
    label: 'Schedule Meeting',
  },
  {
    pattern: /\b(copy|share)\s+(email|contact|phone)\b/i,
    action: 'copy',
    icon: '📋',
    label: 'Copy Contact',
  },
  {
    pattern: /\b(open|visit|show)\s+(github|linkedin|portfolio)\b/i,
    action: 'social',
    icon: '🔗',
    label: 'Open Link',
  },
  {
    pattern: /\b(search|find|filter)\s+(for\s+)?/i,
    action: 'search',
    icon: '🔍',
    label: 'Search',
  },
  {
    pattern: /\btheme\b|\b(dark|light)\s*mode\b/i,
    action: 'theme',
    icon: '🎨',
    label: 'Toggle Theme',
  },
];

class AppleIntelligenceChatbot {
  constructor() {
    this.elements = this.initializeElements();
    this.isOpen = false;
    this.isProcessing = false;
    this.chatAPI = null;
    this.recognition = null;
    this.isListening = false;
    this.dictationBase = '';
    this.autoSendOnFinal = true;
    this.dictationSendTimer = null;
    this.lastUserMessage = '';
    this.messageCount = 0;
    this.retryCount = 0;
    this.textareaWidth = 0;
    this.scrollEngine = null;

    // Local rate-limit visibility mirrors the backend throttle before requests are sent.
    this.maxSessionMessages = CLIENT_CHAT_MESSAGE_LIMIT;
    this.lastFocusedElement = null;

    if (!this.elements.widget || !this.elements.toggle) {
      console.error('Chatbot elements not found');
      return;
    }

    this.scrollEngine = new ChatScrollEngine(this.elements.messages, {
      widgetEl: this.elements.widget,
      announce: message => this.announceScroll(message),
    });
    this.scrollEngine.bind();

    // Wait for chat API to be available
    this.waitForChatAPI();
    this.initVoiceRecognition();
    this.bindEvents();
    this.addWelcomeMessage();
    this.preloadSpeechVoices();

    // Set initial rate limit badge state
    this.updateRateLimitBadge();
  }

  getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  getRemainingQueries() {
    try {
      const stored = JSON.parse(localStorage.getItem(CLIENT_CHAT_RATE_KEY) || '{}');
      if (stored.date === this.getTodayKey()) {
        return Math.max(0, this.maxSessionMessages - (Number(stored.count) || 0));
      }

      localStorage.setItem(
        CLIENT_CHAT_RATE_KEY,
        JSON.stringify({ date: this.getTodayKey(), count: 0 })
      );
    } catch {
      // Storage can be disabled in private browsing; the server still enforces real limits.
    }

    return this.maxSessionMessages;
  }

  updateRateLimitBadge() {
    const status = this.elements.rateStatus;
    const remaining = this.getRemainingQueries();

    if (status) {
      status.textContent =
        remaining > 0
          ? `${remaining} free AI messages left today`
          : 'Daily free-message estimate reached';
    }
  }

  decrementRemainingQueries() {
    let remaining = Math.max(0, this.getRemainingQueries() - 1);
    try {
      localStorage.setItem(
        CLIENT_CHAT_RATE_KEY,
        JSON.stringify({
          date: this.getTodayKey(),
          count: this.maxSessionMessages - remaining,
        })
      );
    } catch {
      remaining = this.maxSessionMessages;
    }
    this.updateRateLimitBadge();
    return remaining;
  }

  async waitForChatAPI() {
    if (!chatAssistant || typeof chatAssistant.ask !== 'function') {
      console.warn('⚠️ Chat API not available, using fallback');
      this.updateStatusIndicator('local');
      return;
    }

    this.chatAPI = chatAssistant;

    if (typeof this.chatAPI.isReady === 'function' && !this.chatAPI.isReady()) {
      try {
        await this.chatAPI.initialize();
      } catch (error) {
        console.warn('Chat API initialization failed, continuing in fallback mode:', error);
      }
    }

    const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    const canUseServer =
      online &&
      (this.chatAPI.canUseServerAI === true ||
        Boolean(window.APP_CONFIG?.apiBaseUrl) ||
        /vercel\.app$|mangeshraut\.pro$|localhost|127\.0\.0\.1/.test(window.location.hostname));

    this.updateStatusIndicator(canUseServer ? 'online' : online ? 'local' : 'offline');
  }

  updateStatusIndicator(status) {
    const statusEl = this.elements.widget?.querySelector('.chatbot-status-dot');
    const statusText = this.elements.widget?.querySelector('.chatbot-status-text');
    if (statusEl) {
      statusEl.className = `chatbot-status-dot status-${status}`;
    }
    if (statusText) {
      const labels = {
        online: 'Connected',
        local: 'Local Mode',
        offline: 'Offline',
      };
      statusText.textContent = labels[status] || 'Ready';
    }
  }

  preloadSpeechVoices() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {}, { once: true });
  }

  initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateVoiceButtonState();
      this.setDictationStatus('Listening…');
      this.elements.inputWrapper?.classList.add('dictating');
      this.elements.input?.classList.add('dictating');
    };

    this.recognition.onresult = event => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0]?.transcript || '';
        if (result.isFinal) {
          finalTranscript += chunk;
        } else {
          interimTranscript += chunk;
        }
      }

      if (finalTranscript) {
        this.dictationBase += finalTranscript;
      }

      this.syncDictationToInput(interimTranscript);

      if (interimTranscript) {
        this.setDictationStatus('Dictating…');
      }

      const latestResult = event.results[event.results.length - 1];
      if (latestResult?.isFinal && this.autoSendOnFinal) {
        const text = this.normalizeInput(this.elements.input?.value);
        if (text) {
          clearTimeout(this.dictationSendTimer);
          this.dictationSendTimer = setTimeout(() => {
            this.stopDictation(false);
            this.handleSendMessage();
          }, 180);
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateVoiceButtonState();
      this.elements.inputWrapper?.classList.remove('dictating');
      this.elements.input?.classList.remove('dictating');
      if (!this.normalizeInput(this.elements.input?.value)) {
        this.setDictationStatus('');
      }
    };

    this.recognition.onerror = event => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.updateVoiceButtonState();
      this.elements.inputWrapper?.classList.remove('dictating');
      this.elements.input?.classList.remove('dictating');

      const messages = {
        'not-allowed': 'Microphone access denied. Allow mic permission to dictate.',
        'no-speech': "Didn't catch that — tap the mic and try again.",
        aborted: '',
        network: 'Network error during dictation. Check your connection.',
      };
      this.setDictationStatus(messages[event.error] || 'Dictation interrupted. Try again.');
    };
  }

  syncDictationToInput(interimTranscript = '') {
    if (!this.elements.input) return;

    const composed = `${this.dictationBase}${interimTranscript}`.trimStart();
    this.elements.input.value = composed.slice(0, MAX_CHAT_INPUT_LENGTH);
    this.autoResizeTextarea(this.elements.input);
  }

  setDictationStatus(message) {
    if (this.elements.dictationStatus) {
      this.elements.dictationStatus.textContent = message || '';
    }
  }

  stopDictation(resetDraft = false) {
    clearTimeout(this.dictationSendTimer);
    this.autoSendOnFinal = false;

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        /* already stopped */
      }
    }

    this.isListening = false;
    this.updateVoiceButtonState();
    this.elements.inputWrapper?.classList.remove('dictating');
    this.elements.input?.classList.remove('dictating');

    if (resetDraft) {
      this.dictationBase = '';
      if (this.elements.input) {
        this.elements.input.value = '';
        this.autoResizeTextarea(this.elements.input);
      }
    }

    this.setDictationStatus('');
  }

  startDictation() {
    if (!this.recognition) {
      this.addMessage(
        'Voice dictation is not supported in your browser. Try Chrome, Edge, or Safari.',
        'assistant'
      );
      return;
    }

    if (this.isProcessing) return;

    this.autoSendOnFinal = true;
    this.dictationBase = this.elements.input?.value?.trim()
      ? `${this.elements.input.value.trim()} `
      : '';

    try {
      this.recognition.start();
      this.isListening = true;
      this.updateVoiceButtonState();
      window.voiceService?.dispatchEvent?.(new CustomEvent('listening-start'));
    } catch (error) {
      console.error('Voice recognition error:', error);
      this.isListening = false;
      this.updateVoiceButtonState();
      this.setDictationStatus('Unable to start dictation. Check microphone permissions.');
    }
  }

  updateVoiceButtonState() {
    if (this.elements.voiceBtn) {
      if (this.isListening) {
        this.elements.voiceBtn.classList.add('listening');
        this.elements.voiceBtn.setAttribute('aria-pressed', 'true');
        this.elements.voiceBtn.setAttribute('aria-label', 'Stop dictation');
        this.elements.voiceBtn.title = 'Stop dictation';
        this.elements.voiceBtn.innerHTML =
          '<i class="fas fa-stop" aria-hidden="true"></i><span class="siri-voice-ring" aria-hidden="true"></span>';
      } else {
        this.elements.voiceBtn.classList.remove('listening');
        this.elements.voiceBtn.setAttribute('aria-pressed', 'false');
        this.elements.voiceBtn.setAttribute('aria-label', 'Dictate with Siri');
        this.elements.voiceBtn.title = 'Apple Intelligence: Voice dictation';
        this.elements.voiceBtn.innerHTML =
          '<i class="fas fa-microphone" aria-hidden="true"></i><span class="siri-voice-ring" aria-hidden="true"></span>';
      }
    }
  }

  initializeElements() {
    const elements = {
      widget: document.getElementById('chatbot-widget'),
      backdrop: document.getElementById('chatbot-backdrop'),
      toggle: document.getElementById('chatbot-toggle'),
      closeBtn: document.querySelector('.chatbot-close-btn'),
      clearBtn: document.getElementById('chatbot-clear-btn'),
      privacyBtn: document.getElementById('chatbot-privacy-btn'),
      summarizeBtn: document.getElementById('chatbot-summarize-btn'),
      writingBtn: document.getElementById('chatbot-writing-btn'),
      form: document.getElementById('chatbot-form'),
      input: document.getElementById('chatbot-input'),
      messages: document.getElementById('chatbot-messages'),
      sendBtn: document.querySelector('.chatbot-send-btn'),
      voiceBtn: document.getElementById('chatbot-voice-btn'),
      inputWrapper: document.getElementById('chatbot-input-wrapper'),
      dictationStatus: document.getElementById('chatbot-dictation-status'),
      rateStatus: document.getElementById('chatbot-rate-status'),
    };

    // Create Shadow Div for smooth resizing
    if (elements.input && !this.shadowDiv) {
      elements.input.maxLength = MAX_CHAT_INPUT_LENGTH;
      this.shadowDiv = document.createElement('div');
      this.shadowDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        height: auto;
        width: ${elements.input.clientWidth}px;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow: hidden;
      `
        .trim()
        .replace(/\s+/g, ' ');

      const computed = window.getComputedStyle(elements.input);
      this.shadowDiv.style.cssText += `;
        font-family: ${computed.fontFamily};
        font-size: ${computed.fontSize};
        line-height: ${computed.lineHeight};
        padding: ${computed.padding};
        box-sizing: ${computed.boxSizing};
        border: ${computed.border};
      `
        .trim()
        .replace(/\s+/g, ' ');

      document.body.appendChild(this.shadowDiv);
    }

    return elements;
  }

  autoResizeTextarea(textarea) {
    if (!textarea || !this.shadowDiv) return;
    if (!this.textareaWidth || this.textareaWidth !== textarea.clientWidth) {
      this.textareaWidth = textarea.clientWidth;
      this.shadowDiv.style.width = this.textareaWidth + 'px';
    }
    this.shadowDiv.textContent = textarea.value + '\u200b';
    const maxHeight = 120;
    const newHeight = Math.min(this.shadowDiv.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(newHeight, 24)}px`;
  }

  bindEvents() {
    this.elements.toggle?.addEventListener('click', () => this.toggleWidget());
    this.elements.closeBtn?.addEventListener('click', () => this.closeWidget());
    this.elements.backdrop?.addEventListener('click', () => this.closeWidget());
    this.elements.clearBtn?.addEventListener('click', () => this.clearChat());
    this.elements.privacyBtn?.addEventListener('click', () => {
      privacyDashboard.open();
    });
    this.elements.summarizeBtn?.addEventListener('click', () => this.summarizeConversation());
    this.elements.writingBtn?.addEventListener('click', () => this.toggleWritingTools());

    this.elements.form?.addEventListener('submit', e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.handleSendMessage();
    });

    this.elements.input?.addEventListener('input', () => {
      this.autoResizeTextarea(this.elements.input);
    });

    this.elements.input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.handleSendMessage();
      }
    });

    this.elements.voiceBtn?.addEventListener('click', () => {
      this.handleVoiceInput();
    });

    document.addEventListener('click', e => {
      if (
        this.isOpen &&
        e.isTrusted &&
        !this.elements.widget.contains(e.target) &&
        !this.elements.toggle.contains(e.target) &&
        !this.elements.backdrop?.contains(e.target)
      ) {
        this.closeWidget();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeWidget();
        return;
      }

      if (e.key === 'Tab' && this.isOpen) {
        this.trapFocus(e);
      }
    });

    window.addEventListener(
      'resize',
      () => {
        this.textareaWidth = 0;
      },
      { passive: true }
    );
  }

  toggleWidget() {
    if (this.isOpen) {
      this.closeWidget();
    } else {
      this.openWidget();
    }
  }

  openWidget() {
    this.lastFocusedElement = document.activeElement;
    document.body.classList.add('chatbot-open');
    if (this.elements.backdrop) {
      this.elements.backdrop.classList.remove('hidden');
      this.elements.backdrop.classList.add('active');
      this.elements.backdrop.style.removeProperty('display');
      this.elements.backdrop.setAttribute('aria-hidden', 'false');
    }
    this.elements.widget?.classList.remove('hidden');
    this.elements.widget?.classList.add('visible');
    this.isOpen = true;
    this.elements.toggle?.setAttribute('aria-expanded', 'true');
    this.updateRateLimitBadge();
    this.showContextAwareness();
    appleSounds.playNotification();
    setTimeout(() => {
      (this.elements.input || this.elements.widget)?.focus({ preventScroll: true });
      const restored = this.scrollEngine?.restoreSession();
      if (!restored) {
        this.scrollEngine?.jumpToLatest({ announce: false });
      }
    }, 300);
  }

  announceScroll(message) {
    const status = this.elements.dictationStatus || this.elements.rateStatus;
    if (!status) return;
    const previous = status.textContent;
    status.textContent = message;
    window.setTimeout(() => {
      if (status.textContent === message) {
        status.textContent = previous;
      }
    }, 2200);
  }

  closeWidget() {
    this.scrollEngine?.saveSession();
    this.closeWritingTools();
    this.stopDictation(false);
    document.body.classList.remove('chatbot-open');
    if (this.elements.backdrop) {
      this.elements.backdrop.classList.remove('active');
      this.elements.backdrop.classList.add('hidden');
      this.elements.backdrop.style.display = 'none';
      this.elements.backdrop.setAttribute('aria-hidden', 'true');
    }
    this.elements.widget?.classList.remove('visible');
    this.elements.widget?.classList.add('hidden');
    this.isOpen = false;
    this.elements.toggle?.setAttribute('aria-expanded', 'false');
    const focusTarget =
      this.lastFocusedElement && document.contains(this.lastFocusedElement)
        ? this.lastFocusedElement
        : this.elements.toggle;
    focusTarget?.focus({ preventScroll: true });
  }

  clearChat() {
    if (this.elements.messages) {
      this.elements.messages.innerHTML = '';
      this.scrollEngine?.ensureScrollAnchor();
    }
    this.scrollEngine?.clearSession();
    this.scrollEngine?.resumeFollowing('clear');
    if (this.chatAPI?.conversation) {
      this.chatAPI.conversation = [];
    }
    if (this.chatAPI?.history) {
      this.chatAPI.history = [];
    }
    this.lastUserMessage = '';
    this.messageCount = 0;
    this.addWelcomeMessage();
    this.updateRateLimitBadge();
  }

  // ── Enhanced Welcome Message ──────────────────────

  shouldShowWelcomeMessage() {
    const messages = this.elements.messages;
    if (!messages) return false;
    if (messages.querySelector('.welcome-message, .welcome-message-simplified')) return false;
    if (messages.querySelector('.user-message')) return false;
    return !messages.querySelector(
      '.assistant-message:not(.welcome-message):not(.welcome-message-simplified)'
    );
  }

  addWelcomeMessage() {
    setTimeout(() => {
      if (this.shouldShowWelcomeMessage()) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className =
          'message assistant-message welcome-message welcome-message-simplified';
        welcomeDiv.innerHTML = `
                    <div class="message-content">
                        <div class="welcome-title">Welcome to Mangesh's AI Assistant</div>
                        <div class="welcome-subtitle">Ask about projects, skills, experience, or contact details. Start with one quick option below.</div>

                        <div class="welcome-capabilities">
                            <span class="capability-badge"><i class="fas fa-briefcase"></i> Portfolio</span>
                            <span class="capability-badge"><i class="fas fa-brain"></i> AI/ML</span>
                            <span class="capability-badge"><i class="fas fa-pen-nib"></i> Writing Tools</span>
                        </div>

                        <div class="welcome-chips">
                        </div>
                    </div>
                `;
        const chips = welcomeDiv.querySelector('.welcome-chips');
        [
          ['fas fa-rocket', 'Top Projects', "What are Mangesh's top projects?"],
          ['fas fa-brain', 'AI/ML Work', 'What AI and ML projects has Mangesh built?'],
          ['fas fa-envelope', 'Contact', 'How can I contact Mangesh?'],
        ].forEach(([iconClass, label, prompt]) => {
          chips?.appendChild(this.createWelcomeActionChip(iconClass, label, prompt));
        });
        this.appendToMessages(welcomeDiv);
      }
    }, 600);
  }

  createWelcomeActionChip(iconClass, label, prompt) {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.type = 'button';
    button.className = 'welcome-action-chip';
    const icon = document.createElement('i');
    icon.className = iconClass;
    button.append(icon, document.createTextNode(` ${label}`));
    button.addEventListener('click', () => this.ask(prompt));
    return button;
  }

  // ── Detect Agentic Actions ──────────────────────

  detectAgenticAction(message) {
    for (const item of AGENTIC_PATTERNS) {
      if (item.pattern.test(message)) {
        return item;
      }
    }
    return null;
  }

  showAgenticChip(action) {
    const chipEl = document.createElement('div');
    chipEl.className = 'agentic-action-chip';
    chipEl.innerHTML = `
            <span class="agentic-icon">${action.icon}</span>
            <span class="agentic-label">Agent: ${action.label}</span>
            <span class="agentic-pulse"></span>
        `;
    this.appendToMessages(chipEl, { pin: false });

    // Remove after a few seconds
    setTimeout(() => chipEl.classList.add('fade-out'), 3000);
    setTimeout(() => chipEl.remove(), 3500);
  }

  // ── Message Sending ──────────────────────

  async handleSendMessage() {
    this.stopDictation(false);
    const text = this.normalizeInput(this.elements.input?.value);
    if (!text || this.isProcessing) return;

    // Check rate limit first
    const remaining = this.getRemainingQueries();
    if (remaining <= 0) {
      this.addErrorMessage(
        `You have reached the daily estimate of ${this.maxSessionMessages} free AI messages. Please try again later.`
      );
      if (this.elements.input) {
        this.elements.input.value = '';
        this.autoResizeTextarea(this.elements.input);
      }
      this.updateRateLimitBadge();
      return;
    }

    if (text.length > MAX_CHAT_INPUT_LENGTH) {
      this.addErrorMessage(`Please keep messages under ${MAX_CHAT_INPUT_LENGTH} characters.`);
      return;
    }

    this.isProcessing = true;
    this.lastUserMessage = text;
    this.retryCount = 0;
    this.removeFollowupChips();
    appleSounds.playClick();

    // Add user message
    this.addMessage(text, 'user');

    // Clear input
    if (this.elements.input) {
      this.elements.input.value = '';
      this.autoResizeTextarea(this.elements.input);
    }
    this.dictationBase = '';

    // Detect and show agentic action
    const agenticAction = this.detectAgenticAction(text);
    if (agenticAction) {
      this.showAgenticChip(agenticAction);
    }

    // Show enhanced typing indicator
    this.showThinkingIndicator();

    const startTime = Date.now();

    try {
      if (this.chatAPI && typeof this.chatAPI.ask === 'function') {
        await this.streamAIResponse(text, startTime);
      } else {
        await this.simulateTyping(this.getFallbackResponse(text), startTime);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      this.hideTypingIndicator();
      const rateLimited = error?.code === 'RATE_LIMITED';
      this.addErrorMessage(
        rateLimited
          ? error.message ||
              'You have sent too many requests. Please wait a moment before trying again.'
          : "I'm having trouble connecting. Please try again in a moment."
      );
    } finally {
      this.isProcessing = false;
      this.messageCount++;
    }
  }

  getFocusableElements() {
    if (!this.elements.widget) return [];

    return Array.from(
      this.elements.widget.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => element.offsetParent !== null || element === document.activeElement);
  }

  trapFocus(event) {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.elements.widget?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  normalizeInput(value) {
    if (!value || typeof value !== 'string') return '';
    return stripUnsafeControlCharacters(value).trim();
  }

  // ── Apple Intelligence streaming paint ──────────────────────

  paintStreamingContent(contentDiv, fullText) {
    if (!contentDiv) return;

    const useMarkdown = markdownService.containsMarkdown(fullText) || fullText.length >= 48;
    if (useMarkdown) {
      contentDiv.innerHTML = `${markdownService.render(fullText)}<span class="siri-stream-caret" aria-hidden="true"></span>`;
    } else {
      contentDiv.replaceChildren();
      contentDiv.append(document.createTextNode(fullText));
      const caret = document.createElement('span');
      caret.className = 'siri-stream-caret';
      caret.setAttribute('aria-hidden', 'true');
      contentDiv.appendChild(caret);
    }

    this.scrollEngine?.followLiveContent(this.getStreamingMessageEl(contentDiv));
  }

  finalizeStreamingContent(contentDiv, fullText, response) {
    if (!contentDiv) return;

    const rendered = markdownService.renderForChat(fullText);
    contentDiv.innerHTML = rendered.html;
    contentDiv.classList.add('siri-intelligence-text');
    markdownService.bindRichInteractions(contentDiv);

    if (response && (response.type === 'action' || response.source === 'agentic-action')) {
      contentDiv.closest('.message')?.classList.add('action-message');
      const badge = document.createElement('div');
      badge.className = 'action-badge';
      badge.innerHTML = `
            <span class="action-badge-icon">⚡</span>
            <span class="action-badge-text">ACTION EXECUTED</span>
          `;
      contentDiv.prepend(badge);
    }

    if (window.Prism) {
      contentDiv.querySelectorAll('pre code').forEach(block => {
        window.Prism.highlightElement(block);
      });
    } else if (window.hljs) {
      contentDiv.querySelectorAll('pre code').forEach(block => {
        window.hljs.highlightElement(block);
      });
    }

    this.scrollEngine?.followLiveContent(this.getStreamingMessageEl(contentDiv));
  }

  getStreamingMessageEl(contentDiv) {
    return contentDiv?.closest?.('.message') || null;
  }

  schedulePinToBottom(options = {}) {
    this.scrollEngine?.scheduleFollow(options);
  }

  // ── Streaming AI Response ──────────────────────

  async streamAIResponse(userMessage, startTime, isRetry = false) {
    let fullText = '';
    let metadata = {};
    let messageDiv = null;
    let contentDiv = null;
    let lastRender = 0;

    const ensureStreamBubble = () => {
      if (messageDiv) return;
      this.updateThinkingStage('streaming');
      messageDiv = document.createElement('div');
      messageDiv.className = 'message assistant-message streaming';
      contentDiv = document.createElement('div');
      contentDiv.className = 'message-content siri-intelligence-text';
      messageDiv.appendChild(contentDiv);
      this.hideTypingIndicator();
      this.appendToMessages(messageDiv, { pin: false });
    };

    try {
      this.scrollEngine?.onStreamStart();
      this.updateThinkingStage('generating');

      const response = await this.chatAPI.ask(userMessage, {
        onChunk: chunk => {
          if (!chunk) return;
          fullText += chunk;
          ensureStreamBubble();
          this.updateThinkingStage('streaming');
          const now = Date.now();
          if (now - lastRender >= 72 || /[\n.!?]$/.test(chunk)) {
            lastRender = now;
            this.paintStreamingContent(contentDiv, fullText);
          } else {
            this.scrollEngine?.followLiveContent(this.getStreamingMessageEl(contentDiv));
          }
        },
      });

      if (messageDiv) {
        messageDiv.classList.remove('streaming');
      }

      // Fallback: If streaming yielded no text, use the direct answer
      if (!fullText && response && (response.answer || response.content)) {
        fullText = response.answer || response.content;
        ensureStreamBubble();
      }

      if (fullText && this.chatAPI?.isUpstreamFailureText?.(fullText)) {
        messageDiv?.remove();
        messageDiv = null;
        contentDiv = null;
        fullText = '';
      }

      // Auto-retry on empty response (1 silent retry)
      if (!fullText && !isRetry) {
        messageDiv?.remove();
        messageDiv = null;
        contentDiv = null;
        this.retryCount++;
        this.showThinkingIndicator();
        await new Promise(r => setTimeout(r, 500));
        return this.streamAIResponse(userMessage, startTime, true);
      }

      // Final fallback for completely empty responses (after retry)
      if (!fullText) {
        const offline = this.chatAPI?.basicQueryProcessing?.(userMessage);
        if (offline?.answer) {
          fullText = offline.answer;
          metadata.source = offline.source || 'assistme-portfolio';
          metadata.model = 'Offline AssistMe';
          metadata.category = offline.type || 'portfolio';
          this.updateStatusIndicator(
            typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'local'
          );
        } else {
          ensureStreamBubble();
          fullText =
            'I could not reach the live AI service, but I can still answer portfolio questions offline. Try asking about skills, projects, experience, or contact details.';
          metadata.error = true;
        }
      }

      if (fullText) {
        ensureStreamBubble();
        this.finalizeStreamingContent(contentDiv, fullText, response);
      }

      // Extract metadata
      const runtime = Date.now() - startTime;
      const tokenEstimate =
        response?.metadata?.tokens ||
        response?.metadata?.tokens_estimate ||
        response?.tokens ||
        response?.tokens_estimate ||
        Math.ceil(fullText.length / 4);
      const runtimeSeconds = Math.max(runtime / 1000, 0.001);
      metadata = {
        source: response?.metadata?.source || response?.source || 'Neural API',
        model: response?.metadata?.model || response?.model || 'OpenRouter',
        category: response?.metadata?.category || 'General',
        runtime: runtime,
        tokens: tokenEstimate,
        tokensPerSecond:
          response?.metadata?.tokensPerSecond ||
          response?.metadata?.tokens_per_sec ||
          response?.tokensPerSecond ||
          response?.tokens_per_sec ||
          tokenEstimate / runtimeSeconds,
        cost: response?.metadata?.cost,
        confidence: response?.metadata?.confidence,
        knowledgeContext:
          response?.metadata?.knowledge_context ?? response?.knowledge_context ?? false,
        webTools: response?.metadata?.web_tools ?? response?.web_tools ?? false,
        webEngine: response?.metadata?.web_engine || response?.web_engine || '',
        retried: this.retryCount > 0,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      };

      // Add condensed metadata
      this.addCondensedMetadata(messageDiv, contentDiv, metadata);

      // Show contextual follow-up chips
      this.showFollowupChips(fullText);

      if (!metadata.error) {
        this.decrementRemainingQueries();
      }

      this.schedulePinToBottom();
    } catch (error) {
      if (error?.code === 'RATE_LIMITED') {
        throw error;
      }
      console.error('Streaming error:', error);
      messageDiv?.classList.remove('streaming');
      if (!fullText && this.chatAPI?.basicQueryProcessing) {
        messageDiv?.remove();
        this.hideTypingIndicator();
        const offline = this.chatAPI.basicQueryProcessing(userMessage);
        const offlineText = offline?.answer || offline?.text || '';
        if (offlineText) {
          this.updateStatusIndicator(
            typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'local'
          );
          this.addMessage(offlineText, 'assistant');
          this.showFollowupChips(offlineText);
          return;
        }
      }

      if (!fullText) {
        messageDiv?.remove();
        this.addErrorMessage('The response was interrupted. Please try again.');
        return;
      }

      if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        contentDiv = document.createElement('div');
        contentDiv.className = 'message-content siri-intelligence-text';
        messageDiv.appendChild(contentDiv);
        this.appendToMessages(messageDiv, { pin: 'if-following' });
      }

      contentDiv.textContent = fullText;
      this.addCondensedMetadata(messageDiv, contentDiv, {
        source: 'Neural API',
        model: 'Interrupted',
        category: 'Error',
        runtime: Date.now() - startTime,
        tokens: Math.ceil(fullText.length / 4),
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      });
      this.addErrorMessage('Partial response shown. Tap Retry for a complete response.');
    } finally {
      this.scrollEngine?.onStreamEnd();
    }
  }

  // ── Condensed Metadata (replaces verbose chips) ──────

  addCondensedMetadata(messageDiv, contentDiv, metadata) {
    const metaContainer = document.createElement('div');
    metaContainer.className = 'message-metadata-v2';

    // Primary row: model + runtime + actions
    const primaryRow = document.createElement('div');
    primaryRow.className = 'meta-primary';

    // Model + Source badge
    const modelBadge = document.createElement('span');
    modelBadge.className = 'meta-model-badge';
    const modelName = (metadata.model || '').split('/').pop() || 'AI';
    const modelIcon = document.createElement('i');
    modelIcon.className = 'fas fa-sparkles';
    modelBadge.append(modelIcon, document.createTextNode(` ${modelName}`));
    primaryRow.appendChild(modelBadge);

    // Runtime
    if (metadata.runtime) {
      const runtimeEl = document.createElement('span');
      runtimeEl.className = 'meta-runtime';
      const timeStr =
        metadata.runtime < 1000
          ? `${metadata.runtime}ms`
          : `${(metadata.runtime / 1000).toFixed(1)}s`;
      runtimeEl.textContent = timeStr;
      primaryRow.appendChild(runtimeEl);
    }

    // Retry badge
    if (metadata.retried) {
      const retryBadge = document.createElement('span');
      retryBadge.className = 'meta-retry-badge';
      retryBadge.textContent = '↻ retried';
      primaryRow.appendChild(retryBadge);
    }

    // Spacer
    const spacer = document.createElement('span');
    spacer.style.flex = '1';
    primaryRow.appendChild(spacer);

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'meta-actions';

    const copyBtn = this.createActionButton('fa-copy', 'Copy', () => {
      this.copyText(contentDiv.textContent, copyBtn);
    });
    actionsDiv.appendChild(copyBtn);

    const speakBtn = this.createActionButton('fa-volume-up', 'Read Aloud', () => {
      this.speakText(contentDiv.textContent, speakBtn);
    });
    actionsDiv.appendChild(speakBtn);

    // Expand/collapse button for details
    const detailBtn = this.createActionButton('fa-chevron-down', 'Details', () => {
      const details = metaContainer.querySelector('.meta-details');
      if (details) {
        details.classList.toggle('expanded');
        const icon = detailBtn.querySelector('i');
        icon.className = details.classList.contains('expanded')
          ? 'fas fa-chevron-up'
          : 'fas fa-chevron-down';
      }
    });
    actionsDiv.appendChild(detailBtn);

    primaryRow.appendChild(actionsDiv);
    metaContainer.appendChild(primaryRow);

    // Details row (collapsed by default)
    const detailsRow = document.createElement('div');
    detailsRow.className = 'meta-details';

    const detailChips = [];
    if (metadata.source) detailChips.push(`🔌 ${metadata.source}`);
    if (metadata.knowledgeContext) detailChips.push('📚 Site knowledge');
    if (metadata.webTools) {
      const engine = metadata.webEngine ? ` via ${metadata.webEngine}` : '';
      detailChips.push(`🌐 Web tools${engine}`);
    }
    if (metadata.tokens) detailChips.push(`🎯 ${metadata.tokens} tokens`);
    if (metadata.tokensPerSecond)
      detailChips.push(`⚡ ${Math.round(metadata.tokensPerSecond)} tok/s`);
    if (metadata.confidence) detailChips.push(`✓ ${Math.round(metadata.confidence * 100)}%`);
    if (metadata.cost) {
      const costStr =
        typeof metadata.cost === 'number' ? `$${metadata.cost.toFixed(4)}` : metadata.cost;
      detailChips.push(`💰 ${costStr}`);
    }
    if (metadata.timestamp) detailChips.push(`🕐 ${metadata.timestamp}`);

    detailChips.forEach(chipText => {
      const chip = document.createElement('span');
      chip.className = 'meta-detail-chip';
      chip.textContent = chipText;
      detailsRow.appendChild(chip);
    });

    metaContainer.appendChild(detailsRow);
    messageDiv.appendChild(metaContainer);
  }

  // ── Markdown Rendering ──────────────────────

  renderMarkdown(text) {
    return markdownService.render(text);
  }

  // ── Fallback Typing (local mode) ──────────────────────

  async simulateTyping(text, startTime) {
    this.hideTypingIndicator();
    this.scrollEngine?.onStreamStart();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message streaming';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    messageDiv.appendChild(contentDiv);
    this.appendToMessages(messageDiv, { pin: false });

    await new Promise(resolve => {
      let index = 0;
      const tick = () => {
        index += 1;
        contentDiv.textContent = text.substring(0, index) + '▊';
        this.scrollEngine?.followLiveContent(messageDiv);

        if (index >= text.length) {
          resolve();
          return;
        }

        setTimeout(tick, 20);
      };

      tick();
    });

    messageDiv.classList.remove('streaming');
    contentDiv.textContent = text;

    const metadata = {
      source: 'Local Intelligence',
      model: 'Portfolio RAG',
      category: 'Portfolio',
      runtime: Date.now() - startTime,
      tokens: Math.ceil(text.length / 4),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };

    this.addCondensedMetadata(messageDiv, contentDiv, metadata);
    this.showFollowupChips(text);
    this.decrementRemainingQueries();
    this.scrollEngine?.onStreamEnd();
  }

  // ── Chip helpers ──────────────────────

  createChip(icon, text, type) {
    const chip = document.createElement('span');
    chip.className = `meta-chip meta-chip-${type}`;
    chip.textContent = `${icon} ${text}`;
    return chip;
  }

  createActionButton(iconClass, title, onClick) {
    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.type = 'button';
    btn.className = 'msg-action-btn';
    btn.title = title;
    const icon = document.createElement('i');
    icon.className = TRUSTED_ICON_CLASS.test(iconClass) ? `fas ${iconClass}` : 'fas fa-circle';
    btn.appendChild(icon);
    btn.onclick = e => {
      e.stopPropagation();
      onClick();
    };
    return btn;
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  copyText(text, button) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('success');
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.classList.remove('success');
        }, 2000);
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  }

  speakText(text, button) {
    if (!('speechSynthesis' in window)) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      button.innerHTML = '<i class="fas fa-volume-up"></i>';
      button.classList.remove('speaking');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.02;
    utterance.volume = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        v =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('siri') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('enhanced') ||
            v.name.toLowerCase().includes('premium'))
      ) ||
      voices.find(v => v.lang.startsWith('en-US')) ||
      voices.find(v => v.lang.startsWith('en'));

    if (preferred) utterance.voice = preferred;

    button.innerHTML = '<i class="fas fa-stop"></i>';
    button.classList.add('speaking');

    utterance.onend = () => {
      button.innerHTML = '<i class="fas fa-volume-up"></i>';
      button.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('ai') ||
      lowerMessage.includes('ml') ||
      lowerMessage.includes('machine learning')
    ) {
      return 'Mangesh has hands-on experience with Machine Learning and AI, including demand forecasting with LSTM models (TensorFlow), network intrusion detection (published at IEEE), and building intelligent chatbots with RAG architecture. His tech stack includes TensorFlow, scikit-learn, Python, and various NLP tools.';
    }
    if (lowerMessage.includes('skill') || lowerMessage.includes('technology')) {
      return 'Mangesh is proficient in Java, Python, Spring Boot, React, Angular, AWS, and Machine Learning. His expertise spans full-stack development, cloud infrastructure, and AI/ML engineering.';
    }
    if (lowerMessage.includes('experience') || lowerMessage.includes('work')) {
      return 'Mangesh is currently a Software Engineer at Customized Energy Solutions, optimizing energy analytics with 40% efficiency gains. Previously at IoasiZ, he refactored monoliths into microservices and resolved 50+ critical bugs.';
    }
    if (lowerMessage.includes('project')) {
      return "Mangesh's key projects include this AI-powered portfolio with RAG chatbot, a Bug Reporting System (Django + React), demand forecasting with LSTM, and a DevVit Reddit game. Visit the Projects section to explore more.";
    }
    if (lowerMessage.includes('education')) {
      return "Mangesh holds a Master of Science in Computer Science from Drexel University (GPA 3.76) and a Bachelor of Engineering from Savitribai Phule Pune University. He's also published research at IEEE on ML-based intrusion detection.";
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
      return 'You can reach Mangesh at mbr63@drexel.edu, call at +1 (609) 505-3500, or connect on LinkedIn (linkedin.com/in/mangeshraut71298). The Contact section below has a form too.';
    }
    return "I can help you learn about Mangesh's AI/ML expertise, projects, skills, experience, and education. Try asking something specific, or use the suggestion chips below!";
  }

  addMessage(text, role, options = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    messageDiv.dataset.messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    this.appendToMessages(messageDiv, {
      pin: options.forceScroll ? 'force' : role === 'user' ? false : 'if-following',
    });

    if (role === 'user') {
      this.scrollEngine?.beginUserTurn(messageDiv);
    }

    return messageDiv;
  }

  addErrorMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message error-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    messageDiv.appendChild(contentDiv);

    // Retry button
    const retryBtn = document.createElement('button');
    retryBtn.setAttribute('type', 'button');
    retryBtn.type = 'button';
    retryBtn.className = 'chatbot-retry-btn';
    retryBtn.innerHTML = '<i class="fas fa-redo"></i> Retry';
    retryBtn.onclick = e => {
      e.stopPropagation();
      messageDiv.remove();
      if (this.lastUserMessage) {
        this.elements.input.value = this.lastUserMessage;
        this.handleSendMessage();
      }
    };
    messageDiv.appendChild(retryBtn);

    this.appendToMessages(messageDiv, { pin: 'if-following' });
  }

  showFollowupChips(assistantText) {
    this.removeFollowupChips();

    const ctx = inferFollowupContext(assistantText);
    const chips = FOLLOWUP_CHIPS[ctx] || FOLLOWUP_CHIPS.default;

    const container = document.createElement('div');
    container.className = 'chatbot-followup-chips';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Follow-up suggestions');

    chips.forEach(label => {
      const btn = document.createElement('button');
      btn.setAttribute('type', 'button');
      btn.type = 'button';
      btn.className = 'followup-chip';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.removeFollowupChips();
        this.ask(normalizeFollowupPrompt(label) || label);
      });
      container.appendChild(btn);
    });

    this.appendToMessages(container);
  }

  removeFollowupChips() {
    this.elements.messages?.querySelectorAll('.chatbot-followup-chips').forEach(el => el.remove());
  }

  // ── Enhanced Thinking Indicator ─────────────────────────

  showThinkingIndicator() {
    this.hideTypingIndicator();
    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator rich-block-thinking';
    indicator.id = 'chatbot-typing-indicator';
    indicator.innerHTML = `
            <div class="thinking-content">
                <div class="thinking-brain">
                    <i class="fas fa-brain"></i>
                </div>
                <div class="thinking-text">
                    <span class="thinking-stage">Thinking</span>
                    <span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
                <div class="thinking-shimmer" aria-hidden="true">
                    <span class="thinking-shimmer-bar"></span>
                    <span class="thinking-shimmer-bar"></span>
                    <span class="thinking-shimmer-bar"></span>
                </div>
            </div>
        `;
    this.appendToMessages(indicator, { pin: false });
  }

  updateThinkingStage(stage) {
    const indicator = document.getElementById('chatbot-typing-indicator');
    const stageEl = indicator?.querySelector('.thinking-stage');
    const iconEl = indicator?.querySelector('.thinking-brain i');
    const shimmer = indicator?.querySelector('.thinking-shimmer');
    if (stageEl) {
      const stages = {
        thinking: { text: 'Thinking', icon: 'fas fa-brain' },
        generating: { text: 'Generating', icon: 'fas fa-wand-magic-sparkles' },
        streaming: { text: 'Streaming', icon: 'fas fa-bolt' },
      };
      const s = stages[stage] || stages.thinking;
      stageEl.textContent = s.text;
      if (iconEl) iconEl.className = s.icon;
      indicator?.classList.toggle('rich-block-thinking--streaming', stage === 'streaming');
      shimmer?.setAttribute('data-stage', stage);
    }
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('chatbot-typing-indicator');
    if (!indicator) return;
    const wasFollowing = this.scrollEngine?.isFollowing();
    indicator.remove();
    if (wasFollowing) {
      this.scrollEngine?.followLiveContent(
        this.elements.messages?.querySelector('.user-message:last-of-type')
      );
    }
  }

  appendToMessages(node, { pin = 'if-following' } = {}) {
    if (!node) return;
    this.scrollEngine?.insertNode(node);
    this.scrollEngine?.afterInsert(pin);
  }

  scrollToBottom(options = {}) {
    this.scrollEngine?.jumpToLatest({ announce: false, ...options });
  }

  handleVoiceInput() {
    if (this.isListening) {
      this.stopDictation(false);
      return;
    }

    this.startDictation();
  }

  // ── Apple Intelligence: Conversation Summary (WWDC26) ──────────

  summarizeConversation() {
    if (this.isProcessing) return;

    if (this.messageCount === 0) {
      this.addMessage(
        'There is nothing to summarize yet — ask me something first, then I can recap the conversation.',
        'assistant'
      );
      return;
    }

    this.ask('Summarize our conversation so far in 3 short bullet points.');
  }

  // ── Apple Intelligence: Writing Tools (WWDC26) ──────────────────

  toggleWritingTools() {
    const existing = this.elements.widget?.querySelector('.writing-tools-popover');
    if (existing) {
      this.closeWritingTools();
      return;
    }

    const popover = document.createElement('div');
    popover.className = 'writing-tools-popover';
    popover.setAttribute('role', 'menu');
    popover.setAttribute('aria-label', 'Writing Tools');

    const title = document.createElement('div');
    title.className = 'writing-tools-title';
    title.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Writing Tools';
    popover.appendChild(title);

    WRITING_TOOLS.forEach(tool => {
      const btn = document.createElement('button');
      btn.setAttribute('type', 'button');
      btn.type = 'button';
      btn.className = 'writing-tool-option';
      btn.setAttribute('role', 'menuitem');
      const icon = document.createElement('i');
      icon.className = TRUSTED_ICON_CLASS.test(tool.icon) ? `fas ${tool.icon}` : 'fas fa-circle';
      btn.append(icon, document.createTextNode(` ${tool.label}`));
      btn.addEventListener('click', () => this.applyWritingTool(tool));
      popover.appendChild(btn);
    });

    this.elements.form?.appendChild(popover);
    this.elements.writingBtn?.setAttribute('aria-expanded', 'true');
  }

  closeWritingTools() {
    this.elements.widget?.querySelectorAll('.writing-tools-popover').forEach(el => el.remove());
    this.elements.writingBtn?.setAttribute('aria-expanded', 'false');
  }

  async applyWritingTool(tool) {
    const draft = this.normalizeInput(this.elements.input?.value);
    this.closeWritingTools();

    if (!draft) {
      if (this.elements.rateStatus) {
        this.elements.rateStatus.textContent = 'Type a message first, then pick a Writing Tool.';
      }
      this.elements.input?.focus();
      return;
    }

    if (!this.chatAPI || typeof this.chatAPI.ask !== 'function') {
      if (this.elements.rateStatus) {
        this.elements.rateStatus.textContent = 'Writing Tools need the AI connection.';
      }
      return;
    }

    if (this.getRemainingQueries() <= 0) {
      if (this.elements.rateStatus) {
        this.elements.rateStatus.textContent = 'Daily free-message estimate reached.';
      }
      return;
    }

    const writingBtn = this.elements.writingBtn;
    const originalIcon = writingBtn?.innerHTML;
    if (writingBtn) {
      writingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      writingBtn.disabled = true;
    }
    this.isProcessing = true;

    try {
      const response = await this.chatAPI.ask(`${tool.instruction}\n\n"${draft}"`);
      const rewritten = this.normalizeInput(response?.answer || response?.content || '')
        .replace(/^["'\u201c]+/, '')
        .replace(/["'\u201d]+$/, '');

      if (rewritten) {
        this.elements.input.value = rewritten;
        this.autoResizeTextarea(this.elements.input);
        this.decrementRemainingQueries();
        if (this.elements.rateStatus) {
          this.elements.rateStatus.textContent = `✦ ${tool.label} applied — review and send.`;
        }
      } else if (this.elements.rateStatus) {
        this.elements.rateStatus.textContent = 'Writing Tools returned nothing. Try again.';
      }
    } catch (error) {
      console.warn('Writing Tools failed:', error);
      if (this.elements.rateStatus) {
        this.elements.rateStatus.textContent =
          error?.code === 'RATE_LIMITED'
            ? 'Too many requests — give it a moment.'
            : 'Writing Tools hit a snag. Try again.';
      }
    } finally {
      this.isProcessing = false;
      if (writingBtn) {
        writingBtn.innerHTML = originalIcon;
        writingBtn.disabled = false;
      }
      this.elements.input?.focus();
    }
  }

  // ── Siri AI: On-Screen Awareness (WWDC26) ───────────────────────

  getVisibleSectionContext() {
    const viewportMid = window.innerHeight / 2;
    for (const [sectionId, context] of Object.entries(SECTION_CONTEXT_PROMPTS)) {
      const section = document.getElementById(sectionId);
      if (!section) continue;
      const rect = section.getBoundingClientRect();
      if (rect.top <= viewportMid && rect.bottom >= viewportMid) {
        return { sectionId, label: context[0], prompt: context[1] };
      }
    }
    return null;
  }

  showContextAwareness() {
    const context = this.getVisibleSectionContext();
    if (!context || context.sectionId === this.lastContextSectionId) return;
    this.lastContextSectionId = context.sectionId;

    this.elements.messages?.querySelectorAll('.context-aware-chip').forEach(el => el.remove());

    const chip = document.createElement('button');
    chip.setAttribute('type', 'button');
    chip.type = 'button';
    chip.className = 'context-aware-chip';
    chip.innerHTML = `
      <span class="context-aware-glow" aria-hidden="true"></span>
      <i class="fas fa-eye" aria-hidden="true"></i>
      <span>You're viewing <strong>${this.escapeHtml(context.label)}</strong> — ask me about it</span>
    `;
    chip.addEventListener('click', () => {
      chip.remove();
      this.ask(context.prompt);
    });

    this.appendToMessages(chip);
  }

  /**
   * Public method to programmatically ask a question
   * Used by welcome action chips and external integrations
   */
  ask(question) {
    if (!question || typeof question !== 'string') return;

    if (!this.isOpen) {
      this.openWidget();
    }

    if (this.elements.input) {
      this.elements.input.value = question;
      this.autoResizeTextarea(this.elements.input);
    }

    setTimeout(
      () => {
        this.handleSendMessage();
      },
      this.isOpen ? 0 : 300
    );
  }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.appleIntelligenceChatbot = new AppleIntelligenceChatbot();
  });
} else {
  window.appleIntelligenceChatbot = new AppleIntelligenceChatbot();
}

export default AppleIntelligenceChatbot;

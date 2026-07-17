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
import { ChatScrollEngine } from '../chatbot/scroll-engine.js';
import {
  CLIENT_DAILY_CHAT_LIMIT,
  MAX_CHAT_INPUT_LENGTH as SHARED_MAX_CHAT_INPUT,
} from '../chatbot/constants.js';
import { getRemainingFreeMessages, consumeFreeMessage } from '../chatbot/rate-limit.js';
import { clearSessionMemory, saveConversation } from '../chatbot/session-memory.js';
import { realtimeVoiceService } from '../services/RealtimeVoiceService.js';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scroll-lock.js';
import appleSounds from './apple-sounds.js';

const MAX_CHAT_INPUT_LENGTH = SHARED_MAX_CHAT_INPUT;
const CLIENT_CHAT_MESSAGE_LIMIT = limits.dailyChatMessages || CLIENT_DAILY_CHAT_LIMIT;
const TRUSTED_ICON_CLASS = /^fa-[a-z0-9-]+$/i;
const SITE_SEARCH_PROMPT =
  'Act as a site search engine for this portfolio. Give me a concise map of what I can ask about (projects, skills, experience, education, contact) and one suggested starter question for each.';

function normalizeImagePayloads(images) {
  return (images || [])
    .map(img => {
      if (typeof img === 'string') return img;
      if (img && typeof img.src === 'string') return img.src;
      return '';
    })
    .filter(Boolean)
    .slice(0, 2);
}

function imageDisplayName(image, index = 0) {
  if (image && typeof image === 'object' && typeof image.name === 'string' && image.name.trim()) {
    return image.name.trim();
  }
  return `image-${index + 1}.png`;
}

function imageSrc(image) {
  if (typeof image === 'string') return image;
  if (image && typeof image.src === 'string') return image.src;
  return '';
}

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
  skills: ['Top frameworks?', 'Cloud & DevOps?', 'AI/ML expertise?'],
  experience: ['Current role?', 'Key achievements?', 'Industry domains?'],
  projects: ['Show all projects', 'Most impactful?', 'Tech stack used?'],
  education: ['GPA & Honors?', 'Specialisations?', 'Research work?'],
  contact: ['Email address?', 'LinkedIn?', 'Download resume'],
  publications: ['Published papers?', 'Research areas?', 'Conference talks?'],
  certifications: ['AWS certified?', 'Java certifications?', 'ML certs?'],
  aiml: ['ML models used?', 'Data pipeline?', 'NLP experience?'],
  agents: ['What can you do?', 'Schedule meeting', 'Download resume'],
  default: ['About Mangesh', 'Top projects', 'AI/ML skills'],
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
    this.realtimeVoice = realtimeVoiceService;
    this.realtimeAvailable = false;
    this.realtimeTranscriptEls = { user: null, assistant: null };
    this.composerStates = {
      connection: 'local',
      agent: 'idle',
      realtime: 'off',
    };
    this._clearHold = null;
    this._clearUndo = null;

    // Local rate-limit visibility mirrors the backend throttle before requests are sent.
    this.maxSessionMessages = CLIENT_CHAT_MESSAGE_LIMIT;
    this.lastFocusedElement = null;
    this.pendingImages = [];

    if (!this.elements.widget || !this.elements.toggle) {
      console.error('Chatbot elements not found');
      return;
    }

    this.scrollEngine = new ChatScrollEngine(this.elements.messages, {
      widgetEl: this.elements.widget,
      announce: message => this.announceScroll(message),
    });
    this.scrollEngine.bind();
    this.syncComposerHeight();
    this._viewportBound = false;
    this._onVisualViewport = null;
    this._mobileScrollLocked = false;

    // Wait for chat API to be available
    this.waitForChatAPI();
    this.initVoiceRecognition();
    this.initRealtimeVoice();
    this.bindEvents();
    this.ensureStatusIndicator();
    this.addWelcomeMessage();
    this.preloadSpeechVoices();
    void markdownService.ensureRichReady();

    this.setComposerChip('agent', 'idle');
    this.setComposerChip('realtime', 'off');
    this.updateRateLimitBadge();
    this.setComposerBusy(false);
  }

  ensureStatusIndicator() {
    const headerMain = this.elements.widget?.querySelector('.chatbot-header-main');
    const titleRow = this.elements.widget?.querySelector('.chatbot-title-row');
    if (!headerMain || !titleRow) return;
    if (headerMain.querySelector('.chatbot-status')) return;

    const status = document.createElement('div');
    status.className = 'chatbot-status';
    status.innerHTML =
      '<span class="chatbot-status-dot status-local" aria-hidden="true"></span>' +
      '<span class="chatbot-status-text">Ready</span>';
    titleRow.insertAdjacentElement('afterend', status);
  }

  isMobileViewport() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  }

  syncComposerHeight() {
    const widget = this.elements.widget;
    if (!widget) return;
    const footer =
      widget.querySelector('.chatbot-footer') ||
      widget.querySelector('.chatbot-input-area') ||
      this.elements.inputWrapper?.parentElement;
    const height = Math.max(72, Math.round(footer?.getBoundingClientRect?.().height || 92));
    widget.style.setProperty('--chatbot-composer-height', `${height}px`);
  }

  bindVisualViewportInsets() {
    if (this._viewportBound || typeof window === 'undefined' || !window.visualViewport) return;
    this._viewportBound = true;
    this._onVisualViewport = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      // Keyboard / browser chrome that shrinks the visual viewport.
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      document.documentElement.style.setProperty('--chat-keyboard-inset', `${inset}px`);
      if (this.isOpen && this.scrollEngine?.isFollowing?.()) {
        this.scrollEngine.jumpToLatest({ announce: false });
      }
    };
    window.visualViewport.addEventListener('resize', this._onVisualViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', this._onVisualViewport, { passive: true });
    this._onVisualViewport();
  }

  unbindVisualViewportInsets() {
    if (!this._viewportBound) return;
    if (window.visualViewport && this._onVisualViewport) {
      window.visualViewport.removeEventListener('resize', this._onVisualViewport);
      window.visualViewport.removeEventListener('scroll', this._onVisualViewport);
    }
    document.documentElement.style.removeProperty('--chat-keyboard-inset');
    this._viewportBound = false;
    this._onVisualViewport = null;
  }

  setComposerBusy(busy) {
    const sendBtn = this.elements.sendBtn;
    const input = this.elements.input;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
      sendBtn.classList.toggle('is-busy', Boolean(busy));
      sendBtn.classList.toggle('is-stop', Boolean(busy));
      sendBtn.setAttribute('aria-label', busy ? 'Stop generating' : 'Send message');
      sendBtn.title = busy ? 'Stop generating' : 'Send message';
      const icon = sendBtn.querySelector('i');
      if (icon) {
        icon.className = busy ? 'fas fa-stop' : 'fas fa-arrow-up';
      }
    }
    if (input) {
      input.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
  }

  stopGeneration() {
    if (!this.activeAskController) return;
    try {
      this.activeAskController.abort();
    } catch (_error) {
      // ignore
    }
    this.hideTypingIndicator?.();
    this.setAgentComposerStatus('idle');
    if (this.elements.rateStatus) {
      this.elements.rateStatus.textContent = 'Stopped.';
    }
  }

  getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  getRemainingQueries() {
    return getRemainingFreeMessages(this.maxSessionMessages);
  }

  updateRateLimitBadge() {
    const status = this.elements.rateStatus;
    if (!status) return;
    const remaining = this.getRemainingQueries();
    // Keep the composer quiet unless quota is low or exhausted.
    if (remaining <= 0) {
      status.textContent = 'Daily free-message estimate reached';
    } else if (remaining <= 3) {
      status.textContent = `${remaining} free AI messages left today`;
    } else {
      status.textContent = '';
    }
  }

  decrementRemainingQueries() {
    const state = consumeFreeMessage(this.maxSessionMessages);
    this.updateRateLimitBadge();
    return state.remaining;
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
    if (!online) {
      this.updateStatusIndicator('offline');
      return;
    }

    // Probe chat health so "Connected" means OpenRouter is actually configured/online.
    // Treat Vercel DEPLOYMENT_DISABLED (402) / network failures as Local Mode so
    // GitHub Pages still answers from the client portfolio knowledge base.
    let status = 'local';
    try {
      // chat.js exports buildApiUrl; resolve API base the same way as ask()
      const { buildApiUrl } = await import('../core/chat.js');
      const healthUrl = buildApiUrl('/api/chat/health');
      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      const bodyText = await res.text();
      if (res.status === 402 || /DEPLOYMENT_DISABLED|Payment required/i.test(bodyText)) {
        status = 'local';
        if (this.chatAPI?.markServerUnavailable) {
          this.chatAPI.markServerUnavailable();
        } else if (this.chatAPI) {
          this.chatAPI.canUseServerAI = false;
        }
      } else if (res.ok) {
        let data = {};
        try {
          data = JSON.parse(bodyText);
        } catch {
          data = {};
        }
        const provider = data?.provider_status || '';
        if (provider === 'online' || provider === 'configured') {
          status = 'online';
          if (this.chatAPI) this.chatAPI.canUseServerAI = true;
        } else if (provider === 'local_only' || data?.local_only) {
          status = 'local';
          if (this.chatAPI) this.chatAPI.canUseServerAI = true;
        } else {
          status = 'local';
          if (this.chatAPI) this.chatAPI.canUseServerAI = true;
        }
      } else {
        status = 'local';
        if (this.chatAPI) this.chatAPI.canUseServerAI = false;
      }
    } catch {
      status = 'local';
      if (this.chatAPI) this.chatAPI.canUseServerAI = false;
    }

    this.updateStatusIndicator(status);
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
      // Never leave a misleading "Ready" while Vercel/API is down
      statusText.textContent = labels[status] || labels.local;
      statusText.title =
        status === 'online'
          ? 'OpenRouter configured — free models used if Grok is unavailable'
          : status === 'local'
            ? 'Answering from portfolio knowledge (live API host unavailable)'
            : 'No network — offline portfolio answers only';
    }
  }

  setComposerChip(chip, state) {
    if (!this.composerStates) {
      this.composerStates = { agent: 'idle', realtime: 'off' };
    }
    this.composerStates[chip] = state;
    const root = this.elements.composerStatus || document.getElementById('chatbot-composer-status');
    const el = root?.querySelector(`[data-chip="${chip}"]`);
    if (!el) {
      this.syncComposerStatusVisibility();
      return;
    }
    const labels = {
      agent: {
        idle: 'Working',
        thinking: 'Thinking',
        generating: 'Generating',
        streaming: 'Streaming',
        agentic: 'Agent action',
      },
      realtime: {
        off: 'Voice',
        connecting: 'Voice connecting',
        listening: 'Voice listening',
        speaking: 'Voice speaking',
        connected: 'Voice live',
      },
    };
    el.dataset.state = state;
    const label = el.querySelector('.composer-status-label');
    if (label) {
      label.textContent = labels[chip]?.[state] || state;
    }
    const idle =
      (chip === 'agent' && (state === 'idle' || !state)) ||
      (chip === 'realtime' && (state === 'off' || !state));
    el.hidden = idle;
    this.syncComposerStatusVisibility();
  }

  syncComposerStatusVisibility() {
    const root = this.elements.composerStatus || document.getElementById('chatbot-composer-status');
    if (!root) return;
    const visible = root.querySelectorAll('.composer-status-chip:not([hidden])').length > 0;
    root.hidden = !visible;
    root.classList.toggle('is-idle', !visible);
  }

  setAgentComposerStatus(stage) {
    // Thinking/generating/streaming already have a transcript indicator — don't mirror idle chrome.
    if (stage === 'thinking' || stage === 'generating' || stage === 'streaming') {
      this.setComposerChip('agent', 'idle');
      return;
    }
    const map = {
      agentic: 'agentic',
      idle: 'idle',
    };
    this.setComposerChip('agent', map[stage] || 'idle');
  }

  preloadSpeechVoices() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {}, { once: true });
  }

  initRealtimeVoice() {
    this.realtimeVoice.onStatusChange = status => {
      this.updateVoiceButtonState(status);
      const realtimeMap = {
        connecting: 'connecting',
        connected: 'connected',
        listening: 'listening',
        speaking: 'speaking',
      };
      this.setComposerChip('realtime', realtimeMap[status] || 'off');
      if (status === 'listening') {
        this.setDictationStatus('Live voice — speak naturally');
      } else if (status === 'speaking') {
        this.setDictationStatus('AssistMe is responding…');
      } else if (status === 'connecting') {
        this.setDictationStatus('Starting live voice session…');
      } else if (!this.isListening) {
        this.setDictationStatus('');
      }
    };

    this.realtimeVoice.onTranscript = ({ role, text, final }) => {
      this.updateRealtimeTranscript(role, text, final);
    };

    this.realtimeVoice.onError = error => {
      console.error('Realtime voice error:', error);
      this.addErrorMessage(
        error?.message || 'Live voice is temporarily unavailable. Try typing instead.'
      );
      this.setDictationStatus('');
    };

    this.realtimeVoice.checkAvailability().then(available => {
      this.realtimeAvailable = available;
      if (available && this.elements.voiceBtn) {
        this.elements.voiceBtn.title = 'Live voice via AI Gateway (tap). Hold Shift for dictation.';
        this.elements.voiceBtn.setAttribute(
          'aria-label',
          'Start live voice conversation with AssistMe'
        );
      }
    });
  }

  updateRealtimeTranscript(role, text, isFinal = false) {
    if (!text?.trim()) {
      return;
    }

    const key = role === 'user' ? 'user' : 'assistant';
    let messageDiv = this.realtimeTranscriptEls[key];

    if (!messageDiv) {
      messageDiv = this.addMessage(text.trim(), key, { forceScroll: true });
      messageDiv.classList.add('realtime-voice-message');
      this.realtimeTranscriptEls[key] = messageDiv;
    } else {
      const contentDiv = messageDiv.querySelector('.message-content');
      if (contentDiv) {
        contentDiv.textContent = text.trim();
      }
      this.scrollEngine?.followLiveContent(messageDiv);
    }

    if (isFinal) {
      this.realtimeTranscriptEls[key] = null;
      if (role === 'user') {
        this.messageCount += 1;
      }
    }
  }

  isRealtimeVoiceActive() {
    return ['connecting', 'connected', 'listening', 'speaking'].includes(this.realtimeVoice.status);
  }

  async toggleRealtimeVoice() {
    if (this.isProcessing) {
      return;
    }

    if (this.isRealtimeVoiceActive()) {
      await this.realtimeVoice.disconnect();
      this.realtimeTranscriptEls = { user: null, assistant: null };
      this.updateVoiceButtonState();
      this.setDictationStatus('');
      return;
    }

    this.stopDictation(false);
    try {
      await this.realtimeVoice.toggleLiveSession();
    } catch (error) {
      console.error('Failed to start realtime voice:', error);
      this.addErrorMessage(
        'Live voice could not start. Falling back to dictation is still available.'
      );
    }
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

  updateVoiceButtonState(realtimeStatus = this.realtimeVoice?.status) {
    if (this.elements.voiceBtn) {
      const realtimeActive = ['connecting', 'connected', 'listening', 'speaking'].includes(
        realtimeStatus
      );

      if (realtimeActive) {
        this.elements.voiceBtn.classList.add('listening', 'realtime-active');
        this.elements.voiceBtn.setAttribute('aria-pressed', 'true');
        this.elements.voiceBtn.setAttribute('aria-label', 'Stop live voice conversation');
        this.elements.voiceBtn.innerHTML =
          '<i class="fas fa-wave-square" aria-hidden="true"></i><span class="siri-voice-ring" aria-hidden="true"></span>';
        return;
      }

      this.elements.voiceBtn.classList.remove('realtime-active');

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
        if (this.realtimeAvailable) {
          this.elements.voiceBtn.title =
            'Live voice via AI Gateway (tap). Hold Shift for dictation.';
          this.elements.voiceBtn.setAttribute(
            'aria-label',
            'Start live voice conversation with AssistMe'
          );
        } else {
          this.elements.voiceBtn.setAttribute('aria-label', 'Dictate with Siri');
          this.elements.voiceBtn.title = 'Apple Intelligence: Voice dictation';
        }
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
      plusBtn: document.getElementById('chatbot-plus-btn'),
      attachInput: document.getElementById('chatbot-attach-input'),
      form: document.getElementById('chatbot-form'),
      input: document.getElementById('chatbot-input'),
      messages: document.getElementById('chatbot-messages'),
      sendBtn: document.querySelector('.chatbot-send-btn'),
      voiceBtn: document.getElementById('chatbot-voice-btn'),
      inputWrapper: document.getElementById('chatbot-input-wrapper'),
      dictationStatus: document.getElementById('chatbot-dictation-status'),
      rateStatus: document.getElementById('chatbot-rate-status'),
      composerStatus: document.getElementById('chatbot-composer-status'),
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
    this.elements.clearBtn && this.bindHoldToClear(this.elements.clearBtn);
    this.elements.privacyBtn?.addEventListener('click', () => {
      privacyDashboard.open();
    });
    this.elements.summarizeBtn?.addEventListener('click', () => this.summarizeConversation());
    this.elements.plusBtn?.addEventListener('click', () => this.togglePlusMenu());
    this.elements.attachInput?.addEventListener('change', e => this.handleAttachFiles(e));

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

    this.elements.voiceBtn?.addEventListener('click', event => {
      this.handleVoiceInput(event);
    });

    document.addEventListener('click', e => {
      if (!this.isOpen || !e.isTrusted) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      // Keep open when interacting with privacy sheet or other AssistMe overlays.
      if (
        this.elements.widget?.contains(target) ||
        this.elements.toggle?.contains(target) ||
        this.elements.backdrop?.contains(target) ||
        target.closest('#privacy-dashboard, .privacy-dashboard, .website-share-dialog')
      ) {
        return;
      }
      this.closeWidget();
    });

    document.addEventListener('click', e => {
      if (!this.isOpen) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('#chatbot-plus-btn, .composer-plus-popover, .writing-tools-popover')) {
        return;
      }
      this.closePlusMenu();
      this.closeWritingTools();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        if (this.elements.widget?.querySelector('.composer-plus-popover')) {
          this.closePlusMenu();
          return;
        }
        if (this.elements.widget?.querySelector('.writing-tools-popover')) {
          this.closeWritingTools();
          return;
        }
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
        if (this.isOpen) {
          this.syncMobileScrollLock();
        }
      },
      { passive: true }
    );
  }

  syncMobileScrollLock() {
    const wantLock = this.isOpen && this.isMobileViewport();
    if (wantLock && !this._mobileScrollLocked) {
      lockBodyScroll();
      this._mobileScrollLocked = true;
    } else if (!wantLock && this._mobileScrollLocked) {
      unlockBodyScroll();
      this._mobileScrollLocked = false;
    }
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
    this.syncMobileScrollLock();
    this.bindVisualViewportInsets();
    if (this.elements.backdrop) {
      this.elements.backdrop.classList.remove('hidden');
      this.elements.backdrop.classList.add('active');
      this.elements.backdrop.style.removeProperty('display');
      this.elements.backdrop.setAttribute('aria-hidden', 'false');
    }
    this.elements.widget?.classList.remove('hidden');
    this.elements.widget?.classList.add('visible');
    this.elements.widget?.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    this.elements.toggle?.setAttribute('aria-expanded', 'true');
    this.updateRateLimitBadge();
    this.showContextAwareness();
    this.syncComposerHeight();
    appleSounds.playNotification();
    setTimeout(() => {
      (this.elements.input || this.elements.widget)?.focus({ preventScroll: true });
      this.syncComposerHeight();
      // Always open at the latest message — restoreSession now forces follow-bottom.
      this.scrollEngine?.restoreSession();
      this.scrollEngine?.jumpToLatest({ announce: false });
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
    // Abort any in-flight chat stream so reopen is not stuck on isProcessing
    if (this.activeAskController) {
      try {
        this.activeAskController.abort();
      } catch (_error) {
        // ignore
      }
      this.activeAskController = null;
    }
    this.isProcessing = false;
    this.setComposerBusy(false);
    this.hideTypingIndicator?.();
    this.scrollEngine?.saveSession();
    this.closeWritingTools();
    this.stopDictation(false);
    if (this.isRealtimeVoiceActive()) {
      this.realtimeVoice.disconnect().catch(() => {});
      this.realtimeTranscriptEls = { user: null, assistant: null };
    }
    document.body.classList.remove('chatbot-open');
    this.isOpen = false;
    this.syncMobileScrollLock();
    this.unbindVisualViewportInsets();
    if (this.elements.backdrop) {
      this.elements.backdrop.classList.remove('active');
      this.elements.backdrop.classList.add('hidden');
      this.elements.backdrop.style.display = 'none';
      this.elements.backdrop.setAttribute('aria-hidden', 'true');
    }
    this.elements.widget?.classList.remove('visible');
    this.elements.widget?.classList.add('hidden');
    this.elements.widget?.setAttribute('aria-hidden', 'true');
    this.elements.toggle?.setAttribute('aria-expanded', 'false');
    const focusTarget =
      this.lastFocusedElement && document.contains(this.lastFocusedElement)
        ? this.lastFocusedElement
        : this.elements.toggle;
    focusTarget?.focus({ preventScroll: true });
  }

  clearChat() {
    this.commitClearChat({ withUndo: false });
  }

  /**
   * Hold-to-confirm clear (dqnamo pattern): press-and-hold fill, then timed undo.
   */
  bindHoldToClear(btn) {
    const HOLD_MS = 900;
    const fill = btn.querySelector('.hold-confirm-fill');

    const resetHold = () => {
      if (this._clearHold?.raf) cancelAnimationFrame(this._clearHold.raf);
      this._clearHold = null;
      btn.classList.remove('is-holding', 'is-armed');
      if (fill) fill.style.transform = 'scaleX(0)';
      btn.setAttribute('aria-label', 'Hold to clear chat');
    };

    const startHold = event => {
      if (event.button != null && event.button !== 0) return;
      if (this.isProcessing) return;
      if (event.cancelable) event.preventDefault();
      resetHold();
      btn.classList.add('is-holding');
      const started = performance.now();
      const state = { raf: 0 };
      const tick = now => {
        const progress = Math.min(1, (now - started) / HOLD_MS);
        if (fill) fill.style.transform = `scaleX(${progress})`;
        if (progress >= 1) {
          btn.classList.add('is-armed');
          this.commitClearChat({ withUndo: true });
          resetHold();
          return;
        }
        state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
      this._clearHold = state;
    };

    btn.addEventListener('pointerdown', startHold);
    ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(type => {
      btn.addEventListener(type, resetHold);
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startHold(e);
      }
    });
    btn.addEventListener('keyup', e => {
      if (e.key === 'Enter' || e.key === ' ') resetHold();
    });
  }

  commitClearChat({ withUndo = true } = {}) {
    const snapshot = {
      html: this.elements.messages?.innerHTML || '',
      conversation: this.chatAPI?.conversation ? [...this.chatAPI.conversation] : [],
      history: this.chatAPI?.history ? [...this.chatAPI.history] : [],
      lastUserMessage: this.lastUserMessage,
      messageCount: this.messageCount,
    };

    if (this.elements.messages) {
      this.elements.messages.innerHTML = '';
      this.scrollEngine?.ensureScrollAnchor();
    }
    this.scrollEngine?.clearSession();
    this.scrollEngine?.resumeFollowing('clear');
    if (typeof this.chatAPI?.clearHistory === 'function') {
      this.chatAPI.clearHistory();
    } else {
      if (this.chatAPI?.conversation) this.chatAPI.conversation = [];
      if (this.chatAPI?.history) this.chatAPI.history = [];
      clearSessionMemory();
    }
    this.lastUserMessage = '';
    this.messageCount = 0;
    this.addWelcomeMessage();
    this.updateRateLimitBadge();
    this.setAgentComposerStatus('idle');

    if (withUndo) {
      this.showClearUndo(snapshot);
    }
  }

  showClearUndo(snapshot) {
    this.dismissClearUndo(false);
    const bar = document.createElement('div');
    bar.className = 'chatbot-clear-undo';
    bar.setAttribute('role', 'status');
    bar.innerHTML = `
      <span class="chatbot-clear-undo-label">Cleared.</span>
      <button type="button" class="chatbot-clear-undo-btn">Undo</button>
      <span class="chatbot-clear-undo-timer" aria-hidden="true"></span>
    `;
    const undoBtn = bar.querySelector('.chatbot-clear-undo-btn');
    const timerEl = bar.querySelector('.chatbot-clear-undo-timer');
    const UNDO_MS = 5000;
    const started = Date.now();
    const tick = () => {
      const left = Math.max(0, UNDO_MS - (Date.now() - started));
      if (timerEl) timerEl.textContent = `${Math.ceil(left / 1000)}s`;
      if (left <= 0) {
        this.dismissClearUndo(false);
        return;
      }
      this._clearUndo.raf = requestAnimationFrame(tick);
    };
    undoBtn?.addEventListener('click', () => {
      this.restoreClearedChat(snapshot);
      this.dismissClearUndo(false);
    });
    (this.elements.widget || document.body).appendChild(bar);
    this._clearUndo = {
      bar,
      raf: requestAnimationFrame(tick),
      timer: setTimeout(() => this.dismissClearUndo(false), UNDO_MS),
    };
  }

  dismissClearUndo(restore = false) {
    if (!this._clearUndo) return;
    if (this._clearUndo.raf) cancelAnimationFrame(this._clearUndo.raf);
    if (this._clearUndo.timer) clearTimeout(this._clearUndo.timer);
    this._clearUndo.bar?.remove();
    this._clearUndo = null;
    if (restore) {
      // no-op placeholder — restore handled by caller
    }
  }

  restoreClearedChat(snapshot) {
    if (!snapshot || !this.elements.messages) return;
    this.elements.messages.innerHTML = snapshot.html || '';
    if (this.chatAPI) {
      this.chatAPI.conversation = snapshot.conversation || [];
      this.chatAPI.history = snapshot.history || [];
      saveConversation(this.chatAPI.conversation || []);
    }
    this.lastUserMessage = snapshot.lastUserMessage || '';
    this.messageCount = snapshot.messageCount || 0;
    this.scrollEngine?.jumpToLatest({ announce: false });
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
                        <div class="welcome-title">Welcome to AssistMe</div>
                        <div class="welcome-subtitle">Ask about projects, skills, experience, or contact — or use + for tools.</div>
                        <div class="welcome-chips"></div>
                    </div>
                `;
        const chips = welcomeDiv.querySelector('.welcome-chips');
        [
          ['fas fa-magnifying-glass', 'Search this site', SITE_SEARCH_PROMPT],
          ['fas fa-rocket', 'Top Projects', "What are Mangesh's top projects?"],
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
    this.setAgentComposerStatus('agentic');
    const chipEl = document.createElement('div');
    chipEl.className = 'chat-marker agentic-action-chip';
    chipEl.dataset.kind = 'tool';
    chipEl.setAttribute('role', 'status');
    chipEl.innerHTML = `
            <span class="agentic-icon" aria-hidden="true">${action.icon}</span>
            <span class="chat-marker-label agentic-label">Agent: ${action.label}</span>
            <span class="agentic-pulse" aria-hidden="true"></span>
        `;
    this.appendToMessages(chipEl, { pin: false });

    // Remove after a few seconds
    setTimeout(() => chipEl.classList.add('fade-out'), 3000);
    setTimeout(() => {
      chipEl.remove();
      if (!this.isProcessing) this.setAgentComposerStatus('idle');
    }, 3500);
  }

  // ── Message Sending ──────────────────────

  async handleSendMessage() {
    this.stopDictation(false);

    // ChatGPT-style: tap send while generating → Stop
    if (this.isProcessing) {
      this.stopGeneration();
      return;
    }

    const text = this.normalizeInput(this.elements.input?.value);
    if (!text) return;

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
    this.setComposerBusy(true);
    this.lastUserMessage = text;
    this.retryCount = 0;
    const imagesForTurn = [...(this.pendingImages || [])];
    this.pendingImages = [];
    this.renderAttachPreview();
    this.removeFollowupChips();
    this.closeWritingTools();
    this.closePlusMenu();
    appleSounds.playClick();

    // Add user message (attachments live inside the same bubble — no second card row)
    this.addMessage(text, 'user', { images: imagesForTurn });

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
        await this.streamAIResponse(text, startTime, false, {
          images: normalizeImagePayloads(imagesForTurn),
        });
      } else {
        await this.simulateTyping(this.getFallbackResponse(text), startTime);
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        this.hideTypingIndicator();
        this._abortedLastAsk = true;
        return;
      }
      console.error('Error getting AI response:', error);
      this.hideTypingIndicator();
      const rateLimited = error?.code === 'RATE_LIMITED';
      const retryAfter = Number(error?.retryAfter) || 0;
      this.addErrorMessage(
        rateLimited
          ? `${error.message || 'You have sent too many requests.'}${
              retryAfter > 0 ? ` Try again in about ${retryAfter}s.` : ' Please wait a moment.'
            }`
          : "I'm having trouble connecting. Please try again in a moment."
      );
    } finally {
      this.activeAskController = null;
      this.isProcessing = false;
      this.setComposerBusy(false);
      this.setAgentComposerStatus('idle');
      if (!this._abortedLastAsk) {
        this.messageCount++;
      }
      this._abortedLastAsk = false;
      this.updateRateLimitBadge();
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

  async paintStreamingContent(contentDiv, fullText) {
    if (!contentDiv) return;

    const paintGeneration = this._streamPaintGeneration ?? 0;
    const caret = '<span class="siri-stream-caret" aria-hidden="true"></span>';
    const useRichMarkdown = markdownService.containsMarkdown(fullText);
    const usePlainHtml = !useRichMarkdown && fullText.length >= 48;

    if (useRichMarkdown) {
      const html = await markdownService.renderAsync(fullText);
      if (paintGeneration !== this._streamPaintGeneration) return;
      contentDiv.innerHTML = `${html}${caret}`;
    } else if (usePlainHtml) {
      if (paintGeneration !== this._streamPaintGeneration) return;
      contentDiv.innerHTML = `${markdownService.renderPlain(fullText)}${caret}`;
    } else {
      if (paintGeneration !== this._streamPaintGeneration) return;
      contentDiv.replaceChildren();
      contentDiv.append(document.createTextNode(fullText));
      const caretNode = document.createElement('span');
      caretNode.className = 'siri-stream-caret';
      caretNode.setAttribute('aria-hidden', 'true');
      contentDiv.appendChild(caretNode);
    }

    this.scrollEngine?.followLiveContent(this.getStreamingMessageEl(contentDiv));
  }

  async finalizeStreamingContent(contentDiv, fullText, response) {
    if (!contentDiv) return;

    this._streamPaintGeneration = (this._streamPaintGeneration ?? 0) + 1;
    const rendered = await markdownService.renderForChatAsync(fullText, {
      userPrompt: this.lastUserMessage || '',
    });
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

  async streamAIResponse(userMessage, startTime, isRetry = false, askOptions = {}) {
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
      this._streamPaintGeneration = (this._streamPaintGeneration ?? 0) + 1;

      if (this.activeAskController) {
        try {
          this.activeAskController.abort();
        } catch (_error) {
          // ignore prior abort
        }
      }
      this.activeAskController = new AbortController();
      const signal = this.activeAskController.signal;

      const response = await this.chatAPI.ask(userMessage, {
        signal,
        regenerate: Boolean(askOptions.regenerate),
        ephemeral: Boolean(askOptions.ephemeral),
        context: this.buildPageContextPayload(),
        session_id: this.chatAPI.sessionId,
        images: normalizeImagePayloads(askOptions.images || this.pendingImages || []),
        onChunk: chunk => {
          if (signal.aborted) return;
          if (!chunk) return;
          fullText += chunk;
          ensureStreamBubble();
          this.updateThinkingStage('streaming');
          const now = Date.now();
          if (now - lastRender >= 72 || /[\n.!?]$/.test(chunk)) {
            lastRender = now;
            void this.paintStreamingContent(contentDiv, fullText);
          } else {
            this.scrollEngine?.followLiveContent(this.getStreamingMessageEl(contentDiv));
          }
        },
      });

      if (messageDiv) {
        messageDiv.classList.remove('streaming');
      }

      // Prefer authoritative final answer (e.g. done.full_content after stream
      // fallback replaced classifier junk) over partial painted chunks.
      const finalAnswer = (response && (response.answer || response.content)) || '';
      if (finalAnswer && finalAnswer !== fullText) {
        fullText = finalAnswer;
        ensureStreamBubble();
        if (contentDiv) {
          void this.paintStreamingContent(contentDiv, fullText);
        }
      } else if (!fullText && finalAnswer) {
        fullText = finalAnswer;
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
        return this.streamAIResponse(userMessage, startTime, true, askOptions);
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
        await this.finalizeStreamingContent(contentDiv, fullText, response);
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

    const regenBtn = this.createActionButton('fa-redo', 'Regenerate', () => {
      this.regenerateAssistantMessage(messageDiv);
    });
    actionsDiv.appendChild(regenBtn);

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

    if (metadata.knowledgeContext) {
      const sources = document.createElement('div');
      sources.className = 'meta-sources';
      sources.innerHTML =
        '<span class="meta-sources-label">Sources</span> <span class="meta-sources-item">Portfolio site knowledge</span>';
      detailsRow.appendChild(sources);
      detailsRow.classList.add('has-sources');
    }

    metaContainer.appendChild(detailsRow);
    messageDiv.appendChild(metaContainer);
  }

  // ── Markdown Rendering ──────────────────────

  async renderMarkdown(text) {
    return markdownService.renderAsync(text);
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
    if (text) {
      contentDiv.textContent = text;
    }

    const images = Array.isArray(options.images) ? options.images : [];
    if (images.length) {
      messageDiv.classList.add('has-attachments');
      const thumbs = document.createElement('div');
      thumbs.className = 'attachment-thumbs';
      images.forEach((image, index) => {
        const card = this.createAttachmentCard(image, index, { removable: false });
        if (card) thumbs.appendChild(card);
      });
      contentDiv.appendChild(thumbs);
    }

    messageDiv.appendChild(contentDiv);
    // User turns: pin via beginUserTurn (anchors near top). Assistant: follow if reading.
    this.appendToMessages(messageDiv, {
      pin: options.forceScroll ? 'force' : role === 'user' ? false : 'if-following',
    });

    if (role === 'user') {
      this.scrollEngine?.beginUserTurn(messageDiv);
      // Re-pin after the message paints and any offline auto-reply starts
      requestAnimationFrame(() => {
        this.scrollEngine?.scrollTurnIntoView(messageDiv);
      });
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
    this.setAgentComposerStatus('thinking');
    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator rich-block-thinking';
    indicator.id = 'chatbot-typing-indicator';
    indicator.innerHTML = `
            <div class="thinking-content">
                <div class="thinking-brain">
                    <i class="fas fa-brain"></i>
                </div>
                <div class="thinking-text">
                    <span class="thinking-stage chat-text-shimmer">Thinking</span>
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
    this.setAgentComposerStatus(stage);
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
      stageEl.classList.add('chat-text-shimmer');
      if (iconEl) iconEl.className = s.icon;
      indicator?.classList.toggle('rich-block-thinking--streaming', stage === 'streaming');
      shimmer?.setAttribute('data-stage', stage);
    }
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('chatbot-typing-indicator');
    if (!indicator) {
      if (!this.isProcessing) this.setAgentComposerStatus('idle');
      return;
    }
    const wasFollowing = this.scrollEngine?.isFollowing();
    indicator.remove();
    if (!this.isProcessing) this.setAgentComposerStatus('idle');
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

  async handleVoiceInput(event) {
    if (this.isRealtimeVoiceActive()) {
      await this.toggleRealtimeVoice();
      return;
    }

    const preferDictation = event?.shiftKey === true;
    if (!preferDictation && this.realtimeAvailable) {
      await this.toggleRealtimeVoice();
      return;
    }

    if (this.isListening) {
      this.stopDictation(false);
      return;
    }

    this.startDictation();
  }

  // ── Apple Intelligence: Conversation Summary (WWDC26) ──────────

  countUserMessages() {
    const root = this.elements.messages;
    if (!root) return this.messageCount || 0;
    return root.querySelectorAll('.message.user-message, .user-message').length;
  }

  summarizeConversation() {
    if (this.isProcessing) return;

    if (this.countUserMessages() === 0 && this.messageCount === 0) {
      this.addMessage(
        'There is nothing to summarize yet — ask me something first, then I can recap the conversation.',
        'assistant'
      );
      return;
    }

    void this.runEphemeralAssistantTurn(
      'Summarize our conversation so far in 3 short bullet points. Do not invent details that were not discussed.'
    );
  }

  async runEphemeralAssistantTurn(prompt) {
    if (this.isProcessing || !prompt) return;
    if (!this.chatAPI || typeof this.chatAPI.ask !== 'function') {
      this.addErrorMessage('AssistMe is not ready yet. Try again in a moment.');
      return;
    }

    this.isProcessing = true;
    this.setComposerBusy(true);
    this.removeFollowupChips();
    this.showThinkingIndicator();
    const startTime = Date.now();
    try {
      await this.streamAIResponse(prompt, startTime, false, { ephemeral: true });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Ephemeral turn failed:', error);
        this.addErrorMessage('Could not complete that request. Please try again.');
      }
    } finally {
      this.activeAskController = null;
      this.isProcessing = false;
      this.setComposerBusy(false);
      this.setAgentComposerStatus('idle');
      this.updateRateLimitBadge();
    }
  }

  async regenerateAssistantMessage(messageDiv) {
    if (this.isProcessing || !this.lastUserMessage) return;
    messageDiv?.remove();
    this.removeFollowupChips();
    this.isProcessing = true;
    this.setComposerBusy(true);
    this.showThinkingIndicator();
    const startTime = Date.now();
    try {
      await this.streamAIResponse(this.lastUserMessage, startTime, false, { regenerate: true });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Regenerate failed:', error);
        this.addErrorMessage('Could not regenerate. Please try again.');
      }
    } finally {
      this.activeAskController = null;
      this.isProcessing = false;
      this.setComposerBusy(false);
      this.setAgentComposerStatus('idle');
      this.updateRateLimitBadge();
    }
  }

  // ── Composer Plus menu (InputGroup pattern) ──────────────────

  togglePlusMenu() {
    const existing = this.elements.widget?.querySelector('.composer-plus-popover');
    if (existing) {
      this.closePlusMenu();
      return;
    }

    this.closeWritingTools();

    const popover = document.createElement('div');
    popover.className = 'composer-plus-popover';
    popover.setAttribute('role', 'menu');
    popover.setAttribute('aria-label', 'Add to message');

    const title = document.createElement('div');
    title.className = 'composer-plus-title';
    title.textContent = 'Add';
    popover.appendChild(title);

    const items = [
      {
        icon: 'fa-image',
        label: 'Attach image',
        onSelect: () => this.elements.attachInput?.click(),
      },
      {
        icon: 'fa-pen-nib',
        label: 'Writing Tools',
        onSelect: () => this.toggleWritingTools(),
      },
      {
        icon: 'fa-wand-magic-sparkles',
        label: 'Summarize chat',
        onSelect: () => this.summarizeConversation(),
      },
    ];

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'composer-plus-option';
      btn.setAttribute('role', 'menuitem');
      const icon = document.createElement('i');
      icon.className = TRUSTED_ICON_CLASS.test(item.icon) ? `fas ${item.icon}` : 'fas fa-circle';
      icon.setAttribute('aria-hidden', 'true');
      btn.append(icon, document.createTextNode(` ${item.label}`));
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        this.closePlusMenu();
        item.onSelect();
      });
      popover.appendChild(btn);
    });

    this.elements.form?.appendChild(popover);
    this.elements.plusBtn?.setAttribute('aria-expanded', 'true');
  }

  closePlusMenu() {
    this.elements.widget?.querySelectorAll('.composer-plus-popover').forEach(el => el.remove());
    this.elements.plusBtn?.setAttribute('aria-expanded', 'false');
  }

  // ── Apple Intelligence: Writing Tools (WWDC26) ──────────────────

  toggleWritingTools() {
    const existing = this.elements.widget?.querySelector('.writing-tools-popover');
    if (existing) {
      this.closeWritingTools();
      return;
    }

    this.closePlusMenu();

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
  }

  closeWritingTools() {
    this.elements.widget?.querySelectorAll('.writing-tools-popover').forEach(el => el.remove());
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

    const busyBtn = this.elements.plusBtn;
    const originalIcon = busyBtn?.innerHTML;
    if (busyBtn) {
      busyBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
      busyBtn.disabled = true;
    }
    this.isProcessing = true;

    try {
      const response = await this.chatAPI.ask(`${tool.instruction}\n\n"${draft}"`, {
        ephemeral: true,
        context: this.buildPageContextPayload(),
        session_id: this.chatAPI.sessionId,
      });
      const rewritten = this.normalizeInput(response?.answer || response?.content || '')
        .replace(/^["'\u201c]+/, '')
        .replace(/["'\u201d]+$/, '');

      if (rewritten) {
        this.elements.input.value = rewritten;
        this.autoResizeTextarea(this.elements.input);
        this.decrementRemainingQueries();
        if (this.elements.rateStatus) {
          this.elements.rateStatus.textContent = `${tool.label} applied — review and send.`;
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
      if (busyBtn) {
        busyBtn.innerHTML = originalIcon;
        busyBtn.disabled = false;
      }
      this.elements.input?.focus();
    }
  }

  async handleAttachFiles(event) {
    const files = Array.from(event?.target?.files || []);
    if (event?.target) event.target.value = '';
    if (!files.length) return;

    const next = [];
    for (const file of files.slice(0, 2)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 1_200_000) {
        if (this.elements.rateStatus) {
          this.elements.rateStatus.textContent = 'Image too large — keep under ~1.2MB.';
        }
        continue;
      }
      const dataUrl = await this.readFileAsDataUrl(file);
      if (dataUrl) {
        next.push({
          src: dataUrl,
          name: file.name || `image-${next.length + 1}.png`,
        });
      }
    }
    this.pendingImages = next.slice(0, 2);
    this.renderAttachPreview();
    if (this.pendingImages.length && this.elements.rateStatus) {
      this.elements.rateStatus.textContent = `${this.pendingImages.length} image attached`;
    } else {
      this.updateRateLimitBadge();
    }
  }

  readFileAsDataUrl(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  createAttachmentCard(image, index, { removable = false } = {}) {
    const src = imageSrc(image);
    if (!src) return null;

    const figure = document.createElement('figure');
    figure.className = 'chat-attachment';

    const img = document.createElement('img');
    img.src = src;
    img.alt = imageDisplayName(image, index);
    img.loading = 'lazy';
    figure.appendChild(img);

    const caption = document.createElement('figcaption');
    caption.className = 'chat-attachment-meta';
    const name = document.createElement('span');
    name.className = 'chat-attachment-name';
    name.textContent = imageDisplayName(image, index);
    caption.appendChild(name);

    if (removable) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'chat-attachment-remove';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        this.pendingImages = (this.pendingImages || []).filter((_, i) => i !== index);
        this.renderAttachPreview();
        if (this.elements.rateStatus && !this.pendingImages.length) {
          this.elements.rateStatus.textContent = '';
        }
      });
      caption.appendChild(removeBtn);
    }

    figure.appendChild(caption);
    return figure;
  }

  renderAttachPreview() {
    const wrapper = this.elements.inputWrapper || this.elements.form;
    wrapper?.querySelectorAll('.chatbot-attach-preview').forEach(el => el.remove());
    if (!this.pendingImages?.length || !wrapper) return;
    const bar = document.createElement('div');
    bar.className = 'chatbot-attach-preview';
    this.pendingImages.forEach((image, index) => {
      const card = this.createAttachmentCard(image, index, { removable: true });
      if (card) bar.appendChild(card);
    });
    wrapper.appendChild(bar);
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

  buildPageContextPayload() {
    const pageCtx = this.getVisibleSectionContext();
    const projects = Array.from(document.querySelectorAll('[data-project-title], .project-card h3'))
      .slice(0, 6)
      .map(el => ({
        title: (el.getAttribute('data-project-title') || el.textContent || '').trim().slice(0, 80),
      }))
      .filter(p => p.title);

    return {
      currentSection: pageCtx?.label || pageCtx?.sectionId || '',
      sectionId: pageCtx?.sectionId || '',
      pagePath: typeof location !== 'undefined' ? location.pathname : '',
      pageTitle: typeof document !== 'undefined' ? document.title : '',
      visibleProjects: projects,
    };
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

// Initialize chatbot once — avoid wiping an open session if this module is
// dynamically imported again (lazy bootstrap / HMR / second import()).
function initAppleIntelligenceChatbot() {
  if (window.appleIntelligenceChatbot) return window.appleIntelligenceChatbot;
  window.appleIntelligenceChatbot = new AppleIntelligenceChatbot();
  return window.appleIntelligenceChatbot;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppleIntelligenceChatbot, { once: true });
} else {
  initAppleIntelligenceChatbot();
}

export default AppleIntelligenceChatbot;
export { initAppleIntelligenceChatbot };

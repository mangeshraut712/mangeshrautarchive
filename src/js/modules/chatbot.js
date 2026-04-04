import { privacyDashboard } from './privacy-dashboard.js';
import { intelligentAssistant as chatAssistant } from '../core/chat.js';
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
function inferFollowupContext(e) {
  const t = (e || '').toLowerCase();
  return /\b(tensorflow|pytorch|scikit|ml model|neural|nlp|deep learning|ai|machine learning)\b/.test(
    t
  )
    ? 'aiml'
    : /\b(skill|stack|language|framework|proficient|expertise)\b/.test(t)
      ? 'skills'
      : /\b(experience|role|company|achievement|position|engineer)\b/.test(t)
        ? 'experience'
        : /\b(project|repo|github|built|developed)\b/.test(t)
          ? 'projects'
          : /\b(degree|university|gpa|education|drexel|pune)\b/.test(t)
            ? 'education'
            : /\b(contact|email|linkedin|phone|reach)\b/.test(t)
              ? 'contact'
              : /\b(paper|publication|ieee|research)\b/.test(t)
                ? 'publications'
                : /\b(certif|aws cloud|oracle|tensorflow dev)\b/.test(t)
                  ? 'certifications'
                  : /\b(navigate|resume|download|schedule|action)\b/.test(t)
                    ? 'agents'
                    : 'default';
}
function normalizeFollowupPrompt(e) {
  return e && 'string' == typeof e ? e.replace(/^[^A-Za-z0-9]+/, '').trim() : '';
}
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
  { pattern: /\b(search|find|filter)\s+(for\s+)?/i, action: 'search', icon: '🔍', label: 'Search' },
  {
    pattern: /\btheme\b|\b(dark|light)\s*mode\b/i,
    action: 'theme',
    icon: '🎨',
    label: 'Toggle Theme',
  },
];
class AppleIntelligenceChatbot {
  constructor() {
    ((this.elements = this.initializeElements()),
      (this.isOpen = !1),
      (this.isProcessing = !1),
      (this.chatAPI = null),
      (this.recognition = null),
      (this.isListening = !1),
      (this.lastUserMessage = ''),
      (this.messageCount = 0),
      (this.retryCount = 0),
      this.elements.widget && this.elements.toggle
        ? (this.waitForChatAPI(),
          this.initVoiceRecognition(),
          this.bindEvents(),
          this.addWelcomeMessage())
        : console.error('Chatbot elements not found'));
  }
  async waitForChatAPI() {
    if (!chatAssistant || 'function' != typeof chatAssistant.ask)
      return (
        console.warn('⚠️ Chat API not available, using fallback'),
        void this.updateStatusIndicator('local')
      );
    if (
      ((this.chatAPI = chatAssistant),
      'function' == typeof this.chatAPI.isReady && !this.chatAPI.isReady())
    )
      try {
        await this.chatAPI.initialize();
      } catch (e) {
        console.warn('Chat API initialization failed, continuing in fallback mode:', e);
      }
    (console.log('✅ Chat API connected'), this.updateStatusIndicator('online'));
  }
  updateStatusIndicator(e) {
    const t = this.elements.widget?.querySelector('.chatbot-status-dot'),
      s = this.elements.widget?.querySelector('.chatbot-status-text');
    if ((t && (t.className = `chatbot-status-dot status-${e}`), s)) {
      const t = { online: 'Connected', local: 'Local Mode', offline: 'Offline' };
      s.textContent = t[e] || 'Ready';
    }
  }
  initVoiceRecognition() {
    const e = window.SpeechRecognition || window.webkitSpeechRecognition;
    e &&
      ((this.recognition = new e()),
      (this.recognition.continuous = !1),
      (this.recognition.interimResults = !0),
      (this.recognition.lang = 'en-US'),
      (this.recognition.onresult = e => {
        const t = Array.from(e.results)
          .map(e => e[0].transcript)
          .join('');
        this.elements.input &&
          ((this.elements.input.value = t), this.autoResizeTextarea(this.elements.input));
        const s = e.results[e.results.length - 1];
        s && s.isFinal && this.handleSendMessage();
      }),
      (this.recognition.onend = () => {
        ((this.isListening = !1), this.updateVoiceButtonState());
      }),
      (this.recognition.onerror = e => {
        (console.error('Speech recognition error:', e.error),
          (this.isListening = !1),
          this.updateVoiceButtonState());
      }));
  }
  updateVoiceButtonState() {
    this.elements.voiceBtn &&
      (this.isListening
        ? (this.elements.voiceBtn.classList.add('listening'),
          (this.elements.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>'))
        : (this.elements.voiceBtn.classList.remove('listening'),
          (this.elements.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>')));
  }
  initializeElements() {
    const e = {
      widget: document.getElementById('chatbot-widget'),
      toggle: document.getElementById('chatbot-toggle'),
      closeBtn: document.querySelector('.chatbot-close-btn'),
      clearBtn: document.getElementById('chatbot-clear-btn'),
      privacyBtn: document.getElementById('chatbot-privacy-btn'),
      form: document.getElementById('chatbot-form'),
      input: document.getElementById('chatbot-input'),
      messages: document.getElementById('chatbot-messages'),
      sendBtn: document.querySelector('.chatbot-send-btn'),
      voiceBtn: document.getElementById('chatbot-voice-btn'),
    };
    if (e.input && !this.shadowDiv) {
      ((this.shadowDiv = document.createElement('div')),
        (this.shadowDiv.style.position = 'absolute'),
        (this.shadowDiv.style.visibility = 'hidden'),
        (this.shadowDiv.style.height = 'auto'),
        (this.shadowDiv.style.width = e.input.clientWidth + 'px'),
        (this.shadowDiv.style.whiteSpace = 'pre-wrap'),
        (this.shadowDiv.style.wordWrap = 'break-word'),
        (this.shadowDiv.style.overflow = 'hidden'));
      const t = window.getComputedStyle(e.input);
      ((this.shadowDiv.style.fontFamily = t.fontFamily),
        (this.shadowDiv.style.fontSize = t.fontSize),
        (this.shadowDiv.style.lineHeight = t.lineHeight),
        (this.shadowDiv.style.padding = t.padding),
        (this.shadowDiv.style.boxSizing = t.boxSizing),
        (this.shadowDiv.style.border = t.border),
        document.body.appendChild(this.shadowDiv));
    }
    return e;
  }
  autoResizeTextarea(e) {
    if (!e || !this.shadowDiv) return;
    ((this.shadowDiv.style.width = e.clientWidth + 'px'),
      (this.shadowDiv.textContent = e.value + '​'));
    const t = Math.min(this.shadowDiv.scrollHeight, 120);
    e.style.height = `${Math.max(t, 24)}px`;
  }
  bindEvents() {
    (this.elements.toggle?.addEventListener('click', () => this.toggleWidget()),
      this.elements.closeBtn?.addEventListener('click', () => this.closeWidget()),
      this.elements.clearBtn?.addEventListener('click', () => this.clearChat()),
      this.elements.privacyBtn?.addEventListener('click', () => {
        (console.log('🛡️ Opening Privacy Dashboard'), privacyDashboard.open());
      }),
      this.elements.form?.addEventListener('submit', e => {
        (e.preventDefault(), e.stopImmediatePropagation(), this.handleSendMessage());
      }),
      this.elements.input?.addEventListener('input', () => {
        this.autoResizeTextarea(this.elements.input);
      }),
      this.elements.input?.addEventListener('keydown', e => {
        'Enter' !== e.key ||
          e.shiftKey ||
          (e.preventDefault(), e.stopImmediatePropagation(), this.handleSendMessage());
      }),
      this.elements.voiceBtn?.addEventListener('click', () => {
        this.handleVoiceInput();
      }),
      document.addEventListener('click', e => {
        !this.isOpen ||
          this.elements.widget.contains(e.target) ||
          this.elements.toggle.contains(e.target) ||
          this.closeWidget();
      }),
      document.addEventListener('keydown', e => {
        'Escape' === e.key && this.isOpen && this.closeWidget();
      }));
  }
  toggleWidget() {
    this.isOpen ? this.closeWidget() : this.openWidget();
  }
  openWidget() {
    (document.body.classList.add('chatbot-open'),
      this.elements.widget?.classList.remove('hidden'),
      this.elements.widget?.classList.add('visible'),
      (this.isOpen = !0),
      setTimeout(() => {
        this.elements.input?.focus();
      }, 300));
  }
  closeWidget() {
    (document.body.classList.remove('chatbot-open'),
      this.elements.widget?.classList.remove('visible'),
      this.elements.widget?.classList.add('hidden'),
      (this.isOpen = !1),
      this.elements.toggle?.focus({ preventScroll: !0 }));
  }
  clearChat() {
    (this.elements.messages && (this.elements.messages.innerHTML = ''),
      this.chatAPI?.conversation && (this.chatAPI.conversation = []),
      this.chatAPI?.history && (this.chatAPI.history = []),
      (this.lastUserMessage = ''),
      (this.messageCount = 0),
      this.addWelcomeMessage());
  }
  addWelcomeMessage() {
    setTimeout(() => {
      if (this.elements.messages && 0 === this.elements.messages.children.length) {
        const e = document.createElement('div');
        ((e.className = 'message assistant-message welcome-message welcome-message-simplified'),
          (e.innerHTML =
            '\n                    <div class="message-content">\n                        <div class="welcome-header">\n                            <div class="welcome-brand">\n                                <span class="welcome-name">AssistMe</span>\n                                <span class="welcome-helper-text">Portfolio Guide</span>\n                            </div>\n                            <div class="welcome-status-badge">\n                                <span class="chatbot-status-dot status-online"></span>\n                                <span class="chatbot-status-text">Connected</span>\n                            </div>\n                        </div>\n                        <div class="welcome-title">Welcome</div>\n                        <div class="welcome-subtitle">Ask about projects, skills, experience, or contact details. Start with one quick option below.</div>\n                        \n                        <div class="welcome-capabilities">\n                            <span class="capability-badge"><i class="fas fa-briefcase"></i> Portfolio</span>\n                            <span class="capability-badge"><i class="fas fa-brain"></i> AI/ML</span>\n                            <span class="capability-badge"><i class="fas fa-compass"></i> Navigation</span>\n                        </div>\n\n                        <div class="welcome-chips">\n                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask(\'What are Mangesh\\\'s top projects?\')"><i class="fas fa-rocket"></i> Top Projects</button>\n                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask(\'What AI and ML projects has Mangesh built?\')"><i class="fas fa-brain"></i> AI/ML Work</button>\n                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask(\'Tell me about Mangesh\\\'s work experience\')"><i class="fas fa-briefcase"></i> Experience</button>\n                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask(\'How can I contact Mangesh?\')"><i class="fas fa-envelope"></i> Contact</button>\n                        </div>\n                    </div>\n                '),
          this.elements.messages.appendChild(e));
      }
    }, 600);
  }
  detectAgenticAction(e) {
    for (const t of AGENTIC_PATTERNS) if (t.pattern.test(e)) return t;
    return null;
  }
  showAgenticChip(e) {
    const t = document.createElement('div');
    ((t.className = 'agentic-action-chip'),
      (t.innerHTML = `\n            <span class="agentic-icon">${e.icon}</span>\n            <span class="agentic-label">Agent: ${e.label}</span>\n            <span class="agentic-pulse"></span>\n        `),
      this.elements.messages?.appendChild(t),
      this.scrollToBottom(),
      setTimeout(() => t.classList.add('fade-out'), 3e3),
      setTimeout(() => t.remove(), 3500));
  }
  async handleSendMessage() {
    const e = this.elements.input?.value.trim();
    if (!e || this.isProcessing) return;
    ((this.isProcessing = !0),
      (this.lastUserMessage = e),
      (this.retryCount = 0),
      this.removeFollowupChips(),
      this.addMessage(e, 'user'),
      this.elements.input &&
        ((this.elements.input.value = ''), this.autoResizeTextarea(this.elements.input)));
    const t = this.detectAgenticAction(e);
    (t && this.showAgenticChip(t), this.showThinkingIndicator());
    const s = Date.now();
    try {
      this.chatAPI && 'function' == typeof this.chatAPI.ask
        ? await this.streamAIResponse(e, s)
        : await this.simulateTyping(this.getFallbackResponse(e), s);
    } catch (e) {
      (console.error('Error getting AI response:', e),
        this.hideTypingIndicator(),
        this.addErrorMessage("I'm having trouble connecting. Please try again in a moment."));
    } finally {
      ((this.isProcessing = !1), this.messageCount++);
    }
  }
  async streamAIResponse(e, t, s = !1) {
    this.hideTypingIndicator();
    const n = document.createElement('div');
    n.className = 'message assistant-message';
    const i = document.createElement('div');
    ((i.className = 'message-content'),
      (i.textContent = ''),
      n.appendChild(i),
      this.elements.messages?.appendChild(n),
      this.scrollToBottom());
    let a = '',
      o = {};
    try {
      (n.classList.add('streaming'), this.updateThinkingStage('generating'));
      const c = await this.chatAPI.ask(e, {
        onChunk: e => {
          ((a += e), (i.textContent = a + '▊'), this.scrollToBottom());
        },
      });
      if (
        (n.classList.remove('streaming'),
        !a && c && (c.answer || c.content) && (a = c.answer || c.content),
        !a && !s)
      )
        return (
          console.log('🔄 Empty response, auto-retrying...'),
          n.remove(),
          this.retryCount++,
          this.showThinkingIndicator(),
          await new Promise(e => setTimeout(e, 500)),
          this.streamAIResponse(e, t, !0)
        );
      if (a) {
        const e = this.renderMarkdown(a);
        ((i.innerHTML = e),
          window.Prism
            ? i.querySelectorAll('pre code').forEach(e => {
                window.Prism.highlightElement(e);
              })
            : window.hljs &&
              i.querySelectorAll('pre code').forEach(e => {
                window.hljs.highlightElement(e);
              }));
      } else
        ((a =
          'I received an empty response. Let me try a different approach — please rephrase your question or try one of the suggestions below.'),
          (i.textContent = a),
          (o.error = !0));
      const l = Date.now() - t,
        r = c?.metadata?.tokens || Math.ceil(a.length / 4),
        d = Math.max(l / 1e3, 0.001);
      ((o = {
        source: c?.metadata?.source || c?.source || 'Neural API',
        model: c?.metadata?.model || c?.model || 'x-ai/grok-4.1-fast',
        category: c?.metadata?.category || 'General',
        runtime: l,
        tokens: r,
        tokensPerSecond: c?.metadata?.tokensPerSecond || r / d,
        cost: c?.metadata?.cost,
        confidence: c?.metadata?.confidence,
        retried: this.retryCount > 0,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: !0,
        }),
      }),
        this.addCondensedMetadata(n, i, o),
        this.showFollowupChips(a));
    } catch (e) {
      if ((console.error('Streaming error:', e), n.classList.remove('streaming'), !a))
        return (
          n.remove(),
          void this.addErrorMessage('The response was interrupted. Please try again.')
        );
      ((i.textContent = a),
        this.addCondensedMetadata(n, i, {
          source: 'Neural API',
          model: 'Interrupted',
          category: 'Error',
          runtime: Date.now() - t,
          tokens: Math.ceil(a.length / 4),
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !0,
          }),
        }),
        this.addErrorMessage('Partial response shown. Tap Retry for a complete response.'));
    }
  }
  addCondensedMetadata(e, t, s) {
    const n = document.createElement('div');
    n.className = 'message-metadata-v2';
    const i = document.createElement('div');
    i.className = 'meta-primary';
    const a = document.createElement('span');
    a.className = 'meta-model-badge';
    const o = (s.model || '').split('/').pop() || 'AI';
    if (
      ((a.innerHTML = `<i class="fas fa-sparkles"></i> ${this.escapeHtml(o)}`),
      i.appendChild(a),
      s.runtime)
    ) {
      const e = document.createElement('span');
      e.className = 'meta-runtime';
      const t = s.runtime < 1e3 ? `${s.runtime}ms` : `${(s.runtime / 1e3).toFixed(1)}s`;
      ((e.textContent = t), i.appendChild(e));
    }
    if (s.retried) {
      const e = document.createElement('span');
      ((e.className = 'meta-retry-badge'), (e.textContent = '↻ retried'), i.appendChild(e));
    }
    const c = document.createElement('span');
    ((c.style.flex = '1'), i.appendChild(c));
    const l = document.createElement('div');
    l.className = 'meta-actions';
    const r = this.createActionButton('fa-copy', 'Copy', () => {
      this.copyText(t.textContent, r);
    });
    l.appendChild(r);
    const d = this.createActionButton('fa-volume-up', 'Read Aloud', () => {
      this.speakText(t.textContent, d);
    });
    l.appendChild(d);
    const h = this.createActionButton('fa-chevron-down', 'Details', () => {
      const e = n.querySelector('.meta-details');
      if (e) {
        e.classList.toggle('expanded');
        h.querySelector('i').className = e.classList.contains('expanded')
          ? 'fas fa-chevron-up'
          : 'fas fa-chevron-down';
      }
    });
    (l.appendChild(h), i.appendChild(l), n.appendChild(i));
    const p = document.createElement('div');
    p.className = 'meta-details';
    const m = [];
    if (
      (s.source && m.push(`🔌 ${s.source}`),
      s.tokens && m.push(`🎯 ${s.tokens} tokens`),
      s.tokensPerSecond && m.push(`⚡ ${Math.round(s.tokensPerSecond)} tok/s`),
      s.confidence && m.push(`✓ ${Math.round(100 * s.confidence)}%`),
      s.cost)
    ) {
      const e = 'number' == typeof s.cost ? `$${s.cost.toFixed(4)}` : s.cost;
      m.push(`💰 ${e}`);
    }
    (s.timestamp && m.push(`🕐 ${s.timestamp}`),
      (p.innerHTML = m.map(e => `<span class="meta-detail-chip">${e}</span>`).join('')),
      n.appendChild(p),
      e.appendChild(n));
  }
  renderMarkdown(e) {
    if (window.marked)
      try {
        window.marked.setOptions({ breaks: !0, gfm: !0, headerIds: !1, mangle: !1 });
        let t = window.marked.parse(e);
        return (
          window.DOMPurify &&
            (t = window.DOMPurify.sanitize(t, {
              ALLOWED_TAGS: [
                'p',
                'br',
                'strong',
                'b',
                'em',
                'i',
                'u',
                'a',
                'ul',
                'ol',
                'li',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'pre',
                'code',
                'blockquote',
                'table',
                'thead',
                'tbody',
                'tr',
                'th',
                'td',
                'hr',
                'span',
                'div',
              ],
              ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
            })),
          t
        );
      } catch (e) {
        console.warn('Markdown parsing failed, using fallback:', e);
      }
    return this.simpleMarkdownToHTML(e);
  }
  simpleMarkdownToHTML(e) {
    let t = e
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return (
      (t = '<p>' + t + '</p>'),
      (t = t.replace(/(<li>.*?<\/li>)(\s*<li>)/g, '$1$2')),
      (t = t.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')),
      (t = t.replace(/<\/ul>\s*<ul>/g, '')),
      (t = t.replace(/<p><\/p>/g, '')),
      (t = t.replace(/<p>\s*<br>\s*<\/p>/g, '')),
      t
    );
  }
  async simulateTyping(e, t) {
    this.hideTypingIndicator();
    const s = document.createElement('div');
    s.className = 'message assistant-message';
    const n = document.createElement('div');
    ((n.className = 'message-content'), s.appendChild(n), this.elements.messages?.appendChild(s));
    for (let t = 0; t < e.length; t++)
      ((n.textContent = e.substring(0, t + 1) + '▊'),
        this.scrollToBottom(),
        await new Promise(e => setTimeout(e, 20)));
    n.textContent = e;
    const i = {
      source: 'Local Intelligence',
      model: 'Portfolio RAG',
      category: 'Portfolio',
      runtime: Date.now() - t,
      tokens: Math.ceil(e.length / 4),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !0,
      }),
    };
    (this.addCondensedMetadata(s, n, i), this.showFollowupChips(e));
  }
  createChip(e, t, s) {
    const n = document.createElement('span');
    return ((n.className = `meta-chip meta-chip-${s}`), (n.innerHTML = `${e} ${t}`), n);
  }
  createActionButton(e, t, s) {
    const n = document.createElement('button');
    return (
      (n.className = 'msg-action-btn'),
      (n.title = t),
      (n.innerHTML = `<i class="fas ${e}"></i>`),
      (n.onclick = e => {
        (e.stopPropagation(), s());
      }),
      n
    );
  }
  escapeHtml(e) {
    return String(e)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  copyText(e, t) {
    navigator.clipboard
      .writeText(e)
      .then(() => {
        const e = t.innerHTML;
        ((t.innerHTML = '<i class="fas fa-check"></i>'),
          t.classList.add('success'),
          setTimeout(() => {
            ((t.innerHTML = e), t.classList.remove('success'));
          }, 2e3));
      })
      .catch(e => {
        console.error('Copy failed:', e);
      });
  }
  speakText(e, t) {
    if ('speechSynthesis' in window)
      if (window.speechSynthesis.speaking)
        (window.speechSynthesis.cancel(),
          (t.innerHTML = '<i class="fas fa-volume-up"></i>'),
          t.classList.remove('speaking'));
      else {
        const s = new SpeechSynthesisUtterance(e);
        ((s.rate = 1),
          (s.pitch = 1),
          (t.innerHTML = '<i class="fas fa-stop"></i>'),
          t.classList.add('speaking'),
          (s.onend = () => {
            ((t.innerHTML = '<i class="fas fa-volume-up"></i>'), t.classList.remove('speaking'));
          }),
          window.speechSynthesis.speak(s));
      }
  }
  getFallbackResponse(e) {
    const t = e.toLowerCase();
    return t.includes('ai') || t.includes('ml') || t.includes('machine learning')
      ? 'Mangesh has hands-on experience with Machine Learning and AI, including demand forecasting with LSTM models (TensorFlow), network intrusion detection (published at IEEE), and building intelligent chatbots with RAG architecture. His tech stack includes TensorFlow, scikit-learn, Python, and various NLP tools.'
      : t.includes('skill') || t.includes('technology')
        ? 'Mangesh is proficient in Java, Python, Spring Boot, React, Angular, AWS, and Machine Learning. His expertise spans full-stack development, cloud infrastructure, and AI/ML engineering.'
        : t.includes('experience') || t.includes('work')
          ? 'Mangesh is currently a Software Engineer at Customized Energy Solutions, optimizing energy analytics with 40% efficiency gains. Previously at IoasiZ, he refactored monoliths into microservices and resolved 50+ critical bugs.'
          : t.includes('project')
            ? "Mangesh's key projects include this AI-powered portfolio with RAG chatbot, a Bug Reporting System (Django + React), demand forecasting with LSTM, and a DevVit Reddit game. Visit the Projects section to explore more."
            : t.includes('education')
              ? "Mangesh holds a Master of Science in Computer Science from Drexel University (GPA 3.76) and a Bachelor of Engineering from Savitribai Phule Pune University. He's also published research at IEEE on ML-based intrusion detection."
              : t.includes('contact') || t.includes('reach')
                ? 'You can reach Mangesh at mbr63@drexel.edu, call at +1 (609) 505-3500, or connect on LinkedIn (linkedin.com/in/mangeshraut71298). The Contact section below has a form too.'
                : "I can help you learn about Mangesh's AI/ML expertise, projects, skills, experience, and education. Try asking something specific, or use the suggestion chips below!";
  }
  addMessage(e, t, s = {}) {
    const n = document.createElement('div');
    n.className = `message ${t}-message`;
    const i = document.createElement('div');
    ((i.className = 'message-content'),
      (i.textContent = e),
      n.appendChild(i),
      this.elements.messages?.appendChild(n),
      this.scrollToBottom());
  }
  addErrorMessage(e) {
    const t = document.createElement('div');
    t.className = 'message assistant-message error-message';
    const s = document.createElement('div');
    ((s.className = 'message-content'), (s.textContent = e), t.appendChild(s));
    const n = document.createElement('button');
    ((n.className = 'chatbot-retry-btn'),
      (n.innerHTML = '<i class="fas fa-redo"></i> Retry'),
      (n.onclick = e => {
        (e.stopPropagation(),
          t.remove(),
          this.lastUserMessage &&
            ((this.elements.input.value = this.lastUserMessage), this.handleSendMessage()));
      }),
      t.appendChild(n),
      this.elements.messages?.appendChild(t),
      this.scrollToBottom());
  }
  showFollowupChips(e) {
    this.removeFollowupChips();
    const t = inferFollowupContext(e),
      s = FOLLOWUP_CHIPS[t] || FOLLOWUP_CHIPS.default,
      n = document.createElement('div');
    ((n.className = 'chatbot-followup-chips'),
      n.setAttribute('role', 'list'),
      n.setAttribute('aria-label', 'Follow-up suggestions'),
      s.forEach(e => {
        const t = document.createElement('button');
        ((t.type = 'button'),
          (t.className = 'followup-chip'),
          (t.textContent = e),
          t.setAttribute('role', 'listitem'),
          t.addEventListener('click', () => {
            (this.removeFollowupChips(), this.ask(normalizeFollowupPrompt(e) || e));
          }),
          n.appendChild(t));
      }),
      this.elements.messages?.appendChild(n),
      this.scrollToBottom());
  }
  removeFollowupChips() {
    this.elements.messages?.querySelectorAll('.chatbot-followup-chips').forEach(e => e.remove());
  }
  showThinkingIndicator() {
    this.hideTypingIndicator();
    const e = document.createElement('div');
    ((e.className = 'thinking-indicator'),
      (e.id = 'chatbot-typing-indicator'),
      (e.innerHTML =
        '\n            <div class="thinking-content">\n                <div class="thinking-brain">\n                    <i class="fas fa-brain"></i>\n                </div>\n                <div class="thinking-text">\n                    <span class="thinking-stage">Thinking</span>\n                    <span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span>\n                </div>\n            </div>\n        '),
      this.elements.messages?.appendChild(e),
      this.scrollToBottom());
  }
  updateThinkingStage(e) {
    const t = document.getElementById('chatbot-typing-indicator')?.querySelector('.thinking-stage'),
      s = document.getElementById('chatbot-typing-indicator')?.querySelector('.thinking-brain i');
    if (t) {
      const n = {
          thinking: { text: 'Thinking', icon: 'fas fa-brain' },
          generating: { text: 'Generating', icon: 'fas fa-wand-magic-sparkles' },
          streaming: { text: 'Streaming', icon: 'fas fa-bolt' },
        },
        i = n[e] || n.thinking;
      ((t.textContent = i.text), s && (s.className = i.icon));
    }
  }
  hideTypingIndicator() {
    const e = document.getElementById('chatbot-typing-indicator');
    e?.remove();
  }
  scrollToBottom() {
    this.elements.messages &&
      (this.elements.messages.scrollTop = this.elements.messages.scrollHeight);
  }
  handleVoiceInput() {
    if (this.recognition) {
      if (this.isListening) (this.recognition.stop(), (this.isListening = !1));
      else
        try {
          (this.recognition.start(), (this.isListening = !0));
        } catch (e) {
          (console.error('Voice recognition error:', e),
            this.addMessage(
              'Unable to start voice input. Please check microphone permissions.',
              'assistant'
            ));
        }
      this.updateVoiceButtonState();
    } else
      this.addMessage(
        'Voice input is not supported in your browser. Please try Chrome or Edge.',
        'assistant'
      );
  }
  ask(e) {
    e &&
      'string' == typeof e &&
      (this.isOpen || this.openWidget(),
      this.elements.input &&
        ((this.elements.input.value = e), this.autoResizeTextarea(this.elements.input)),
      setTimeout(
        () => {
          this.handleSendMessage();
        },
        this.isOpen ? 0 : 300
      ));
  }
}
'loading' === document.readyState
  ? document.addEventListener('DOMContentLoaded', () => {
      window.appleIntelligenceChatbot = new AppleIntelligenceChatbot();
    })
  : (window.appleIntelligenceChatbot = new AppleIntelligenceChatbot());
export default AppleIntelligenceChatbot;

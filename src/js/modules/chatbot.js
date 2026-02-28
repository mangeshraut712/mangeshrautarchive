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
    this.lastUserMessage = '';
    this.messageCount = 0;
    this.retryCount = 0;

    if (!this.elements.widget || !this.elements.toggle) {
      console.error('Chatbot elements not found');
      return;
    }

    // Wait for chat API to be available
    this.waitForChatAPI();
    this.initVoiceRecognition();
    this.bindEvents();
    this.addWelcomeMessage();
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

    console.log('✅ Chat API connected');
    this.updateStatusIndicator('online');
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

  initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = event => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (this.elements.input) {
          this.elements.input.value = transcript;
          this.autoResizeTextarea(this.elements.input);
        }

        const latestResult = event.results[event.results.length - 1];
        if (latestResult && latestResult.isFinal) {
          this.handleSendMessage();
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateVoiceButtonState();
      };

      this.recognition.onerror = event => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        this.updateVoiceButtonState();
      };
    }
  }

  updateVoiceButtonState() {
    if (this.elements.voiceBtn) {
      if (this.isListening) {
        this.elements.voiceBtn.classList.add('listening');
        this.elements.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
      } else {
        this.elements.voiceBtn.classList.remove('listening');
        this.elements.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      }
    }
  }

  initializeElements() {
    const elements = {
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

    // Create Shadow Div for smooth resizing
    if (elements.input && !this.shadowDiv) {
      this.shadowDiv = document.createElement('div');
      this.shadowDiv.style.position = 'absolute';
      this.shadowDiv.style.visibility = 'hidden';
      this.shadowDiv.style.height = 'auto';
      this.shadowDiv.style.width = elements.input.clientWidth + 'px';
      this.shadowDiv.style.whiteSpace = 'pre-wrap';
      this.shadowDiv.style.wordWrap = 'break-word';
      this.shadowDiv.style.overflow = 'hidden';

      const computed = window.getComputedStyle(elements.input);
      this.shadowDiv.style.fontFamily = computed.fontFamily;
      this.shadowDiv.style.fontSize = computed.fontSize;
      this.shadowDiv.style.lineHeight = computed.lineHeight;
      this.shadowDiv.style.padding = computed.padding;
      this.shadowDiv.style.boxSizing = computed.boxSizing;
      this.shadowDiv.style.border = computed.border;

      document.body.appendChild(this.shadowDiv);
    }

    return elements;
  }

  autoResizeTextarea(textarea) {
    if (!textarea || !this.shadowDiv) return;
    this.shadowDiv.style.width = textarea.clientWidth + 'px';
    this.shadowDiv.textContent = textarea.value + '\u200b';
    const maxHeight = 120;
    const newHeight = Math.min(this.shadowDiv.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(newHeight, 24)}px`;
  }

  bindEvents() {
    this.elements.toggle?.addEventListener('click', () => this.toggleWidget());
    this.elements.closeBtn?.addEventListener('click', () => this.closeWidget());
    this.elements.clearBtn?.addEventListener('click', () => this.clearChat());
    this.elements.privacyBtn?.addEventListener('click', () => {
      console.log('🛡️ Opening Privacy Dashboard');
      privacyDashboard.open();
    });

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
        !this.elements.widget.contains(e.target) &&
        !this.elements.toggle.contains(e.target)
      ) {
        this.closeWidget();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeWidget();
      }
    });
  }

  toggleWidget() {
    if (this.isOpen) {
      this.closeWidget();
    } else {
      this.openWidget();
    }
  }

  openWidget() {
    document.body.classList.add('chatbot-open');
    this.elements.widget?.classList.remove('hidden');
    this.elements.widget?.classList.add('visible');
    this.isOpen = true;

    setTimeout(() => {
      this.elements.input?.focus();
    }, 300);
  }

  closeWidget() {
    document.body.classList.remove('chatbot-open');
    this.elements.widget?.classList.remove('visible');
    this.elements.widget?.classList.add('hidden');
    this.isOpen = false;
    this.elements.toggle?.focus({ preventScroll: true });
  }

  clearChat() {
    if (this.elements.messages) {
      this.elements.messages.innerHTML = '';
    }
    if (this.chatAPI?.conversation) {
      this.chatAPI.conversation = [];
    }
    if (this.chatAPI?.history) {
      this.chatAPI.history = [];
    }
    this.lastUserMessage = '';
    this.messageCount = 0;
    this.addWelcomeMessage();
  }

  // ── Enhanced Welcome Message ──────────────────────

  addWelcomeMessage() {
    setTimeout(() => {
      if (this.elements.messages && this.elements.messages.children.length === 0) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className =
          'message assistant-message welcome-message welcome-message-simplified';
        welcomeDiv.innerHTML = `
                    <div class="message-content">
                        <div class="welcome-header">
                            <div class="welcome-brand">
                                <span class="welcome-name">AssistMe</span>
                                <span class="welcome-helper-text">Portfolio Guide</span>
                            </div>
                            <div class="welcome-status-badge">
                                <span class="chatbot-status-dot status-online"></span>
                                <span class="chatbot-status-text">Connected</span>
                            </div>
                        </div>
                        <div class="welcome-title">Welcome</div>
                        <div class="welcome-subtitle">Ask about projects, skills, experience, or contact details. Start with one quick option below.</div>
                        
                        <div class="welcome-capabilities">
                            <span class="capability-badge"><i class="fas fa-briefcase"></i> Portfolio</span>
                            <span class="capability-badge"><i class="fas fa-brain"></i> AI/ML</span>
                            <span class="capability-badge"><i class="fas fa-compass"></i> Navigation</span>
                        </div>

                        <div class="welcome-chips">
                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask('What are Mangesh\\'s top projects?')"><i class="fas fa-rocket"></i> Top Projects</button>
                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask('What AI and ML projects has Mangesh built?')"><i class="fas fa-brain"></i> AI/ML Work</button>
                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask('Tell me about Mangesh\\'s work experience')"><i class="fas fa-briefcase"></i> Experience</button>
                            <button type="button" class="welcome-action-chip" onclick="window.appleIntelligenceChatbot.ask('How can I contact Mangesh?')"><i class="fas fa-envelope"></i> Contact</button>
                        </div>
                    </div>
                `;
        this.elements.messages.appendChild(welcomeDiv);
      }
    }, 600);
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
    this.elements.messages?.appendChild(chipEl);
    this.scrollToBottom();

    // Remove after a few seconds
    setTimeout(() => chipEl.classList.add('fade-out'), 3000);
    setTimeout(() => chipEl.remove(), 3500);
  }

  // ── Message Sending ──────────────────────

  async handleSendMessage() {
    const text = this.elements.input?.value.trim();
    if (!text || this.isProcessing) return;

    this.isProcessing = true;
    this.lastUserMessage = text;
    this.retryCount = 0;
    this.removeFollowupChips();

    // Add user message
    this.addMessage(text, 'user');

    // Clear input
    if (this.elements.input) {
      this.elements.input.value = '';
      this.autoResizeTextarea(this.elements.input);
    }

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
      this.addErrorMessage("I'm having trouble connecting. Please try again in a moment.");
    } finally {
      this.isProcessing = false;
      this.messageCount++;
    }
  }

  // ── Streaming AI Response ──────────────────────

  async streamAIResponse(userMessage, startTime, isRetry = false) {
    this.hideTypingIndicator();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = '';

    messageDiv.appendChild(contentDiv);
    this.elements.messages?.appendChild(messageDiv);
    this.scrollToBottom();

    let fullText = '';
    let metadata = {};

    try {
      messageDiv.classList.add('streaming');

      // Update indicator to "Generating"
      this.updateThinkingStage('generating');

      const response = await this.chatAPI.ask(userMessage, {
        onChunk: chunk => {
          fullText += chunk;
          contentDiv.textContent = fullText + '▊';
          this.scrollToBottom();
        },
      });
      messageDiv.classList.remove('streaming');

      // Fallback: If streaming yielded no text, use the direct answer
      if (!fullText && response && (response.answer || response.content)) {
        fullText = response.answer || response.content;
      }

      // Auto-retry on empty response (1 silent retry)
      if (!fullText && !isRetry) {
        console.log('🔄 Empty response, auto-retrying...');
        messageDiv.remove();
        this.retryCount++;
        this.showThinkingIndicator();
        await new Promise(r => setTimeout(r, 500));
        return this.streamAIResponse(userMessage, startTime, true);
      }

      // Final fallback for completely empty responses (after retry)
      if (!fullText) {
        fullText =
          'I received an empty response. Let me try a different approach — please rephrase your question or try one of the suggestions below.';
        contentDiv.textContent = fullText;
        metadata.error = true;
      } else {
        // Render markdown
        const renderedHTML = this.renderMarkdown(fullText);
        contentDiv.innerHTML = renderedHTML;

        // Apply syntax highlighting
        if (window.Prism) {
          contentDiv.querySelectorAll('pre code').forEach(block => {
            window.Prism.highlightElement(block);
          });
        } else if (window.hljs) {
          contentDiv.querySelectorAll('pre code').forEach(block => {
            window.hljs.highlightElement(block);
          });
        }
      }

      // Extract metadata
      const runtime = Date.now() - startTime;
      const tokenEstimate = response?.metadata?.tokens || Math.ceil(fullText.length / 4);
      const runtimeSeconds = Math.max(runtime / 1000, 0.001);
      metadata = {
        source: response?.metadata?.source || response?.source || 'Neural API',
        model: response?.metadata?.model || response?.model || 'x-ai/grok-4.1-fast',
        category: response?.metadata?.category || 'General',
        runtime: runtime,
        tokens: tokenEstimate,
        tokensPerSecond: response?.metadata?.tokensPerSecond || tokenEstimate / runtimeSeconds,
        cost: response?.metadata?.cost,
        confidence: response?.metadata?.confidence,
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
    } catch (error) {
      console.error('Streaming error:', error);
      messageDiv.classList.remove('streaming');
      if (!fullText) {
        messageDiv.remove();
        this.addErrorMessage('The response was interrupted. Please try again.');
        return;
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
    modelBadge.innerHTML = `<i class="fas fa-sparkles"></i> ${this.escapeHtml(modelName)}`;
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

    detailsRow.innerHTML = detailChips
      .map(c => `<span class="meta-detail-chip">${c}</span>`)
      .join('');

    metaContainer.appendChild(detailsRow);
    messageDiv.appendChild(metaContainer);
  }

  // ── Markdown Rendering ──────────────────────

  renderMarkdown(text) {
    if (window.marked) {
      try {
        window.marked.setOptions({
          breaks: true,
          gfm: true,
          headerIds: false,
          mangle: false,
        });

        let html = window.marked.parse(text);

        if (window.DOMPurify) {
          html = window.DOMPurify.sanitize(html, {
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
          });
        }

        return html;
      } catch (e) {
        console.warn('Markdown parsing failed, using fallback:', e);
      }
    }
    return this.simpleMarkdownToHTML(text);
  }

  simpleMarkdownToHTML(text) {
    let html = text
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

    html = '<p>' + html + '</p>';
    html = html.replace(/(<li>.*?<\/li>)(\s*<li>)/g, '$1$2');
    html = html.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<br>\s*<\/p>/g, '');

    return html;
  }

  // ── Fallback Typing (local mode) ──────────────────────

  async simulateTyping(text, startTime) {
    this.hideTypingIndicator();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    messageDiv.appendChild(contentDiv);
    this.elements.messages?.appendChild(messageDiv);

    for (let i = 0; i < text.length; i++) {
      contentDiv.textContent = text.substring(0, i + 1) + '▊';
      this.scrollToBottom();
      await new Promise(r => setTimeout(r, 20));
    }

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
  }

  // ── Chip helpers ──────────────────────

  createChip(icon, text, type) {
    const chip = document.createElement('span');
    chip.className = `meta-chip meta-chip-${type}`;
    chip.innerHTML = `${icon} ${text}`;
    return chip;
  }

  createActionButton(iconClass, title, onClick) {
    const btn = document.createElement('button');
    btn.className = 'msg-action-btn';
    btn.title = title;
    btn.innerHTML = `<i class="fas ${iconClass}"></i>`;
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
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        button.innerHTML = '<i class="fas fa-volume-up"></i>';
        button.classList.remove('speaking');
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        button.innerHTML = '<i class="fas fa-stop"></i>';
        button.classList.add('speaking');

        utterance.onend = () => {
          button.innerHTML = '<i class="fas fa-volume-up"></i>';
          button.classList.remove('speaking');
        };

        window.speechSynthesis.speak(utterance);
      }
    }
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

  addMessage(text, role, _options = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    this.elements.messages?.appendChild(messageDiv);

    this.scrollToBottom();
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

    this.elements.messages?.appendChild(messageDiv);
    this.scrollToBottom();
  }

  // ── Follow-Up Suggestion Chips ─────────────────────────

  showFollowupChips(assistantText) {
    this.removeFollowupChips();

    const ctx = inferFollowupContext(assistantText);
    const chips = FOLLOWUP_CHIPS[ctx] || FOLLOWUP_CHIPS.default;

    const container = document.createElement('div');
    container.className = 'chatbot-followup-chips';
    container.setAttribute('role', 'list');
    container.setAttribute('aria-label', 'Follow-up suggestions');

    chips.forEach(label => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'followup-chip';
      btn.textContent = label;
      btn.setAttribute('role', 'listitem');
      btn.addEventListener('click', () => {
        this.removeFollowupChips();
        this.ask(normalizeFollowupPrompt(label) || label);
      });
      container.appendChild(btn);
    });

    this.elements.messages?.appendChild(container);
    this.scrollToBottom();
  }

  removeFollowupChips() {
    this.elements.messages?.querySelectorAll('.chatbot-followup-chips').forEach(el => el.remove());
  }

  // ── Enhanced Thinking Indicator ─────────────────────────

  showThinkingIndicator() {
    this.hideTypingIndicator();
    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator';
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
            </div>
        `;
    this.elements.messages?.appendChild(indicator);
    this.scrollToBottom();
  }

  updateThinkingStage(stage) {
    const stageEl = document
      .getElementById('chatbot-typing-indicator')
      ?.querySelector('.thinking-stage');
    const iconEl = document
      .getElementById('chatbot-typing-indicator')
      ?.querySelector('.thinking-brain i');
    if (stageEl) {
      const stages = {
        thinking: { text: 'Thinking', icon: 'fas fa-brain' },
        generating: { text: 'Generating', icon: 'fas fa-wand-magic-sparkles' },
        streaming: { text: 'Streaming', icon: 'fas fa-bolt' },
      };
      const s = stages[stage] || stages.thinking;
      stageEl.textContent = s.text;
      if (iconEl) iconEl.className = s.icon;
    }
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('chatbot-typing-indicator');
    indicator?.remove();
  }

  scrollToBottom() {
    if (this.elements.messages) {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
  }

  handleVoiceInput() {
    if (!this.recognition) {
      this.addMessage(
        'Voice input is not supported in your browser. Please try Chrome or Edge.',
        'assistant'
      );
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (error) {
        console.error('Voice recognition error:', error);
        this.addMessage(
          'Unable to start voice input. Please check microphone permissions.',
          'assistant'
        );
      }
    }
    this.updateVoiceButtonState();
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

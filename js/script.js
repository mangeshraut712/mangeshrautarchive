import { intelligentAssistant as chatAssistant } from './chat.js';
import { ui as uiConfig, features, chat as chatConfig, errorMessages } from './config.js';

import ExternalApiKeys from './modules/external-config.js';
import { initOverlayMenu, initOverlayNavigation, initSmoothScroll } from './modules/overlay.js';
import initContactForm from './modules/contact.js';
import initVoiceInput from './modules/voice.js';
import initFadeInAnimation from './modules/animations.js';
import renderProjects from './modules/projects.js';

if (features.enableMarkdownRendering) {
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight(code, language) {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(code, { language: validLanguage }).value;
        },
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false,
        smartypants: true
    });
}

class ChatUI {
    constructor() {
        this.elements = this._initializeElements();
        this.typingIndicator = null;
        this.messageQueue = [];
        this.isProcessing = false;
        this.maxMessages = uiConfig.maxMessages;
        this.suggestionsVisible = false;

        if (this.elements.widget) {
            const isOpen = !this.elements.widget.classList.contains('hidden');
            this.elements.widget.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        }

        if (this.elements.toggleButton && this.elements.widget) {
            this.elements.toggleButton.setAttribute('aria-controls', this.elements.widget.id);
            this.elements.toggleButton.setAttribute('aria-haspopup', 'dialog');
            this.elements.toggleButton.setAttribute('aria-expanded', this._isWidgetOpen().toString());
        }

        this._bindEvents();
        this._initializeFeatures();
        this._showWelcomeMessage();
    }

    _initializeElements() {
        const form = document.getElementById('chat-form') ||
                     document.getElementById('portfolio-chat-form');
        const input = document.getElementById('message-input') ||
                      document.getElementById('portfolio-chat-input');
        const messages = document.getElementById('chat-messages') ||
                         document.getElementById('portfolio-chat-messages');

        return {
            form,
            input,
            messages,
            clearButton: document.getElementById('clear-chat'),
            suggestions: null,
            status: null,
            widget: document.getElementById('portfolio-chat-widget'),
            toggleButton: document.getElementById('portfolio-chat-toggle'),
            closeButton: document.getElementById('portfolio-chat-close'),
            voiceButton: document.getElementById('portfolio-voice-input')
        };
    }

    _bindEvents() {
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this._handleUserInput();
            });
        }

        if (this.elements.input) {
            this.elements.input.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this._handleUserInput();
                }
            });

            this.elements.input.addEventListener('input', (event) => {
                this._handleTyping(event.target.value);
            });

            this.elements.input.addEventListener('focus', () => {
                this._updateSuggestions();
            });
        }

        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', () => {
                this.clearChat();
            });
        }

        document.addEventListener('click', (event) => {
            if (!this.suggestionsVisible) return;
            if (event.target.closest('.chat-suggestions')) return;
            if (event.target.closest('#message-input') || event.target.closest('#portfolio-chat-input')) return;
            this._hideSuggestions();
        });

        if (this.elements.toggleButton && this.elements.widget) {
            this.elements.toggleButton.addEventListener('click', () => {
                this._toggleWidget();
            });
        }

        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', () => {
                this._closeWidget();
            });
        }

        if (this.elements.widget) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this._isWidgetOpen()) {
                    this._closeWidget();
                }
            });

            document.addEventListener('click', (event) => {
                if (!this._isWidgetOpen()) return;
                if (event.target.closest('#portfolio-chat-widget') ||
                    event.target.closest('#portfolio-chat-toggle')) {
                    return;
                }
                this._closeWidget();
            });
        }
    }

    _initializeFeatures() {
        if (features.enableTypingIndicator) {
            this.typingIndicator = this._createTypingIndicator();
        }

        this._createStatusIndicator();
        this._createSuggestionsElement();
    }

    async _handleUserInput() {
        if (this.isProcessing) return;

        if (!chatAssistant.isReady()) {
            try {
                await chatAssistant.initialize();
            } catch (initError) {
                console.warn('Assistant initialization failed, continuing with fallback services:', initError);
            }
        }

        const text = this.elements.input?.value.trim();
        if (!text) return;

        try {
            this.isProcessing = true;
            this.elements.input.value = '';
            this._hideSuggestions();

            const userMessage = this._createMessageElement(text, 'user', Date.now());
            this._addMessageElement(userMessage);

            if (features.enableTypingIndicator) {
                this._showTypingIndicator();
            }

            const response = await chatAssistant.ask(text);

            if (features.enableTypingIndicator) {
                this._hideTypingIndicator();
            }

            const { content, metadata } = this._formatAssistantResponse(response);
            const assistantMessage = this._createMessageElement(content, 'assistant', Date.now(), metadata);
            this._addMessageElement(assistantMessage);

            setTimeout(() => this._updateSuggestions(), 400);
            this._scrollToBottom();
        } catch (error) {
            console.error('Chat UI Error:', error);
            this._hideTypingIndicator();
            const errorMessage = this._createMessageElement(
                errorMessages.genericError,
                'assistant',
                Date.now(),
                { error: true }
            );
            this._addMessageElement(errorMessage);
        } finally {
            this.isProcessing = false;
        }
    }

    _handleTyping(value) {
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this._updateSuggestions(value);
        }, 250);
    }

    _createMessageElement(content, role, timestamp, metadata = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${role}-message message`;
        messageDiv.dataset.timestamp = timestamp;
        messageDiv.dataset.role = role;

        if (metadata.error) {
            messageDiv.classList.add('error-message');
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (typeof content === 'string') {
            contentDiv.textContent = content;
        } else if (content?.html && features.enableMarkdownRendering) {
            contentDiv.innerHTML = DOMPurify.sanitize(content.html);
            contentDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            contentDiv.textContent = content?.text || content;
        }

        messageDiv.appendChild(contentDiv);

        const metaParts = [];

        if (metadata.type) {
            metaParts.push(`<span class="query-type">${metadata.type}</span>`);
        }

        if (metadata.source) {
            metaParts.push(`<span class="response-source">${metadata.source}</span>`);
        }

        if (metadata.confidence !== undefined) {
            const confidenceValue = typeof metadata.confidence === 'number'
                ? `${Math.round(metadata.confidence * 100)}%`
                : metadata.confidence;
            metaParts.push(`<span class="response-confidence">${confidenceValue}</span>`);
        }

        if (metadata.processingTime !== undefined) {
            const processingValue = typeof metadata.processingTime === 'number'
                ? `${metadata.processingTime}ms`
                : metadata.processingTime;
            metaParts.push(`<span class="processing-time">${processingValue}</span>`);
        }

        if (Array.isArray(metadata.providers) && metadata.providers.length) {
            const providerText = metadata.providers
                .map((entry) => this._formatProviderLabel(entry))
                .filter(Boolean)
                .join(', ');
            if (providerText) {
                metaParts.push(`<span class="providers-tried">Tried: ${providerText}</span>`);
            }
        }

        if (metaParts.length) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-metadata';
            metaDiv.innerHTML = metaParts.join(' ');
            messageDiv.appendChild(metaDiv);
        }

        return messageDiv;
    }

    _formatAssistantResponse(response) {
        if (!response) {
            return { content: '', metadata: {} };
        }

        if (typeof response === 'string') {
            return { content: response, metadata: {} };
        }

        const metadata = {};

        if (response.type) metadata.type = response.type;
        if (response.source) metadata.source = response.source;
        if (typeof response.confidence === 'number') metadata.confidence = response.confidence;
        if (typeof response.processingTime === 'number') {
            metadata.processingTime = Math.max(0, Math.round(response.processingTime));
        } else if (response.processingTime) {
            metadata.processingTime = response.processingTime;
        }
        if (Array.isArray(response.providers)) metadata.providers = response.providers;

        if (response.error) metadata.error = true;

        if (response.html && features.enableMarkdownRendering) {
            return { content: { html: response.html }, metadata };
        }

        const answer = response.answer ?? response.text ?? '';
        return { content: answer, metadata };
    }

    _formatProviderLabel(entry) {
        if (!entry) return '';

        let name;
        let confidence;

        if (typeof entry === 'string') {
            name = entry;
        } else {
            name = this._prettifyProviderName(entry.provider || entry.name || '');
            confidence = entry.confidence;
        }

        if (!name) return '';

        if (typeof confidence === 'number') {
            return `${name} (${Math.round(confidence * 100)}%)`;
        }

        return name;
    }

    _prettifyProviderName(provider) {
        const map = {
            grok: 'Grok xAI',
            anthropic: 'Claude',
            claude: 'Claude',
            perplexity: 'Perplexity',
            gemini: 'Gemini',
            gemini_firebase: 'Gemini',
            huggingface: 'UserLM-8b'
        };

        return map[provider] || provider || '';
    }

    _createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator hidden';
        indicator.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        return indicator;
    }

    _showTypingIndicator() {
        if (!this.typingIndicator || !this.elements.messages) return;
        this.elements.messages.appendChild(this.typingIndicator);
        this.typingIndicator.classList.remove('hidden');
        this._scrollToBottom();
    }

    _hideTypingIndicator() {
        if (!this.typingIndicator) return;
        this.typingIndicator.classList.add('hidden');
        if (this.typingIndicator.parentNode) {
            this.typingIndicator.parentNode.removeChild(this.typingIndicator);
        }
    }

    _createSuggestionsElement() {
        this.elements.suggestions = document.createElement('div');
        this.elements.suggestions.className = 'chat-suggestions hidden';
        this.elements.suggestions.id = 'chat-suggestions';

        if (this.elements.messages && this.elements.messages.parentNode) {
            this.elements.messages.parentNode.insertBefore(
                this.elements.suggestions,
                this.elements.messages.nextSibling
            );
        }
    }

    _updateSuggestions(input = '') {
        if (!features.enableHistory || !this.elements.suggestions) return;

        const suggestions = input.length > 2
            ? this._getContextualSuggestions(input)
            : chatAssistant.getSuggestions();

        if (!suggestions.length) {
            this._hideSuggestions();
            return;
        }

        this.elements.suggestions.innerHTML = '';

        suggestions.forEach((suggestion) => {
            const button = document.createElement('button');
            button.className = 'suggestion-button';
            button.type = 'button';
            button.textContent = suggestion;
            button.addEventListener('click', () => {
                if (this.elements.input) {
                    this.elements.input.value = suggestion;
                    this.elements.input.focus();
                    this._hideSuggestions();
                }
            });
            this.elements.suggestions.appendChild(button);
        });

        this._showSuggestions();
    }

    _getContextualSuggestions(input) {
        const lower = input.toLowerCase();
        const suggestions = [];

        if (lower.startsWith('tell me about')) {
            suggestions.push('Tell me about your education');
            suggestions.push('Tell me about your skills');
            suggestions.push('Tell me about your projects');
        } else if (lower.startsWith('what')) {
            suggestions.push('What are your main projects?');
            suggestions.push('What technologies do you use?');
        } else if (lower.includes('calculate') || lower.includes('math')) {
            suggestions.push('Calculate 25 * 15');
            suggestions.push('Convert 100 celsius to fahrenheit');
        }

        return suggestions;
    }

    _showSuggestions() {
        if (!this.elements.suggestions) return;
        this.elements.suggestions.classList.remove('hidden');
        this.suggestionsVisible = true;
    }

    _hideSuggestions() {
        if (!this.elements.suggestions) return;
        this.elements.suggestions.classList.add('hidden');
        this.suggestionsVisible = false;
    }

    _createStatusIndicator() {
        this.elements.status = document.createElement('div');
        this.elements.status.className = 'chat-status';
        this.elements.status.id = 'chat-status';
        this.elements.status.textContent = 'Ready';

        if (this.elements.messages && this.elements.messages.parentNode) {
            this.elements.messages.parentNode.insertBefore(
                this.elements.status,
                this.elements.messages
            );
        }
    }

    _showWelcomeMessage() {
        const welcomeMessage = this._createMessageElement(
            chatConfig.defaultGreeting,
            'assistant',
            Date.now(),
            { welcome: true }
        );
        this._addMessageElement(welcomeMessage);
        this._updateSuggestions();
    }

    _addMessageElement(element) {
        if (!this.elements.messages || !element) return;

        this.elements.messages.appendChild(element);

        while (this.elements.messages.children.length > this.maxMessages) {
            this.elements.messages.removeChild(this.elements.messages.firstChild);
        }

        this._scrollToBottom();
    }

    _scrollToBottom() {
        if (!this.elements.messages) return;
        setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 80);
    }

    _toggleWidget() {
        console.log('Toggling widget...');
        console.log('Widget classList before toggle:', this.elements.widget?.classList);
        if (!this.elements.widget) return;
        if (this._isWidgetOpen()) {
            this._closeWidget();
        } else {
            this._openWidget();
        }
    }

    _openWidget() {
        if (!this.elements.widget) return;
        this.elements.widget.classList.remove('hidden');
        this.elements.widget.classList.add('visible');
        this.elements.widget.setAttribute('aria-hidden', 'false');
        if (this.elements.toggleButton) {
            this.elements.toggleButton.setAttribute('aria-expanded', 'true');
            this.elements.toggleButton.classList.add('active');
        }
        setTimeout(() => this.elements.input?.focus(), 150);
    }

    _closeWidget() {
        console.log('Closing widget...');
        if (!this.elements.widget) return;
        this.elements.widget.classList.add('hidden');
        this.elements.widget.setAttribute('aria-hidden', 'true');
        if (this.elements.toggleButton) {
            this.elements.toggleButton.setAttribute('aria-expanded', 'false');
            this.elements.toggleButton.classList.remove('active');
            this.elements.toggleButton.focus();
        }
    }

    _isWidgetOpen() {
        return !!(this.elements.widget && !this.elements.widget.classList.contains('hidden'));
    }

    clearChat() {
        if (this.elements.messages) {
            while (this.elements.messages.firstChild) {
                this.elements.messages.removeChild(this.elements.messages.firstChild);
            }
        }

        chatAssistant.clearHistory();
        this._showWelcomeMessage();
    }

    sendMessage(message) {
        if (!this.elements.input) return;
        this.elements.input.value = message;
        this._handleUserInput();
    }

    notifyAssistant(message) {
        if (!message) return;
        const assistantMessage = this._createMessageElement(message, 'assistant', Date.now());
        this._addMessageElement(assistantMessage);
    }

    getStatus() {
        return {
            isProcessing: this.isProcessing,
            messageCount: this.elements.messages?.children.length || 0,
            assistantStatus: chatAssistant.getStatus()
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chatAnchor = document.getElementById('chat-form') ||
                       document.getElementById('portfolio-chat-form') ||
                       document.getElementById('portfolio-chat-widget') ||
                       document.getElementById('portfolio-chat-messages');

    if (chatAnchor) {
        try {
            window.chatUI = new ChatUI();
            initVoiceInput(window.chatUI);
        } catch (error) {
            console.error('Failed to initialize full chat experience:', error);
        }
    }

    // Initialize core functionality
    initOverlayMenu();
    initOverlayNavigation();
    initSmoothScroll();
    initFadeInAnimation(undefined, {
        threshold: 0.2,
        rootMargin: '0px 0px -5% 0px'
    });
    renderProjects();

    try {
        initContactForm();
    } catch (error) {
        console.error('Failed to initialize contact form:', error);
    }

    // Configure global settings
    window.AssistMeConfig = Object.freeze({
        externalApis: ExternalApiKeys
    });

    // Animations and effects
    setTimeout(() => {
        const typewriter = document.querySelector('.typewriter');
        if (typewriter) {
            typewriter.style.borderRight = 'none';
        }
    }, 6000);
});

export { ChatUI, renderProjects as loadProjectsData };
export default ChatUI;


import { intelligentAssistant as chatAssistant } from './chat.js';
import { ui as uiConfig, features, chat as chatConfig, errorMessages } from './config.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
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
        if (this.isProcessing || !chatAssistant.isReady()) return;

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

            const assistantMessage = this._createMessageElement(response, 'assistant', Date.now());
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

        if (metadata.type || metadata.processingTime) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-metadata';

            if (metadata.type) {
                metaDiv.innerHTML += `<span class="query-type">${metadata.type}</span>`;
            }

            if (metadata.processingTime) {
                metaDiv.innerHTML += `<span class="processing-time">${metadata.processingTime}ms</span>`;
            }

            messageDiv.appendChild(metaDiv);
        }

        return messageDiv;
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
        this.elements.widget.setAttribute('aria-hidden', 'false');
        if (this.elements.toggleButton) {
            this.elements.toggleButton.setAttribute('aria-expanded', 'true');
            this.elements.toggleButton.classList.add('active');
        }
        setTimeout(() => this.elements.input?.focus(), 150);
    }

    _closeWidget() {
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
    initFadeInAnimation();
    renderProjects();

    // Enhanced contact form initialization with Firebase readiness check
    function initializeContactFormWithFirebase() {
        // Check if Firebase is ready
        function checkFirebaseReady() {
            return typeof firebase !== 'undefined' &&
                   firebase.apps &&
                   firebase.apps.length > 0 &&
                   firebase.firestore;
        }

        // If Firebase is ready, init contact form
        if (checkFirebaseReady()) {
            console.log('Firebase ready, initializing contact form...');
            initContactForm();
        } else {
            // Wait for Firebase to be ready, with retry
            let retries = 0;
            const maxRetries = 10;
            const retryInterval = 500; // ms

            const waitForFirebase = setInterval(() => {
                retries++;

                if (checkFirebaseReady()) {
                    console.log('Firebase ready after retry, initializing contact form...');
                    clearInterval(waitForFirebase);
                    initContactForm();
                } else if (retries >= maxRetries) {
                    console.warn('Firebase not ready after maximum retries, initializing contact form in fallback mode');
                    clearInterval(waitForFirebase);

                    // Still initialize the form, it will handle Firebase errors gracefully
                    initContactForm();

                    // Show user-friendly message about potential offline mode
                    const contactSection = document.getElementById('contact');
                    if (contactSection && !document.querySelector('.firebase-offline-notice')) {
                        const notice = document.createElement('div');
                        notice.className = 'firebase-offline-notice alert alert-warning';
                        notice.style.cssText = `
                            background-color: #fef3c7;
                            color: #d97706;
                            padding: 12px;
                            border-radius: 8px;
                            margin-bottom: 16px;
                            font-size: 14px;
                            border: 1px solid #fcd34d;
                        `;
                        notice.innerHTML = `
                            <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            Contact form is operating in offline mode. Messages may not be saved. Please check back later.
                        `;

                        const contactForm = document.getElementById('contact-form');
                        if (contactForm) {
                            contactForm.insertBefore(notice, contactForm.firstChild);
                        }
                    }
                }
            }, retryInterval);
        }
    }

    // Initialize contact form
    initializeContactFormWithFirebase();

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

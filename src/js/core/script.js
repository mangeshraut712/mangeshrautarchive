import { intelligentAssistant as chatAssistant } from './chat.js';
import { ui as uiConfig, features, chat as chatConfig, errorMessages } from './config.js';
import { ModernInputHandler } from './modern-input.js';

import ExternalApiKeys from '../modules/external-config.js';
import { initOverlayMenu, initOverlayNavigation, initSmoothScroll } from '../modules/overlay.js';
import initContactForm from '../modules/contact.js';
import { initializeVercelAnalytics } from '../modules/vercel-analytics.js';




const markdownLib = (typeof window !== 'undefined' && window.marked)
    ? window.marked
    : (typeof marked !== 'undefined' ? marked : null);

// Prefer Prism, fallback to hljs
const syntaxHighlighter = (typeof window !== 'undefined' && window.Prism)
    ? window.Prism
    : ((typeof window !== 'undefined' && window.hljs) ? window.hljs : null);

const htmlSanitizer = (typeof window !== 'undefined' && window.DOMPurify)
    ? window.DOMPurify
    : (typeof DOMPurify !== 'undefined' ? DOMPurify : null);

if (features.enableMarkdownRendering && markdownLib) {
    markdownLib.setOptions({
        renderer: new markdownLib.Renderer(),
        highlight(code, language) {
            if (window.Prism) {
                // Prism handling
                const lang = window.Prism.languages[language] ? language : 'javascript';
                return window.Prism.highlight(code, window.Prism.languages[lang], lang);
            } else if (window.hljs) {
                // HLJS fallback
                const validLanguage = window.hljs.getLanguage(language) ? language : 'plaintext';
                return window.hljs.highlight(code, { language: validLanguage }).value;
            }
            return code;
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
        this.history = [];

        // Voice integration properties (S2R-Inspired)
        this.voiceOutputEnabled = false; // Default to voice disabled
        this.voiceMenuVisible = false;
        this.voiceHoldTimer = null;
        this.voiceHoldTriggered = false;

        if (this.elements.widget) {
            const isOpen = !this.elements.widget.classList.contains('hidden');
            this.elements.widget.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        }

        if (this.elements.toggleButton && this.elements.widget) {
            this.elements.toggleButton.setAttribute('aria-controls', this.elements.widget.id);
            this.elements.toggleButton.setAttribute('aria-haspopup', 'dialog');
            this.elements.toggleButton.setAttribute('aria-expanded', this._isWidgetOpen().toString());
        }

        // Initialize modern input handler (2026 tech)
        if (this.elements.input) {
            this.modernInput = new ModernInputHandler(
                this.elements.input,
                () => this._handleUserInput()
            );
        }

        this._bindEvents();
        this._initializeFeatures();
        // this._showWelcomeMessage(); // Disabled to prevent duplicate messages
    }

    _initializeElements() {
        // Updated to ignore 'chatbot-*' IDs which are now handled by chatbot.js
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
            voiceButton: document.getElementById('portfolio-voice-input'),
            voiceMenu: document.getElementById('voice-control-menu'),
            voiceMenuClose: document.getElementById('voice-mode-close'),
            voiceOutputToggle: document.getElementById('voice-output-toggle'),
            voiceContinuousToggle: document.getElementById('continuous-mode-toggle')
        };
    }

    _bindEvents() {
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this._handleUserInput();
            });
        }

        // Modern input handler takes care of keyboard events
        // No need for manual keydown/input listeners anymore

        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', () => {
                this.clearChat();
            });
        }

        document.addEventListener('click', (event) => {
            if (!this.suggestionsVisible) return;
            if (event.target.closest('.chat-suggestions')) return;
            if (event.target.closest('#message-input') ||
                event.target.closest('#portfolio-chat-input') ||
                event.target.closest('#chatbot-input')) return;
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

        if (this.elements.voiceButton) {
            const voiceButton = this.elements.voiceButton;
            voiceButton.addEventListener('pointerdown', (event) => this._handleVoiceButtonPointerDown(event));
            voiceButton.addEventListener('pointerup', (event) => this._handleVoiceButtonPointerUp(event));
            voiceButton.addEventListener('pointerleave', () => this._cancelVoiceButtonHold());
            voiceButton.addEventListener('pointercancel', () => this._cancelVoiceButtonHold());
            voiceButton.addEventListener('keydown', (event) => this._handleVoiceButtonKey(event));
        }

        if (this.elements.voiceMenuClose) {
            this.elements.voiceMenuClose.addEventListener('click', (event) => {
                event.preventDefault();
                this.hideVoiceMenu();
            });
        }

        if (this.elements.voiceOutputToggle) {
            this.elements.voiceOutputToggle.addEventListener('change', (event) => {
                const enabled = Boolean(event.target.checked);
                document.dispatchEvent(new CustomEvent('voice-output-toggle', {
                    detail: { enabled }
                }));
            });
        }

        if (this.elements.voiceContinuousToggle) {
            this.elements.voiceContinuousToggle.addEventListener('change', (event) => {
                const enabled = Boolean(event.target.checked);
                document.dispatchEvent(new CustomEvent('voice-continuous-toggle', {
                    detail: { enabled }
                }));
            });
        }

        // Mute button handler
        const muteBtn = document.getElementById('mute-voice-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                if (window.voiceManager) {
                    window.voiceManager.stopSpeaking();
                    this.setVoiceOutputEnabledState(false);
                    this.addMessage('🔇 Voice output muted', 'system', { skipSpeech: true });
                    this.hideVoiceMenu();
                }
            });
        }

        // Stop voice button handler
        const stopBtn = document.getElementById('stop-voice-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                if (window.voiceManager) {
                    window.voiceManager.stopVoiceInput();
                    window.voiceManager.stopSpeaking();
                    this.addMessage('⏹️ Voice mode stopped', 'system', { skipSpeech: true });
                    this.hideVoiceMenu();
                }
            });
        }

        document.addEventListener('click', (event) => this._handleDocumentClick(event));

        if (this.elements.widget) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this._isWidgetOpen()) {
                    this._closeWidget();
                }
            });

            document.addEventListener('click', (event) => {
                if (!this._isWidgetOpen()) return;
                if (event.target.closest('#portfolio-chat-widget') ||
                    event.target.closest('#chatbot-widget') ||
                    event.target.closest('#portfolio-chat-toggle') ||
                    event.target.closest('#chatbot-toggle')) {
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
        this.setVoiceOutputEnabledState(this.voiceOutputEnabled);
    }

    async _handleUserInput() {
        // Legacy handler disabled
    }

    async sendMessage(text, context = {}) {
        /* Legacy logic removed
        if (this.isProcessing) return;

        if (!chatAssistant.isReady()) {
            try {
                await chatAssistant.initialize();
            } catch (initError) {
                console.warn('Assistant initialization failed, continuing with fallback services:', initError);
            }
        }

        if (!text) return;

        try {
            this.isProcessing = true;
            this.lastUserMessage = text; // Store for retry
            if (this.elements.input) this.elements.input.value = '';
            this._hideSuggestions();

            const userMessage = this._createMessageElement(text, 'user', Date.now());
            this._addMessageElement(userMessage);

            if (features.enableTypingIndicator) {
                this._showTypingIndicator();
            }

            let assistantMessageElement = null;
            let currentContent = '';

            // Ultra-fast rendering with minimal DOM manipulation
            let rafId = null;
            const streamStartTime = Date.now();

            const response = await chatAssistant.ask(text, {
                context,
                onChunk: (chunk) => {
                    // Hide typing indicator on first chunk
                    if (features.enableTypingIndicator && !assistantMessageElement) {
                        this._hideTypingIndicator();
                    }

                    // Create message element once
                    if (!assistantMessageElement) {
                        assistantMessageElement = this._createMessageElement('', 'assistant', Date.now(), {}, true);
                        this._addMessageElement(assistantMessageElement);
                    }

                    // Accumulate content
                    currentContent += chunk;

                    // Cancel previous frame if still pending
                    if (rafId) cancelAnimationFrame(rafId);

                    // Ultra-fast rendering - single RAF per chunk
                    rafId = requestAnimationFrame(() => {
                        const contentDiv = assistantMessageElement.querySelector('.message-content');
                        if (contentDiv) {
                            // Direct text update - fastest possible
                            contentDiv.textContent = currentContent + '▊';

                            // Efficient scroll - only when needed
                            if (this.elements.messages.scrollHeight - this.elements.messages.scrollTop < this.elements.messages.clientHeight + 100) {
                                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                            }
                        }
                        rafId = null;
                    });
                }
            });

            if (features.enableTypingIndicator) {
                this._hideTypingIndicator();
            }

            // Final update with full markdown rendering and metadata
            const { content, metadata } = this._formatAssistantResponse(response);

            if (assistantMessageElement) {
                // Update existing element - remove typing cursor first
                const contentDiv = assistantMessageElement.querySelector('.message-content');
                if (contentDiv) {
                    // Remove typing cursor before final render
                    contentDiv.textContent = currentContent;

                    // Then apply markdown/HTML if available
                    if (content?.html && features.enableMarkdownRendering) {
                        const safeHtml = htmlSanitizer ? htmlSanitizer.sanitize(content.html) : content.html;
                        contentDiv.innerHTML = safeHtml;
                        if (syntaxHighlighter?.highlightElement) {
                            contentDiv.querySelectorAll('pre code').forEach((block) => {
                                syntaxHighlighter.highlightElement(block);
                            });
                        }
                    } else {
                        contentDiv.textContent = content?.text || currentContent;
                    }
                }

                // Add complete metadata after streaming (matching comprehensive format)
                const metaChips = [];
                const totalChars = currentContent?.length || 0;

                // Model ID/Version
                if (metadata.model) {
                    metaChips.push(this._createMetaChip('model-info', `🤖 ${metadata.model}`));
                }

                // Category
                if (metadata.category) {
                    metaChips.push(this._createMetaChip('category-info', `📁 ${metadata.category}`));
                }

                // Source
                if (metadata.source) {
                    metaChips.push(this._createMetaChip('response-source', `🔌 ${metadata.source}`));
                }

                // Runtime/Latency
                if (metadata.processingTime || metadata.runtime) {
                    const time = this._formatProcessingTime(metadata.processingTime || metadata.runtime);
                    if (time) {
                        metaChips.push(this._createMetaChip('processing-time', `⏱️ ${time}`));
                    }
                }

                // Token Usage
                if (metadata.tokens !== undefined) {
                    metaChips.push(this._createMetaChip('token-usage', `🎯 ${metadata.tokens} tokens`));
                } else if (totalChars > 0) {
                    const estimatedTokens = Math.ceil(totalChars / 4);
                    metaChips.push(this._createMetaChip('token-usage', `🎯 ${estimatedTokens} tokens`));
                }

                // Tokens/Second
                if (metadata.tokensPerSecond !== undefined) {
                    const tps = Math.round(metadata.tokensPerSecond * 10) / 10;
                    metaChips.push(this._createMetaChip('token-speed', `⚡ ${tps} tok/s`));
                } else if (totalChars > 0 && streamStartTime) {
                    const totalSeconds = (Date.now() - streamStartTime) / 1000;
                    const estimatedTokens = Math.ceil(totalChars / 4);
                    const tps = Math.round((estimatedTokens / totalSeconds) * 10) / 10;
                    metaChips.push(this._createMetaChip('token-speed', `⚡ ${tps} tok/s`));
                }

                // Token Cost
                if (metadata.cost !== undefined) {
                    const costStr = typeof metadata.cost === 'number'
                        ? `$${metadata.cost.toFixed(4)}`
                        : metadata.cost;
                    metaChips.push(this._createMetaChip('token-cost', `💰 ${costStr}`));
                }

                // Character Count
                if (currentContent) {
                    const charCount = currentContent.length;
                    metaChips.push(this._createMetaChip('char-count', `📝 ${charCount} chars`));
                }

                // Confidence
                if (metadata.confidence) {
                    const confidencePercent = Math.round(metadata.confidence * 100);
                    metaChips.push(this._createMetaChip('response-confidence', `✓ ${confidencePercent}%`));
                }

                // Safety Score
                if (metadata.safetyScore !== undefined) {
                    const safetyPercent = Math.round(metadata.safetyScore * 100);
                    const safetyIcon = safetyPercent >= 90 ? '🛡️' : safetyPercent >= 70 ? '⚠️' : '🚫';
                    metaChips.push(this._createMetaChip('safety-score', `${safetyIcon} ${safetyPercent}% safe`));
                }

                // Timestamp
                const timestampStr = new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                metaChips.push(this._createMetaChip('timestamp', `🕐 ${timestampStr}`));

                // Providers (only if different from source)
                if (Array.isArray(metadata.providers) && metadata.providers.length) {
                    const providerText = this._formatProviders(metadata.providers);
                    // Check if provider text is redundant (e.g. source contains provider name)
                    const sourceLower = (metadata.source || '').toLowerCase();
                    const providersLower = metadata.providers.map(p => p.toLowerCase());
                    const isRedundant = providersLower.some(p => sourceLower.includes(p));

                    if (providerText && !isRedundant) {
                        metaChips.push(this._createMetaChip('providers-tried', providerText));
                    }
                }

                // Add final metadata after streaming completes
                if (metaChips.length) {
                    let metaDiv = assistantMessageElement.querySelector('.message-metadata');
                    if (!metaDiv) {
                        metaDiv = document.createElement('div');
                        metaDiv.className = 'message-metadata';
                        assistantMessageElement.appendChild(metaDiv);
                    } else {
                        // Clear existing metadata to prevent duplicates
                        metaDiv.innerHTML = '';
                    }
                    metaChips.forEach(chip => metaDiv.appendChild(chip));

                    // Add action buttons
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'message-actions';

                    // Copy Button
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'msg-action-btn';
                    copyBtn.title = 'Copy';
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    copyBtn.onclick = (e) => {
                        e.stopPropagation();
                        this._copyMessageText(contentDiv.textContent, copyBtn);
                    };
                    actionsDiv.appendChild(copyBtn);

                    // Speak Button
                    const speakBtn = document.createElement('button');
                    speakBtn.className = 'msg-action-btn';
                    speakBtn.title = 'Read Aloud';
                    speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                    speakBtn.onclick = (e) => {
                        e.stopPropagation();
                        this._speakMessage(contentDiv.textContent, speakBtn);
                    };
                    actionsDiv.appendChild(speakBtn);

                    metaDiv.appendChild(actionsDiv);
                }
            } else {
                // Fallback if no streaming happened (e.g. local fallback)
                const assistantMessage = this._createMessageElement(content, 'assistant', Date.now(), metadata);
                this._addMessageElement(assistantMessage);
            }

            setTimeout(() => this._updateSuggestions(), 400);
            this._scrollToBottom();

            // Text-to-Speech (Voice Output)
            if (this.voiceOutputEnabled && 'speechSynthesis' in window) {
                const textToSpeak = typeof content === 'string' ? content : (content.text || currentContent);
                // Strip markdown/HTML for speech
                const cleanText = textToSpeak.replace(/[*#`]/g, '').replace(/<[^>]*>/g, '');
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }

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
        */
    }

    _handleTyping(value) {
        const trimmed = (value || '').trim();
        if (trimmed.length < 2) {
            return; // Skip suggestion work for tiny/empty input
        }
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this._updateSuggestions(trimmed);
        }, 350); // Slightly longer debounce for smoother typing
    }

    _createMessageElement(content, role, timestamp, metadata = {}, isStreaming = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${role}-message message`;
        messageDiv.dataset.timestamp = timestamp;
        messageDiv.dataset.role = role;

        // Add unique ID for ChatbotUpgrade features
        const uniqueId = `msg-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        messageDiv.id = uniqueId;

        if (metadata.error) {
            messageDiv.classList.add('error-message');
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // CRITICAL FIX: Proper text rendering with spacing
        if (typeof content === 'string') {
            // Normalize text: preserve spaces and line breaks
            const normalizedText = content
                .replace(/\r\n/g, '\n') // Normalize line endings
                .replace(/\r/g, '\n')   // Handle old Mac line endings
                .trim();                // Remove leading/trailing whitespace

            contentDiv.textContent = normalizedText;

            // Force proper text layout
            contentDiv.style.whiteSpace = 'pre-wrap';
            contentDiv.style.wordWrap = 'break-word';
            contentDiv.style.overflowWrap = 'break-word';
        } else if (content?.html && features.enableMarkdownRendering) {
            const safeHtml = htmlSanitizer
                ? htmlSanitizer.sanitize(content.html)
                : content.html;
            contentDiv.innerHTML = safeHtml;

            // Highlight code blocks after insertion
            if (window.Prism) {
                // Use requestAnimationFrame for smooth rendering
                requestAnimationFrame(() => {
                    contentDiv.querySelectorAll('pre code').forEach((block) => {
                        window.Prism.highlightElement(block);
                    });
                });
            } else if (window.hljs) {
                requestAnimationFrame(() => {
                    contentDiv.querySelectorAll('pre code').forEach((block) => {
                        window.hljs.highlightElement(block);
                    });
                });
            }
        } else {
            const textContent = content?.text || content;
            const normalizedText = String(textContent)
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .trim();

            contentDiv.textContent = normalizedText;
            contentDiv.style.whiteSpace = 'pre-wrap';
            contentDiv.style.wordWrap = 'break-word';
            contentDiv.style.overflowWrap = 'break-word';
        }

        messageDiv.appendChild(contentDiv);

        // Initialize metadata chips array
        const metaChips = [];

        // === PRIMARY METADATA ===

        // Model ID/Version
        if (metadata.model) {
            metaChips.push(this._createMetaChip('model-info', `🤖 ${metadata.model}`));
        }

        // Category
        if (metadata.category) {
            metaChips.push(this._createMetaChip('category-info', `📁 ${metadata.category}`));
        }

        // Source
        if (metadata.source) {
            metaChips.push(this._createMetaChip('response-source', `🔌 ${metadata.source}`));
        }

        // === PERFORMANCE METRICS ===

        // Runtime/Latency
        if (metadata.processingTime || metadata.runtime) {
            const time = this._formatProcessingTime(metadata.processingTime || metadata.runtime);
            if (time) {
                metaChips.push(this._createMetaChip('processing-time', `⏱️ ${time}`));
            }
        }

        // === TOKEN METRICS ===

        // Token Usage
        // Token Usage (Real value from API)
        if (metadata.tokens !== undefined && metadata.tokens > 0) {
            metaChips.push(this._createMetaChip('token-usage', `🎯 ${metadata.tokens} tokens`));
        }

        // Token Cost (if available from API)
        if (metadata.cost !== undefined) {
            const costStr = typeof metadata.cost === 'number'
                ? `$${metadata.cost.toFixed(4)}`
                : metadata.cost;
            metaChips.push(this._createMetaChip('token-cost', `💰 ${costStr}`));
        }

        // === CHARACTER COUNT ===

        // Character count
        if (content?.text || content) {
            const textContent = content?.text || content;
            const charCount = typeof textContent === 'string' ? textContent.length : 0;
            if (charCount > 0) {
                metaChips.push(this._createMetaChip('char-count', `📝 ${charCount} chars`));
            }
        }

        // === QUALITY METRICS ===

        // Confidence Score
        if (metadata.confidence !== undefined) {
            const confidenceValue = this._formatConfidence(metadata.confidence);
            if (confidenceValue) {
                metaChips.push(this._createMetaChip('response-confidence', `✓ ${confidenceValue}`));
            }
        }

        // Safety/Toxicity Score
        if (metadata.safetyScore !== undefined) {
            const safetyPercent = Math.round(metadata.safetyScore * 100);
            const safetyIcon = safetyPercent >= 90 ? '🛡️' : safetyPercent >= 70 ? '⚠️' : '🚫';
            metaChips.push(this._createMetaChip('safety-score', `${safetyIcon} ${safetyPercent}% safe`));
        }

        // === TIMESTAMP ===

        // Timestamp
        const timestampStr = new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        metaChips.push(this._createMetaChip('timestamp', `🕐 ${timestampStr}`));

        // === ADDITIONAL INFO ===

        // Providers (only if different from source)
        if (Array.isArray(metadata.providers) && metadata.providers.length) {
            const providerText = this._formatProviders(metadata.providers);
            // Check if provider text is just the source name
            const isRedundant = metadata.source && providerText.toLowerCase().includes(metadata.source.toLowerCase());

            if (providerText && !isRedundant) {
                metaChips.push(this._createMetaChip('providers-tried', providerText));
            }
        }

        // Source Detail
        if (metadata.sourceDetail) {
            metaChips.push(this._createMetaChip('source-detail', metadata.sourceDetail));
        }

        // Only add metadata if NOT streaming (streaming adds it later)
        if (!isStreaming && metaChips.some(Boolean)) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-metadata';
            metaChips.forEach((chip) => {
                if (chip) metaDiv.appendChild(chip);
            });

            // Add Action Buttons to Metadata
            if (role === 'assistant' && !metadata.error && !isStreaming) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';

                // Copy Button
                const copyBtn = document.createElement('button');
                copyBtn.className = 'msg-action-btn';
                copyBtn.title = 'Copy';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.onclick = (e) => {
                    e.stopPropagation();
                    this._copyMessageText(contentDiv.textContent, copyBtn);
                };
                actionsDiv.appendChild(copyBtn);

                // Speak/Stop Button
                const speakBtn = document.createElement('button');
                speakBtn.className = 'msg-action-btn';
                speakBtn.title = 'Read Aloud';
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                speakBtn.onclick = (e) => {
                    e.stopPropagation();
                    this._speakMessage(contentDiv.textContent, speakBtn);
                };
                actionsDiv.appendChild(speakBtn);

                // Reaction button removed for cleaner UI

                metaDiv.appendChild(actionsDiv);
            }

            if (metaDiv.childNodes.length) {
                messageDiv.appendChild(metaDiv);
            }
        } else if (role === 'assistant' && !metadata.error && !isStreaming) {
            // Create metadata div just for actions if no other chips
            const metaDiv = document.createElement('div');
            metaDiv.className = 'message-metadata';
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';

            // Copy & Speak
            const copyBtn = document.createElement('button');
            copyBtn.className = 'msg-action-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.onclick = () => this._copyMessageText(contentDiv.textContent, copyBtn);
            actionsDiv.appendChild(copyBtn);

            const speakBtn = document.createElement('button');
            speakBtn.className = 'msg-action-btn';
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            speakBtn.onclick = (e) => {
                e.stopPropagation();
                this._speakMessage(contentDiv.textContent, speakBtn);
            };
            actionsDiv.appendChild(speakBtn);

            // Reaction button removed for cleaner UI

            metaDiv.appendChild(actionsDiv);
            messageDiv.appendChild(metaDiv);
        }

        if (metadata.error) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'msg-retry-btn';
            retryBtn.innerHTML = '🔄 Retry';
            retryBtn.onclick = () => this._retryLastMessage();
            messageDiv.appendChild(retryBtn);
        }

        return messageDiv;
    }

    _copyMessageText(text, btn) {
        if (!navigator.clipboard) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        } else {
            navigator.clipboard.writeText(text);
        }

        // Visual feedback
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = 'linear-gradient(135deg, #34c759 0%, #30d158 100%)';
        btn.title = 'Copied!';

        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = '';
            btn.title = 'Copy';
        }, 2000);
    }

    _speakMessage(text, btn) {
        if (!('speechSynthesis' in window)) {
            alert('Text-to-speech is not supported in your browser');
            return;
        }

        if (window.speechSynthesis.speaking) {
            // Stop speaking
            window.speechSynthesis.cancel();
            btn.innerHTML = '<i class="fas fa-volume-up"></i>';
            btn.style.background = '';
            btn.title = 'Read Aloud';
        } else {
            // Start speaking
            const cleanText = text
                .replace(/[*#`_~]/g, '')  // Remove markdown
                .replace(/<[^>]*>/g, '')   // Remove HTML
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links
                .trim();

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                btn.innerHTML = '<i class="fas fa-stop"></i>';
                btn.style.background = 'linear-gradient(135deg, #ff3b30 0%, #ff2d21 100%)';
                btn.title = 'Stop Speaking';
            };

            utterance.onend = () => {
                btn.innerHTML = '<i class="fas fa-volume-up"></i>';
                btn.style.background = '';
                btn.title = 'Read Aloud';
            };

            utterance.onerror = () => {
                btn.innerHTML = '<i class="fas fa-volume-up"></i>';
                btn.style.background = '';
                btn.title = 'Read Aloud';
            };

            window.speechSynthesis.speak(utterance);
        }
    }

    _retryLastMessage() {
        if (this.lastUserMessage) {
            this.sendMessage(this.lastUserMessage);
        }
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

        const sourceKey = response.source || response.provider || 'OpenRouter';
        metadata.sourceKey = sourceKey;
        metadata.source = response.sourceLabel || this._formatSourceLabel(sourceKey, response.type);
        metadata.model = response.model || 'x-ai/grok-4.1-fast:free';

        if (response.sourceMessage) {
            metadata.sourceDetail = response.sourceMessage;
        }

        if (typeof response.confidence === 'number' || typeof response.confidence === 'string') {
            metadata.confidence = response.confidence;
        }
        if (typeof response.processingTime === 'number') {
            metadata.processingTime = Math.max(0, Math.round(response.processingTime));
        } else if (response.processingTime) {
            metadata.processingTime = response.processingTime;
        }
        if (Array.isArray(response.providers) && response.providers.length) {
            metadata.providers = response.providers;
        } else {
            metadata.providers = [sourceKey];
        }

        // Token metadata (if provided by OpenRouter)
        const totalTokens = response?.usage?.total_tokens || response?.usage?.totalTokens;
        if (typeof totalTokens === 'number') {
            metadata.tokens = totalTokens;
            if (metadata.processingTime && metadata.processingTime > 0) {
                const seconds = metadata.processingTime / 1000;
                metadata.tokensPerSecond = Math.max(0, totalTokens / seconds);
            }
        }

        if (response.error) metadata.error = true;

        const normalized = this._normalizeAnswerPayload(response);
        if (normalized && typeof normalized === 'object' && normalized.html && features.enableMarkdownRendering) {
            return { content: { html: normalized.html }, metadata };
        }

        return { content: normalized, metadata };
    }

    _normalizeAnswerPayload(response) {
        const value = response?.html ? { html: response.html } : (response?.answer ?? response?.text ?? response);
        return this._normalizeAnswerValue(value);
    }

    _normalizeAnswerValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);

        if (Array.isArray(value)) {
            return value.map(item => this._normalizeAnswerValue(item)).filter(Boolean).join('\n');
        }

        if (typeof value === 'object') {
            if (value.html && typeof value.html === 'string') {
                return { html: value.html };
            }
            if (typeof value.text === 'string') {
                return value.text;
            }
            if (typeof value.answer === 'string') {
                return value.answer;
            }
            if (typeof value.content === 'string') {
                return value.content;
            }
        }

        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    _createMetaChip(className, text) {
        if (!text) return null;
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        return span;
    }

    _formatQueryType(type) {
        const map = {
            portfolio: 'Portfolio',
            math: 'Math',
            factual: 'Factual',
            definition: 'Definition',
            general: 'General',
            greeting: 'Greeting',
            help: 'Help',
            identity: 'Identity',
            utility: 'Utility',
            fallback: 'Fallback',
            ai: 'AI'
        };
        return map[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : '');
    }

    _formatConfidence(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') {
            if (value > 1) {
                return `${Math.round(value)}%`;
            }
            return `${Math.round(value * 100)}%`;
        }
        return '';
    }

    _formatProcessingTime(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number' && Number.isFinite(value)) {
            return `${Math.max(0, Math.round(value))}ms`;
        }
        if (typeof value === 'string') {
            return value;
        }
        return '';
    }

    _formatProviders(providers) {
        if (!Array.isArray(providers) || providers.length === 0) return '';
        const unique = [...new Set(providers.filter(Boolean))];
        if (!unique.length) return '';
        return `Signals: ${unique.join(', ')}`;
    }

    _formatSourceLabel(sourceKey, type = 'general') {
        if (!sourceKey) {
            return type === 'portfolio'
                ? 'AssistMe Portfolio'
                : type === 'math'
                    ? 'AssistMe Math Engine'
                    : 'AssistMe';
        }

        const normalized = this._normalizeSourceKey(sourceKey);
        const map = {
            'assistme': 'AssistMe',
            'assistme-portfolio': 'AssistMe Portfolio',
            'assistme-general': 'AssistMe',
            'assistme-math': 'AssistMe Math Engine',
            'assistme-utility': 'AssistMe Utility',
            'openai': 'OpenAI',
            'grok': 'Grok (xAI)',
            'claude': 'Claude (Anthropic)',
            'gemini': 'Google Gemini',
            'duckduckgo': 'DuckDuckGo',
            'wikipedia': 'Wikipedia',
            'stackoverflow': 'Stack Overflow',
            'offline': 'Offline Knowledge Base',
            'country_facts': 'REST Countries',
            'perplexity': 'Perplexity AI',
            'huggingface': 'Hugging Face',
            'openrouter': 'OpenRouter'
        };

        if (map[normalized]) {
            return map[normalized];
        }

        const words = normalized.split(/[-_]/g).filter(Boolean);
        if (!words.length) return 'AssistMe';
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    _normalizeSourceKey(value) {
        if (!value && value !== 0) return '';
        const lowered = String(value).trim().toLowerCase();
        const aliasMap = {
            'assistme server': 'assistme',
            'assistme client': 'assistme',
            'assistme portfolio': 'assistme-portfolio',
            'portfolio': 'assistme-portfolio',
            'assistme math': 'assistme-math',
            'gpt': 'openai',
            'gpt-4': 'openai',
            'gpt-4o': 'openai',
            'openai gpt': 'openai',
            'claude ai': 'claude',
            'grok ai': 'grok',
            'x.ai': 'grok',
            'duck duck go': 'duckduckgo',
            'wikipedia.org': 'wikipedia',
            'stack overflow': 'stackoverflow',
            'offline knowledge base': 'offline',
            'restcountries': 'country_facts',
            'perplexity ai': 'perplexity',
            'hugging face': 'huggingface',
            'open router': 'openrouter'
        };

        if (aliasMap[lowered]) {
            return aliasMap[lowered];
        }

        return lowered.replace(/\s+/g, '-');
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

        if (typeof input === 'undefined') {
            input = '';
        }

        if (typeof input !== 'string') {
            input = typeof input === 'number' ? String(input) : '';
        }

        if (!input && !this.history.length) {
            this._hideSuggestions();
            return;
        }

        let suggestions = [];
        if (input.length > 2) {
            suggestions = this._getContextualSuggestions(input) || [];
        } else if (this.history.length) {
            suggestions = chatAssistant.getSuggestions?.() || [];
        }

        if (!Array.isArray(suggestions) || !suggestions.length) {
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
        // Status indicator removed per design request
    }

    _showWelcomeMessage() {
        // Legacy disabled
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

        // Use requestAnimationFrame for smooth, lag-free scrolling
        requestAnimationFrame(() => {
            this.elements.messages.scrollTo({
                top: this.elements.messages.scrollHeight,
                behavior: 'smooth'
            });
        });
    }

    _toggleWidget() {
        // Legacy disabled
    }

    _openWidget() {
        // Legacy disabled
    }

    _closeWidget() {
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

    notifyAssistant(message) {
        if (!message) return;
        this.addMessage(message, 'assistant', { skipSpeech: true });
    }

    getStatus() {
        return {
            isProcessing: this.isProcessing,
            messageCount: this.elements.messages?.children.length || 0,
            assistantStatus: chatAssistant.getStatus()
        };
    }

    // ========== VOICE INTEGRATION METHODS (S2R-Inspired) ==========

    /**
     * Add a message to the chat (used by Voice Manager)
     * @param {string} text - Message text
     * @param {string} role - 'user', 'assistant', or 'system'
     * @param {object} options - Additional options for formatting
     */
    addMessage(text, role = 'assistant', options = {}) {
        if (text === undefined || text === null) return null;

        const metadata = { ...(options.metadata || {}) };
        if (options.system) {
            metadata.type = metadata.type || 'system';
        }

        const message = this._createMessageElement(text, role, Date.now(), metadata);
        this._addMessageElement(message);

        if (this.voiceOutputEnabled &&
            role === 'assistant' &&
            !options.skipSpeech &&
            typeof text === 'string') {
            this._speakText(text);
        }

        return message;
    }

    showAssistantThinking() {
        if (features.enableTypingIndicator) {
            this._showTypingIndicator();
        }
    }

    hideAssistantThinking() {
        if (features.enableTypingIndicator) {
            this._hideTypingIndicator();
        }
    }

    refreshSuggestions() {
        this._updateSuggestions();
    }

    async fetchAssistantResponse(text) {
        if (!text) return { content: '', metadata: {} };

        if (!chatAssistant.isReady()) {
            try {
                await chatAssistant.initialize();
            } catch (initError) {
                console.warn('Assistant initialization failed before processing voice query:', initError);
            }
        }

        const response = await chatAssistant.ask(text);
        return this._formatAssistantResponse(response);
    }

    _handleVoiceButtonPointerDown(event) {
        if (event.button !== 0) return;
        if (this.elements.voiceButton?.disabled) return;

        if (this.voiceMenuVisible) {
            this.hideVoiceMenu();
        }

        this.voiceHoldTriggered = false;
        this._cancelVoiceButtonHold();

        this.voiceHoldTimer = window.setTimeout(() => {
            this.voiceHoldTriggered = true;
            this.showVoiceMenu();
        }, 520);
    }

    _handleVoiceButtonPointerUp(event) {
        if (event.button !== 0) return;
        if (this.voiceHoldTimer) {
            clearTimeout(this.voiceHoldTimer);
            this.voiceHoldTimer = null;
        }

        if (this.voiceHoldTriggered) {
            this.voiceHoldTriggered = false;
            return;
        }

        if (this.elements.voiceButton?.disabled) return;
        document.dispatchEvent(new CustomEvent('voice-input-click'));
        this._cancelVoiceButtonHold();
    }

    _cancelVoiceButtonHold() {
        if (this.voiceHoldTimer) {
            clearTimeout(this.voiceHoldTimer);
            this.voiceHoldTimer = null;
        }
        this.voiceHoldTriggered = false;
    }

    _handleVoiceButtonKey(event) {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            document.dispatchEvent(new CustomEvent('voice-input-click'));
            return;
        }

        if (event.key === 'ArrowDown' || (event.key === 'F10' && event.shiftKey)) {
            event.preventDefault();
            this.showVoiceMenu();
            return;
        }

        if (event.key === 'Escape' && this.voiceMenuVisible) {
            event.preventDefault();
            this.hideVoiceMenu();
        }
    }

    _handleDocumentClick(event) {
        if (!this.voiceMenuVisible) return;
        const menu = this.elements.voiceMenu;
        const button = this.elements.voiceButton;
        if (!menu) return;

        const target = event.target;
        if (menu.contains(target) || button?.contains(target)) return;
        this.hideVoiceMenu();
    }

    _syncVoiceMenuState() {
        if (this.elements.voiceOutputToggle) {
            this.elements.voiceOutputToggle.checked = this.voiceOutputEnabled;
            const option = this.elements.voiceOutputToggle.closest('.voice-menu-option');
            if (option) option.classList.toggle('disabled', this.elements.voiceOutputToggle.disabled);
        }

        if (this.elements.voiceContinuousToggle) {
            const isContinuous = Boolean(window.voiceManager?.isContinuous);
            this.elements.voiceContinuousToggle.checked = isContinuous;
            const option = this.elements.voiceContinuousToggle.closest('.voice-menu-option');
            if (option) option.classList.toggle('disabled', this.elements.voiceContinuousToggle.disabled);
        }
    }

    showVoiceMenu() {
        const menu = this.elements.voiceMenu;
        if (!menu || this.elements.voiceButton?.disabled) return;

        this._syncVoiceMenuState();
        this.voiceMenuVisible = true;
        menu.classList.remove('hidden');
        menu.setAttribute('aria-hidden', 'false');
        this.elements.voiceButton?.classList.add('menu-open');
        this.elements.voiceButton?.setAttribute('aria-expanded', 'true');

        const focusTarget = this.elements.voiceOutputToggle?.disabled
            ? this.elements.voiceContinuousToggle
            : this.elements.voiceOutputToggle;
        if (focusTarget && !focusTarget.disabled) {
            setTimeout(() => focusTarget.focus({ preventScroll: true }), 0);
        }
    }

    hideVoiceMenu() {
        const menu = this.elements.voiceMenu;
        if (!menu || !this.voiceMenuVisible) return;

        this.voiceMenuVisible = false;
        menu.classList.add('hidden');
        menu.setAttribute('aria-hidden', 'true');
        this.elements.voiceButton?.classList.remove('menu-open');
        this.elements.voiceButton?.setAttribute('aria-expanded', 'false');
        this._cancelVoiceButtonHold();

        if (menu.contains(document.activeElement)) {
            this.elements.voiceButton?.focus({ preventScroll: true });
        }
    }

    /**
     * Update UI to show voice input activity status
     * @param {boolean} active - Whether voice input is active
     */
    setVoiceInputActive(active) {
        const button = this.elements.voiceButton;
        if (!button) return;

        if (active) {
            button.classList.add('active', 'recording');
            button.setAttribute('aria-pressed', 'true');
            button.title = 'Listening... Click to stop voice input';
        } else {
            button.classList.remove('active', 'recording');
            button.setAttribute('aria-pressed', 'false');
            button.title = 'Click to start voice input';
        }
    }

    /**
     * Update UI to show voice output activity status
     * @param {boolean} active - Whether voice output is active
     */
    setVoiceOutputActive(active) {
        const button = this.elements.voiceButton;
        if (!button) return;

        if (active) {
            button.classList.add('speaking');
            button.setAttribute('data-speaking', 'true');
        } else {
            button.classList.remove('speaking');
            button.removeAttribute('data-speaking');
        }
    }

    /**
     * Update UI to reflect whether voice output is enabled
     * @param {boolean} enabled
     */
    setVoiceOutputEnabledState(enabled) {
        this.voiceOutputEnabled = Boolean(enabled);
        const button = this.elements.voiceButton;
        if (button) {
            button.classList.toggle('voice-muted', !this.voiceOutputEnabled);
            button.setAttribute('data-voice-enabled', this.voiceOutputEnabled ? 'true' : 'false');
        }

        const toggle = this.elements.voiceOutputToggle;
        if (toggle && toggle.checked !== this.voiceOutputEnabled) {
            toggle.checked = this.voiceOutputEnabled;
        }

        if (this.voiceMenuVisible) {
            this._syncVoiceMenuState();
        }
    }

    /**
     * Update the UI for continuous listening mode
     * @param {boolean} active
     */
    setContinuousModeActive(active) {
        const isActive = Boolean(active);
        const button = this.elements.voiceButton;
        if (button) {
            button.classList.toggle('continuous-active', isActive);
        }

        const toggle = this.elements.voiceContinuousToggle;
        if (toggle && toggle.checked !== isActive) {
            toggle.checked = isActive;
        }

        if (this.voiceMenuVisible) {
            this._syncVoiceMenuState();
        }
    }

    disableVoiceInput(reason = 'Voice input is not supported in this browser.') {
        const button = this.elements.voiceButton;
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
            button.classList.remove('active', 'recording', 'continuous-active');
            button.setAttribute('aria-pressed', 'false');
            button.title = reason;
        }

        this.disableContinuousMode('Continuous listening requires voice input support.');
        this.hideVoiceMenu();
    }

    disableVoiceOutput(reason = 'Voice output is not supported in this browser.') {
        this.setVoiceOutputEnabledState(false);

        const toggle = this.elements.voiceOutputToggle;
        if (toggle) {
            toggle.checked = false;
            toggle.disabled = true;
            toggle.title = reason;
            const option = toggle.closest('.voice-menu-option');
            if (option) option.classList.add('disabled');
        }

        this.hideVoiceMenu();
    }

    disableContinuousMode(reason = 'Continuous listening is not available.') {
        const toggle = this.elements.voiceContinuousToggle;
        if (toggle) {
            toggle.checked = false;
            toggle.disabled = true;
            toggle.title = reason;
            const option = toggle.closest('.voice-menu-option');
            if (option) option.classList.add('disabled');
        }

        const button = this.elements.voiceButton;
        if (button) {
            button.classList.remove('continuous-active');
        }
    }

    /**
     * Show interim voice recognition results
     * @param {string} transcript - Real-time transcript
     */
    updateInterimTranscript(transcript) {
        // Could show live transcription as user speaks
        // For now, keep simple and just log
        console.log('🎤 Interim transcript:', transcript);
    }

    /**
     * Speak text using browser TTS (fallback if Web Speech API unavailable)
     * @param {string} text - Text to speak
     */
    _speakText(text) {
        if (!window.speechSynthesis) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        // Choose a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
            voice.lang.startsWith('en') &&
            (voice.name.toLowerCase().includes('natural') ||
                voice.name.toLowerCase().includes('human') ||
                voice.localService)
        ) || voices.find(voice => voice.lang.startsWith('en'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize core functionality
    initOverlayMenu();
    initOverlayNavigation();
    initSmoothScroll();



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

// Initialize Chat UI when DOM is ready
let chatUI;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Chat UI
    chatUI = new ChatUI();

    // Expose for external modules (like enhanced-chatbot.js)
    window.chatUI = chatUI;
    window.chatAssistant = chatAssistant;

    // Initialize Vercel Web Analytics
    initializeVercelAnalytics();

    console.log('✅ ChatUI initialized and ready');
});

export { ChatUI };

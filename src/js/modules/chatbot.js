/**
 * Apple Intelligence Chatbot 2025
 * Integrated with FastAPI backend, streaming responses, and full metadata
 */

class AppleIntelligenceChatbot {
    constructor() {
        this.elements = this.initializeElements();
        this.isOpen = false;
        this.isProcessing = false;
        this.chatAPI = null;

        if (!this.elements.widget || !this.elements.toggle) {
            console.error('Chatbot elements not found');
            return;
        }

        // Wait for chat API to be available
        this.waitForChatAPI();
        this.bindEvents();
        this.addWelcomeMessage();
    }

    async waitForChatAPI() {
        // Wait for the intelligentAssistant to be available from script.js
        let attempts = 0;
        const maxAttempts = 50;

        const checkAPI = () => {
            if (window.chatAssistant) {
                this.chatAPI = window.chatAssistant;
                console.log('✅ Chat API connected');
                return true;
            }
            return false;
        };

        if (checkAPI()) return;

        // Poll for API availability
        const interval = setInterval(() => {
            attempts++;
            if (checkAPI() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (!this.chatAPI) {
                    console.warn('⚠️ Chat API not available, using fallback');
                }
            }
        }, 100);
    }

    initializeElements() {
        const elements = {
            widget: document.getElementById('chatbot-widget'),
            toggle: document.getElementById('chatbot-toggle'),
            closeBtn: document.querySelector('.chatbot-close-btn'),
            form: document.getElementById('chatbot-form'),
            input: document.getElementById('chatbot-input'),
            messages: document.getElementById('chatbot-messages'),
            sendBtn: document.querySelector('.chatbot-send-btn'),
            voiceBtn: document.getElementById('chatbot-voice-btn')
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

            // Copy critical styles
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

        // Sync width in case of window resize
        this.shadowDiv.style.width = textarea.clientWidth + 'px';

        // Copy text (add space for newline accuracy)
        this.shadowDiv.textContent = textarea.value + '\u200b';

        // Get height from shadow
        const maxHeight = 120; // Matches CSS max-height
        const newHeight = Math.min(this.shadowDiv.scrollHeight, maxHeight);

        textarea.style.height = `${Math.max(newHeight, 24)}px`; // Min height constraint
    }

    bindEvents() {
        this.elements.toggle?.addEventListener('click', () => this.toggleWidget());
        this.elements.closeBtn?.addEventListener('click', () => this.closeWidget());

        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('Chatbot submit captured');
            this.handleSendMessage();
        });

        // Direct input handling for immediate response
        this.elements.input?.addEventListener('input', () => {
            this.autoResizeTextarea(this.elements.input);
        });

        this.elements.input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log('Chatbot Enter captured');
                this.handleSendMessage();
            }
        });

        this.elements.voiceBtn?.addEventListener('click', () => {
            this.handleVoiceInput();
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen &&
                !this.elements.widget.contains(e.target) &&
                !this.elements.toggle.contains(e.target)) {
                this.closeWidget();
            }
        });

        document.addEventListener('keydown', (e) => {
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
    }

    addWelcomeMessage() {
        // Welcome message disabled by user request
    }

    async handleSendMessage() {
        const text = this.elements.input?.value.trim();

        if (!text || this.isProcessing) return;

        this.isProcessing = true;

        // Add user message
        this.addMessage(text, 'user');

        // Clear input
        if (this.elements.input) {
            this.elements.input.value = '';
            this.autoResizeTextarea(this.elements.input);
        }

        // Show typing indicator
        this.showTypingIndicator();

        const startTime = Date.now();

        try {
            if (this.chatAPI && typeof this.chatAPI.ask === 'function') {
                // Use the real API with streaming
                await this.streamAIResponse(text, startTime);
            } else {
                // Fallback response
                await this.simulateTyping(this.getFallbackResponse(text), startTime);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage(
                "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                'assistant',
                { error: true }
            );
        } finally {
            this.isProcessing = false;
        }
    }

    async streamAIResponse(userMessage, startTime) {
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
            const response = await this.chatAPI.ask(userMessage, {
                onChunk: (chunk) => {
                    fullText += chunk;
                    contentDiv.textContent = fullText + '▊';
                    this.scrollToBottom();
                }
            });

            // Remove typing cursor
            contentDiv.textContent = fullText;

            // Extract metadata
            const runtime = Date.now() - startTime;
            metadata = {
                source: response.metadata?.source || response.source || 'AI',
                model: response.metadata?.model || response.model || 'Unknown',
                category: response.metadata?.category || 'General',
                runtime: runtime,
                tokens: response.metadata?.tokens || Math.ceil(fullText.length / 4),
                tokensPerSecond: response.metadata?.tokensPerSecond || (Math.ceil(fullText.length / 4) / (runtime / 1000)),
                cost: response.metadata?.cost,
                confidence: response.metadata?.confidence,
                timestamp: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                })
            };

            // Add metadata and action buttons
            this.addMetadataAndActions(messageDiv, contentDiv, metadata);

        } catch (error) {
            console.error('Streaming error:', error);
            contentDiv.textContent = fullText || "I encountered an error. Please try again.";
        }
    }

    async simulateTyping(text, startTime) {
        this.hideTypingIndicator();

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        messageDiv.appendChild(contentDiv);
        this.elements.messages?.appendChild(messageDiv);

        // Simulate streaming
        for (let i = 0; i < text.length; i++) {
            contentDiv.textContent = text.substring(0, i + 1) + '▊';
            this.scrollToBottom();
            await new Promise(r => setTimeout(r, 20));
        }

        contentDiv.textContent = text;

        const metadata = {
            source: 'Local',
            model: 'Fallback',
            category: 'Portfolio',
            runtime: Date.now() - startTime,
            tokens: Math.ceil(text.length / 4),
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })
        };

        this.addMetadataAndActions(messageDiv, contentDiv, metadata);
    }

    addMetadataAndActions(messageDiv, contentDiv, metadata) {
        // Create metadata container
        const metaContainer = document.createElement('div');
        metaContainer.className = 'message-metadata';

        // Add metadata chips
        const chips = [];

        if (metadata.model) {
            chips.push(this.createChip('🤖', metadata.model, 'model'));
        }

        if (metadata.source) {
            chips.push(this.createChip('🔌', metadata.source, 'source'));
        }

        if (metadata.category) {
            chips.push(this.createChip('📁', metadata.category, 'category'));
        }

        if (metadata.runtime) {
            const timeStr = metadata.runtime < 1000
                ? `${metadata.runtime}ms`
                : `${(metadata.runtime / 1000).toFixed(2)}s`;
            chips.push(this.createChip('⏱️', timeStr, 'runtime'));
        }

        if (metadata.tokens) {
            chips.push(this.createChip('🎯', `${metadata.tokens} tokens`, 'tokens'));
        }

        if (metadata.tokensPerSecond) {
            chips.push(this.createChip('⚡', `${Math.round(metadata.tokensPerSecond)} tok/s`, 'speed'));
        }

        if (metadata.cost) {
            const costStr = typeof metadata.cost === 'number'
                ? `$${metadata.cost.toFixed(4)}`
                : metadata.cost;
            chips.push(this.createChip('💰', costStr, 'cost'));
        }

        if (metadata.confidence) {
            const conf = Math.round(metadata.confidence * 100);
            chips.push(this.createChip('✓', `${conf}%`, 'confidence'));
        }

        if (metadata.timestamp) {
            chips.push(this.createChip('🕐', metadata.timestamp, 'timestamp'));
        }

        chips.forEach(chip => metaContainer.appendChild(chip));

        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        // Copy button
        const copyBtn = this.createActionButton('fa-copy', 'Copy', () => {
            this.copyText(contentDiv.textContent, copyBtn);
        });
        actionsDiv.appendChild(copyBtn);

        // Speak button
        const speakBtn = this.createActionButton('fa-volume-up', 'Speak', () => {
            this.speakText(contentDiv.textContent, speakBtn);
        });
        actionsDiv.appendChild(speakBtn);

        metaContainer.appendChild(actionsDiv);
        messageDiv.appendChild(metaContainer);
    }

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
        btn.onclick = (e) => {
            e.stopPropagation();
            onClick();
        };
        return btn;
    }

    copyText(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('success');
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('success');
            }, 2000);
        }).catch(err => {
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

        if (lowerMessage.includes('skill') || lowerMessage.includes('technology')) {
            return "Mangesh is proficient in Java, Python, Spring Boot, React, Angular, AWS, and Machine Learning. You can explore his full skill set in the Skills section of this portfolio.";
        }

        if (lowerMessage.includes('experience') || lowerMessage.includes('work')) {
            return "Mangesh has experience as a Software Engineer at Citi and as a Database Administrator at Aramark and Drexel University. Check out the Experience section for detailed information.";
        }

        if (lowerMessage.includes('project')) {
            return "Mangesh has worked on various projects including AI-powered applications, full-stack web development, and cloud solutions. Visit the Projects section to see his work.";
        }

        if (lowerMessage.includes('education')) {
            return "Mangesh holds a Master's degree in Information Systems from Drexel University. You can find more details in the Education section.";
        }

        if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
            return "You can reach Mangesh through the Contact section at the bottom of this page, or connect with him on LinkedIn and GitHub.";
        }

        return "I can help you learn more about Mangesh's skills, experience, projects, and education. Feel free to ask me anything about his portfolio!";
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

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        this.elements.messages?.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        indicator?.remove();
    }

    scrollToBottom() {
        if (this.elements.messages) {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }
    }

    handleVoiceInput() {
        this.addMessage("Voice input feature coming soon!", 'assistant', { skipMetadata: true });
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

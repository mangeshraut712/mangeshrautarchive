/**
 * 2025 AI Chatbot Upgrade
 * Modern features: Streaming, Markdown, Code highlighting, Voice, Reactions
 */

class ChatbotUpgrade2025 {
    constructor() {
        this.messageId = 0;
        this.isTyping = false;
        this.currentStreamingMessage = null;

        // Initialize modern features
        this.initMarkdownRenderer();
        this.initCodeHighlighting();
        this.initMessageActions();
        this.initSmartSuggestions();
    }

    /**
     * Initialize Markdown Renderer (using marked.js if available)
     */
    initMarkdownRenderer() {
        // Check if marked.js is loaded
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: (code, lang) => {
                    if (typeof Prism !== 'undefined' && lang && Prism.languages[lang]) {
                        return Prism.highlight(code, Prism.languages[lang], lang);
                    }
                    return code;
                },
                breaks: true,
                gfm: true
            });
            this.markdownEnabled = true;
        } else {
            this.markdownEnabled = false;
            console.warn('Marked.js not loaded - markdown rendering disabled');
        }
    }

    /**
     * Initialize Code Highlighting
     */
    initCodeHighlighting() {
        this.codeHighlightingEnabled = typeof Prism !== 'undefined';
        if (!this.codeHighlightingEnabled) {
            console.warn('Prism.js not loaded - code highlighting disabled');
        }
    }

    /**
     * Render message with markdown and code highlighting
     */
    renderMessage(content, role = 'assistant') {
        const messageId = `msg-${this.messageId++}`;
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let renderedContent = content;

        // Apply markdown if enabled
        if (this.markdownEnabled && role === 'assistant') {
            try {
                renderedContent = marked.parse(content);
            } catch (e) {
                console.error('Markdown parsing error:', e);
                renderedContent = this.escapeHtml(content).replace(/\n/g, '<br>');
            }
        } else {
            renderedContent = this.escapeHtml(content).replace(/\n/g, '<br>');
        }

        const messageHTML = `
            <div class="chat-message ${role}-message" id="${messageId}" data-role="${role}">
                <div class="message-content">
                    <div class="message-text">${renderedContent}</div>
                    <div class="message-meta">
                        <span class="message-time">${timestamp}</span>
                        ${role === 'assistant' ? this.renderMessageActions(messageId) : ''}
                    </div>
                </div>
            </div>
        `;

        return { html: messageHTML, id: messageId };
    }

    /**
     * Render message actions (copy, speak, react)
     */
    renderMessageActions(messageId) {
        return `
            <div class="message-actions">
                <button class="action-btn copy-btn" onclick="chatbotUpgrade.copyMessage('${messageId}')" title="Copy">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn speak-btn" onclick="chatbotUpgrade.speakMessage('${messageId}')" title="Read aloud">
                    <i class="fas fa-volume-up"></i>
                </button>
                <button class="action-btn react-btn" onclick="chatbotUpgrade.toggleReactions('${messageId}')" title="React">
                    <i class="fas fa-smile"></i>
                </button>
            </div>
        `;
    }

    /**
     * Initialize message actions
     */
    initMessageActions() {
        // Add global styles for message actions
        if (!document.getElementById('chatbot-upgrade-styles')) {
            const styles = document.createElement('style');
            styles.id = 'chatbot-upgrade-styles';
            styles.textContent = `
                .message-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .chat-message:hover .message-actions {
                    opacity: 1;
                }
                
                .action-btn {
                    background: transparent;
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
                    border-radius: 0.375rem;
                    padding: 0.375rem 0.5rem;
                    cursor: pointer;
                    color: var(--text-secondary, #888);
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                }
                
                .action-btn:hover {
                    background: var(--accent-color, #0a84ff);
                    color: white;
                    border-color: var(--accent-color, #0a84ff);
                    transform: translateY(-2px);
                }
                
                .message-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--text-secondary, #888);
                }
                
                .message-time {
                    opacity: 0.7;
                }
                
                /* Code block styling */
                pre {
                    background: rgba(0, 0, 0, 0.1);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
                    border-radius: 0.5rem;
                    padding: 1rem;
                    overflow-x: auto;
                    position: relative;
                    margin: 1rem 0;
                }
                
                pre code {
                    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
                    font-size: 0.875rem;
                    line-height: 1.5;
                }
                
                .code-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid var(--border-color);
                    border-radius: 0.5rem 0.5rem 0 0;
                    margin-bottom: -1rem;
                }
                
                .code-language {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--accent-color, #0a84ff);
                }
                
                .copy-code-btn {
                    background: var(--accent-color, #0a84ff);
                    color: white;
                    border: none;
                    border-radius: 0.25rem;
                    padding: 0.25rem 0.75rem;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .copy-code-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
                }
                
                /* Typing indicator */
                .typing-indicator {
                    display: flex;
                    gap: 0.25rem;
                    padding: 1rem;
                }
                
                .typing-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--accent-color, #0a84ff);
                    animation: typingAnimation 1.4s infinite;
                }
                
                .typing-dot:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .typing-dot:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes typingAnimation {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.7;
                    }
                    30% {
                        transform: translateY(-10px);
                        opacity: 1;
                    }
                }
                
                /* Reactions */
                .reaction-picker {
                    position: absolute;
                    bottom: 100%;
                    right: 0;
                    background: var(--bg-primary, white);
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    padding: 0.5rem;
                    display: flex;
                    gap: 0.5rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                }
                
                .reaction-emoji {
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                
                .reaction-emoji:hover {
                    transform: scale(1.3);
                }
                
                /* Smart suggestions */
                .smart-suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    padding: 1rem;
                    border-top: 1px solid var(--border-color);
                }
                
                .suggestion-chip {
                    background: var(--bg-secondary, #f5f5f7);
                    border: 1px solid var(--border-color);
                    border-radius: 1rem;
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .suggestion-chip:hover {
                    background: var(--accent-color, #0a84ff);
                    color: white;
                    border-color: var(--accent-color);
                    transform: translateY(-2px);
                }
                
                html.dark .action-btn {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                html.dark pre {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                html.dark .suggestion-chip {
                    background: rgba(255, 255, 255, 0.05);
                }
            `;
            document.head.appendChild(styles);
        }
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        this.isTyping = true;
        const typingHTML = `
            <div class="typing-indicator" id="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        this.isTyping = false;
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Stream message with typing effect
     */
    async streamMessage(content, onComplete) {
        this.hideTypingIndicator();

        const { html, id } = this.renderMessage('', 'assistant');
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        messagesContainer.insertAdjacentHTML('beforeend', html);
        const messageElement = document.getElementById(id);
        const textElement = messageElement.querySelector('.message-text');

        let currentText = '';
        const words = content.split(' ');

        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];

            if (this.markdownEnabled) {
                textElement.innerHTML = marked.parse(currentText);
            } else {
                textElement.textContent = currentText;
            }

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            await this.delay(50); // Typing speed
        }

        // Highlight code blocks after streaming
        if (this.codeHighlightingEnabled) {
            this.highlightCodeBlocks(messageElement);
        }

        if (onComplete) onComplete();
    }

    /**
     * Highlight code blocks in message
     */
    highlightCodeBlocks(messageElement) {
        const codeBlocks = messageElement.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(block);

                // Add copy button to code blocks
                const pre = block.parentElement;
                if (!pre.querySelector('.copy-code-btn')) {
                    const lang = block.className.replace('language-', '') || 'code';
                    const header = document.createElement('div');
                    header.className = 'code-header';
                    header.innerHTML = `
                        <span class="code-language">${lang}</span>
                        <button class="copy-code-btn" onclick="chatbotUpgrade.copyCode(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    `;
                    pre.insertBefore(header, block);
                }
            }
        });
    }

    /**
     * Copy message content
     */
    copyMessage(messageId) {
        const message = document.getElementById(messageId);
        if (!message) return;

        const textElement = message.querySelector('.message-text');
        const text = textElement.textContent || textElement.innerText;

        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Message copied!', 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            this.showToast('Copy failed', 'error');
        });
    }

    /**
     * Copy code block
     */
    copyCode(button) {
        const pre = button.closest('pre');
        const code = pre.querySelector('code');
        const text = code.textContent || code.innerText;

        navigator.clipboard.writeText(text).then(() => {
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }

    /**
     * Speak message using Web Speech API
     */
    speakMessage(messageId) {
        const message = document.getElementById(messageId);
        if (!message) return;

        const textElement = message.querySelector('.message-text');
        const text = textElement.textContent || textElement.innerText;

        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            window.speechSynthesis.speak(utterance);
            this.showToast('Reading message...', 'info');
        } else {
            this.showToast('Text-to-speech not supported', 'error');
        }
    }

    /**
     * Toggle reaction picker
     */
    toggleReactions(messageId) {
        const message = document.getElementById(messageId);
        if (!message) return;

        const existingPicker = message.querySelector('.reaction-picker');
        if (existingPicker) {
            existingPicker.remove();
            return;
        }

        const reactions = ['👍', '❤️', '😊', '🎉', '🤔', '👏'];
        const pickerHTML = `
            <div class="reaction-picker">
                ${reactions.map(emoji => `
                    <span class="reaction-emoji" onclick="chatbotUpgrade.addReaction('${messageId}', '${emoji}')">${emoji}</span>
                `).join('')}
            </div>
        `;

        const actionsDiv = message.querySelector('.message-actions');
        actionsDiv.style.position = 'relative';
        actionsDiv.insertAdjacentHTML('beforeend', pickerHTML);
    }

    /**
     * Add reaction to message
     */
    addReaction(messageId, emoji) {
        const message = document.getElementById(messageId);
        if (!message) return;

        const picker = message.querySelector('.reaction-picker');
        if (picker) picker.remove();

        this.showToast(`Reacted with ${emoji}`, 'success');
    }

    /**
     * Initialize smart suggestions
     */
    initSmartSuggestions() {
        this.suggestions = [
            "Explain your latest project",
            "What are your top skills?",
            "Tell me about your experience",
            "Show me code examples",
            "What technologies do you use?"
        ];
    }

    /**
     * Show smart suggestions
     */
    showSmartSuggestions() {
        const container = document.getElementById('chatbot-messages');
        if (!container) return;

        const suggestionsHTML = `
            <div class="smart-suggestions" id="smart-suggestions">
                ${this.suggestions.map(suggestion => `
                    <div class="suggestion-chip" onclick="chatbotUpgrade.useSuggestion('${suggestion}')">
                        ${suggestion}
                    </div>
                `).join('')}
            </div>
        `;

        // Remove existing suggestions
        const existing = document.getElementById('smart-suggestions');
        if (existing) existing.remove();

        container.insertAdjacentHTML('beforeend', suggestionsHTML);
    }

    /**
     * Use suggestion
     */
    useSuggestion(suggestion) {
        const input = document.getElementById('chatbot-input');
        if (input) {
            input.value = suggestion;
            const sendBtn = document.querySelector('.chatbot-send-btn');
            if (sendBtn) sendBtn.click();
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#0a84ff',
            warning: '#f59e0b'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize upgrade
let chatbotUpgrade;
document.addEventListener('DOMContentLoaded', () => {
    chatbotUpgrade = new ChatbotUpgrade2025();
    window.chatbotUpgrade = chatbotUpgrade;
    console.log('🚀 2025 Chatbot Upgrade Loaded!');
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotUpgrade2025;
}

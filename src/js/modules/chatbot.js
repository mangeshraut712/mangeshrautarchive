/**
 * Apple Intelligence Chatbot 2025
 * Clean, modern implementation with no legacy code
 */

class AppleIntelligenceChatbot {
    constructor() {
        this.elements = this.initializeElements();
        this.isOpen = false;
        this.isProcessing = false;

        if (!this.elements.widget || !this.elements.toggle) {
            console.error('Chatbot elements not found');
            return;
        }

        this.bindEvents();
        this.addWelcomeMessage();
    }

    initializeElements() {
        return {
            widget: document.getElementById('chatbot-widget'),
            toggle: document.getElementById('chatbot-toggle'),
            closeBtn: document.querySelector('.chatbot-close-btn'),
            form: document.getElementById('chatbot-form'),
            input: document.getElementById('chatbot-input'),
            messages: document.getElementById('chatbot-messages'),
            sendBtn: document.querySelector('.chatbot-send-btn'),
            voiceBtn: document.getElementById('chatbot-voice-btn')
        };
    }

    bindEvents() {
        // Toggle button
        this.elements.toggle?.addEventListener('click', () => this.toggleWidget());

        // Close button
        this.elements.closeBtn?.addEventListener('click', () => this.closeWidget());

        // Form submission
        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });

        // Auto-resize textarea
        this.elements.input?.addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
        });

        // Enter key to send (Shift+Enter for new line)
        this.elements.input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Voice button (placeholder for future implementation)
        this.elements.voiceBtn?.addEventListener('click', () => {
            this.handleVoiceInput();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen &&
                !this.elements.widget.contains(e.target) &&
                !this.elements.toggle.contains(e.target)) {
                this.closeWidget();
            }
        });

        // Close on Escape key
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
        this.elements.widget?.classList.remove('hidden');
        this.elements.widget?.classList.add('visible');
        this.isOpen = true;

        // Focus input
        setTimeout(() => {
            this.elements.input?.focus();
        }, 300);
    }

    closeWidget() {
        this.elements.widget?.classList.remove('visible');
        this.elements.widget?.classList.add('hidden');
        this.isOpen = false;
    }

    addWelcomeMessage() {
        // Welcome message is already in HTML, but we can add more if needed
        const existingMessages = this.elements.messages?.querySelectorAll('.message');
        if (!existingMessages || existingMessages.length === 0) {
            this.addMessage(
                "Hello! I'm Mangesh's advanced AI assistant. How can I help you navigate his portfolio today?",
                'assistant'
            );
        }
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

        try {
            // Get AI response
            const response = await this.getAIResponse(text);

            // Remove typing indicator
            this.hideTypingIndicator();

            // Add AI response
            this.addMessage(response, 'assistant');
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessage(
                "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                'assistant'
            );
        } finally {
            this.isProcessing = false;
        }
    }

    async getAIResponse(userMessage) {
        // Try to use the existing chat API if available
        if (window.intelligentAssistant && typeof window.intelligentAssistant.ask === 'function') {
            try {
                const response = await window.intelligentAssistant.ask(userMessage);
                return response.content?.text || response.content || response;
            } catch (error) {
                console.error('AI API error:', error);
            }
        }

        // Fallback to simple responses
        return this.getFallbackResponse(userMessage);
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

    addMessage(text, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;

        messageDiv.appendChild(contentDiv);
        this.elements.messages?.appendChild(messageDiv);

        // Scroll to bottom
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

    autoResizeTextarea(textarea) {
        if (!textarea) return;

        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px
        textarea.style.height = newHeight + 'px';
    }

    handleVoiceInput() {
        // Placeholder for voice input functionality
        this.addMessage("Voice input feature coming soon!", 'assistant');
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

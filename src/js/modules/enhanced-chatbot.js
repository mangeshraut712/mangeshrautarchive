/**
 * Enhanced AI Chatbot with Voice Capabilities
 * 2025 Portfolio Upgrade - Phase 2
 * Features: Voice input/output, context awareness, portfolio integration
 */

class EnhancedChatbot {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.conversationHistory = [];
        this.voiceEnabled = false;

        // Initialize Web Speech API
        this.initSpeechRecognition();
        this.initUI();
    }

    /**
     * Initialize Speech Recognition (Voice Input)
     */
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton(true);
                console.log('🎤 Voice recognition started');
            };

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                // Update input field with transcript
                const input = document.getElementById('chatbot-input');
                if (input) {
                    input.value = transcript;
                }

                // If final result, send message
                if (event.results[0].isFinal) {
                    this.sendMessage(transcript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateVoiceButton(false);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton(false);
                console.log('🎤 Voice recognition ended');
            };

            this.voiceEnabled = true;
        } else {
            console.warn('Speech recognition not supported in this browser');
            this.voiceEnabled = false;
        }
    }

    /**
     * Initialize Enhanced UI Elements
     */
    initUI() {
        // Add voice button to chatbot if not exists
        const chatbotForm = document.getElementById('chatbot-form');
        if (chatbotForm && this.voiceEnabled) {
            const voiceBtn = document.getElementById('chatbot-voice-btn');
            if (voiceBtn) {
                voiceBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleVoiceRecognition();
                });
            }
        }

        // Add suggested prompts
        this.addSuggestedPrompts();
    }

    /**
     * Toggle Voice Recognition
     */
    toggleVoiceRecognition() {
        if (!this.voiceEnabled) {
            alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting voice recognition:', error);
            }
        }
    }

    /**
     * Update Voice Button State
     */
    updateVoiceButton(isListening) {
        const voiceBtn = document.getElementById('chatbot-voice-btn');
        if (voiceBtn) {
            if (isListening) {
                voiceBtn.classList.add('listening');
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                voiceBtn.style.background = '#ff3b30'; // Red when listening
            } else {
                voiceBtn.classList.remove('listening');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.style.background = '#34c759'; // Green when ready
            }
        }
    }

    /**
     * Send Message (Enhanced with Context)
     */
    /**
     * Send Message (Enhanced with Context)
     */
    async sendMessage(message) {
        if (!message || !message.trim()) return;

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        const context = this.getPageContext();

        // Use the exposed ChatUI instance
        if (window.chatUI && typeof window.chatUI.sendMessage === 'function') {
            console.log('📤 Sending message via ChatUI with context:', context);
            await window.chatUI.sendMessage(message, context);
        } else {
            // Fallback to legacy click method
            console.warn('⚠️ ChatUI not found, falling back to legacy click');
            const input = document.getElementById('chatbot-input');
            if (input) input.value = message;
            const sendBtn = document.querySelector('.chatbot-send-btn');
            if (sendBtn) sendBtn.click();
        }
    }

    /**
     * Get Page Context (Scrape dynamic content)
     */
    getPageContext() {
        return {
            currentSection: this.getCurrentSection(),
            visibleProjects: this.getVisibleProjects(),
            skills: this.getSkills(),
            latestBlog: this.getLatestBlog()
        };
    }

    getCurrentSection() {
        const sections = document.querySelectorAll('section');
        let current = 'home';
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                current = section.id;
            }
        });
        return current;
    }

    getVisibleProjects() {
        const projects = [];
        document.querySelectorAll('.project-card, .github-project-card').forEach(card => {
            const title = card.querySelector('h3')?.textContent;
            const desc = card.querySelector('p')?.textContent;
            if (title) projects.push({ title, description: desc });
        });
        return projects.slice(0, 5); // Limit to 5
    }

    getSkills() {
        const skills = [];
        document.querySelectorAll('.skill-item, .skill-tag').forEach(item => {
            skills.push(item.textContent.trim());
        });
        return skills.slice(0, 20);
    }

    getLatestBlog() {
        const blogCard = document.querySelector('.blog-card');
        if (blogCard) {
            return {
                title: blogCard.querySelector('.blog-title')?.textContent,
                summary: blogCard.querySelector('.blog-summary')?.textContent
            };
        }
        return null;
    }

    /**
     * Enhance Message with Portfolio Context
     */
    async enhanceMessageWithContext(message) {
        const lowerMessage = message.toLowerCase();

        // Portfolio-specific enhancements
        const enhancements = {
            // Project queries
            'java projects': 'Show me projects where Mangesh used Java',
            'python projects': 'Show me projects where Mangesh used Python',
            'aws projects': 'Show me projects involving AWS',

            // Experience queries
            'aws experience': 'Tell me about Mangesh\'s AWS experience from his work at Customized Energy Solutions',
            'spring boot': 'Explain Mangesh\'s Spring Boot expertise',
            'machine learning': 'Describe Mangesh\'s machine learning projects and experience',

            // Education queries
            'education': 'Tell me about Mangesh\'s education at Stevens Institute of Technology',
            'degree': 'What degree does Mangesh have?',

            // Skills queries
            'skills': 'List Mangesh\'s technical skills',
            'technologies': 'What technologies does Mangesh know?'
        };

        // Check for matches
        for (const [key, enhancement] of Object.entries(enhancements)) {
            if (lowerMessage.includes(key)) {
                return enhancement;
            }
        }

        return message;
    }

    /**
     * Add Suggested Prompts
     */
    addSuggestedPrompts() {
        const suggestedPrompts = [
            "Tell me about Mangesh's experience",
            "Show me Java projects",
            "What are Mangesh's AWS skills?",
            "Explain his machine learning work",
            "Tell me about his education"
        ];

        // Add to chatbot UI (if container exists)
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer && messagesContainer.children.length === 0) {
            const promptsHTML = `
        <div class="suggested-prompts" style="padding: 1rem; text-align: center;">
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
            Try asking:
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;">
            ${suggestedPrompts.map(prompt => `
              <button class="suggested-prompt-btn" 
                      style="padding: 0.5rem 1rem; 
                             background: var(--bg-secondary); 
                             border: 1px solid var(--border-color); 
                             border-radius: 1rem; 
                             font-size: 0.8125rem;
                             cursor: pointer;
                             transition: all 0.2s ease;"
                      onclick="document.getElementById('chatbot-input').value = '${prompt}'; document.querySelector('.chatbot-send-btn').click();">
                ${prompt}
              </button>
            `).join('')}
          </div>
        </div>
      `;

            messagesContainer.innerHTML = promptsHTML + messagesContainer.innerHTML;
        }
    }

    /**
     * Get Conversation Context
     */
    getConversationContext() {
        return this.conversationHistory.slice(-5); // Last 5 messages
    }

    /**
     * Clear Conversation History
     */
    clearHistory() {
        this.conversationHistory = [];
        console.log('🗑️ Conversation history cleared');
    }
}

// Initialize Enhanced Chatbot
let enhancedChatbot;
document.addEventListener('DOMContentLoaded', () => {
    enhancedChatbot = new EnhancedChatbot();
    console.log('✅ Enhanced Chatbot initialized with voice capabilities');

    // Make it globally accessible
    window.enhancedChatbot = enhancedChatbot;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedChatbot;
}

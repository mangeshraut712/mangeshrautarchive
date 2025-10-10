import { localConfig, features, results as searchResults } from './config.js';

// Intelligent Chat Assistant with Integrated AI
class IntelligentAssistant {
    constructor(options = {}) {
        this.cache = null;
        this.isReadyState = false;
        this.defaultGreetings = [
            "Hello! I'm AssistMe, Mangesh Raut's AI assistant. I can help with his portfolio, math problems, general knowledge, and more.",
            "Hi there! I'm here to help you learn about Mangesh's work and answer questions.",
            "Welcome! Feel free to ask about Mangesh's experience, skills, or any technical topics."
        ];
        this.processing = false;
        this.history = [];
    }

    async initialize() {
        if (!navigator.onLine) {
            console.warn('Offline mode - limited functionality');
            this.isReadyState = true;
            return false;
        }

        try {
            // Test server connectivity
            const response = await fetch('/api/ai/status', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                timeout: 5000
            });

            if (response.ok) {
                this.isReadyState = true;
                return true;
            }

            console.warn('Server connectivity test failed');
            return false;

        } catch (error) {
            console.warn('Server initialization failed:', error.message);
            return false;
        }
    }

    isReady() {
        return this.isReadyState;
    }

    /**
     * Main method to ask questions
     */
    async ask(question, options = {}) {
        if (!question || typeof question !== 'string') {
            throw new Error('Question must be a valid string');
        }

        if (this.processing) {
            return this.handleConcurrency(options);
        }

        this.processing = true;

        try {
            // Add to history
            this.history.push({ question, timestamp: Date.now() });

            // Process the query
            const response = await this.processQuery(question.trim());

            // Add response to history
            this.history[this.history.length - 1].response = response;
            this.history[this.history.length - 1].processingTime = Date.now() - this.history[this.history.length - 1].timestamp;

            return response;

        } catch (error) {
            console.error('Error processing query:', error);
            return this.generateFallbackResponse(question, error);
        } finally {
            this.processing = false;
        }
    }

    async processQuery(query) {
        // Use server API for intelligent processing
        const response = await this.callServerAPI(query);

        if (response && response.answer) {
            return response.answer;
        }

        // Fallback to basic processing if server unavailable
        return this.basicQueryProcessing(query);
    }

    async callServerAPI(query) {
        if (!this.isReadyState) {
            return null;
        }

        try {
            console.log('🖥️ Calling server API with query:', query);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message: query }),
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Server response received:', data);

            return data;

        } catch (error) {
            console.error('❌ Server API call failed:', error.message);
            this.markServerUnavailable();
            return null;
        }
    }

    basicQueryProcessing(query) {
        // Simple fallback processing
        const lower = query.toLowerCase();

        if (lower.includes('hello') || lower.includes('hi')) {
            return this.defaultGreetings[Math.floor(Math.random() * this.defaultGreetings.length)];
        }

        if (lower.includes('portfolio') || lower.includes('work')) {
            return 'Mangesh is a Software Engineer specializing in Java Spring Boot, AngularJS, AWS, and machine learning. Check out his GitHub: github.com/mangeshraut712';
        }

        if (lower.includes('contact') || lower.includes('email')) {
            return 'You can reach Mangesh at mbr63@drexel.edu or connect on LinkedIn: linkedin.com/in/mangeshraut71298';
        }

        return 'I\'m here to help! Ask me about Mangesh\'s skills, experience, or general questions.';
    }

    generateFallbackResponse(query, error) {
        const fallbackResponses = [
            "I'm experiencing some technical difficulties. Please try again in a moment.",
            "Sorry, I couldn't process that right now. Feel free to try a different question!",
            "I'm having trouble connecting right now. Please check your internet and try again."
        ];

        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    handleConcurrency(options) {
        if (options.queue) {
            // Check if the context is still valid before proceeding with delayed execution
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(async () => {
                    try {
                        // Double-check that we're not destroyed and still have the assistant instance
                        if (!this.isDestroyed && this.ask) {
                            const result = await this.ask(options.queue);
                            resolve(result);
                        } else {
                            resolve("Processing was cancelled due to context being closed.");
                        }
                    } catch (error) {
                        reject(error);
                    }
                }, 1000);

                // Store timeout ID for potential cleanup
                if (!this.pendingTimeouts) {
                    this.pendingTimeouts = new Set();
                }
                this.pendingTimeouts.add(timeoutId);

                // Add cleanup listener for when context closes
                if (options.onCancel) {
                    const cancelCleanup = () => {
                        clearTimeout(timeoutId);
                        this.pendingTimeouts.delete(timeoutId);
                    };
                    options.onCancel(cancelCleanup);
                }
            });
        }

        return "I'm already processing your previous request. Please wait...";
    }

    markServerUnavailable() {
        this.isReadyState = false;
        // Try to reinitialize after a delay
        setTimeout(() => this.initialize(), 30000); // 30 seconds
    }

    getStatus() {
        return {
            ready: this.isReadyState,
            processing: this.processing,
            historyLength: this.history.length,
            lastQuery: this.history[this.history.length - 1] || null
        };
    }

    getSuggestions() {
        const suggestions = [
            "Tell me about your skills",
            "What projects have you worked on?",
            "Calculate 25 * 15",
            "Convert 100 Celsius to Fahrenheit"
        ];

        // Add recent topics
        const recentTopics = this.history.slice(-3).map(h => {
            if (h.question && h.question.length < 50) {
                return h.question;
            }
        }).filter(Boolean);

        return [...new Set([...suggestions, ...recentTopics])];
    }

    clearHistory() {
        this.history = [];
        return true;
    }

    getHistory(limit = 10) {
        return this.history.slice(-limit).reverse();
    }

    destroy() {
        // Mark as destroyed to prevent new operations
        this.isDestroyed = true;

        // Clean up any pending timeouts
        if (this.pendingTimeouts) {
            this.pendingTimeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            this.pendingTimeouts.clear();
        }

        // Reset state
        this.processing = false;
        this.history = [];
        this.cache = null;

        console.log('Assistant destroyed and cleaned up');
    }
}

// Create and export the singleton instance
const intelligentAssistant = new IntelligentAssistant();

export { intelligentAssistant };
export { IntelligentAssistant };
export default intelligentAssistant;

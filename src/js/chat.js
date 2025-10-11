import { localConfig } from './config.js';
import { chatService as clientChatService } from './services.js';

let API_BASE = localConfig.apiBaseUrl || '';

if (typeof window !== 'undefined') {
    if (window.APP_CONFIG?.apiBaseUrl) {
        API_BASE = window.APP_CONFIG.apiBaseUrl;
    } else if (!API_BASE) {
        const hostname = window.location.hostname || '';
        // Use API for local development and Vercel deployment only - GitHub Pages gets offline mode
        if (hostname.endsWith('.vercel.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
            API_BASE = '';
        } else {
            // On GitHub Pages or other static hosting, don't set API_BASE at all for offline mode
        }
    }
} else if (typeof process !== 'undefined' && process.env?.VERCEL_URL) {
    API_BASE = `https://${process.env.VERCEL_URL}`;
}

function buildApiUrl(path) {
    if (!API_BASE) {
        return path;
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

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
        // For GitHub Pages deployment, work offline only to avoid CORS issues
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

        // Check multiple ways to detect GitHub Pages and static hosting
        const isGitHubPages = hostname.includes('github.io') ||
                              hostname.includes('mangeshraut712.github.io') ||
                              !navigator.onLine ||
                              (window.location.protocol === 'https:' &&
                               !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) &&
                               !hostname.endsWith('.vercel.app') &&
                               !hostname.endsWith('.herokuapp.com') &&
                               !hostname.endsWith('.netlify.app'));

        if (isGitHubPages || !navigator.onLine) {
            console.log(`🤖 ${isGitHubPages ? 'GitHub Pages' : 'Offline mode'} detected - running in offline mode`);
            console.log('Current hostname:', hostname);
            console.log('Protocol:', window.location.protocol);
            this.isReadyState = true;
            return false; // False indicates offline mode, but ready for local processing
        }

        try {
            // Test server connectivity - use Vercel endpoint
            console.log('🖥️ Testing server connectivity...');
            const response = await fetch(buildApiUrl('/api/status'), {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(8000) // Increased timeout
            });

            if (response.ok) {
                console.log('✅ Server connectivity test successful');
                this.isReadyState = true;
                return true;
            }

            console.warn('Server connectivity test failed with status:', response.status);
            return false;

        } catch (error) {
            console.warn('Server initialization failed - running offline mode:', error.message);
            console.log('Falling back to offline mode due to server unavailability');
            this.isReadyState = true; // Still set as ready for local processing
            return false; // Return false to indicate offline mode
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
        const trimmed = query.trim();
        const responses = [];

        if (!this.isReady()) {
            try {
                await this.initialize();
            } catch (error) {
                console.warn('Assistant initialization failed before processing:', error);
            }
        }

        const serverRaw = await this.callApi(trimmed);
        const serverResponse = this.normalizeResponse(serverRaw, 'AssistMe Server');
        if (serverResponse) {
            responses.push(serverResponse);
            if (this.isMeaningfulResponse(serverResponse)) {
                return serverResponse;
            }
        }

        const clientRaw = await this.callClientService(trimmed);
        const clientResponse = this.normalizeResponse(clientRaw, 'AssistMe');
        if (clientResponse) {
            responses.push(clientResponse);
        }

        const best = this.chooseBestResponse(responses);
        if (best) {
            return best;
        }

        return this.basicQueryProcessing(trimmed);
    }

    async callApi(query) {
        // Skip API calls on GitHub Pages to avoid CORS issues
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        if (hostname.includes('github.io')) {
            console.log('🔄 Skipping API call on GitHub Pages (CORS restriction)');
            return null;
        }

        try {
            console.log('🖥️ Calling API with query:', query);

            const response = await fetch(buildApiUrl('/api/chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message: query }),
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ API response received:', data);
            this.isReadyState = true;

            return data;

        } catch (error) {
            console.error('❌ API call failed:', error.message);
            this.markServerUnavailable();
            return null;
        }
    }

    async callClientService(query) {
        try {
            return await clientChatService.processQuery(query);
        } catch (error) {
            console.warn('Client-side service failed:', error);
            return null;
        }
    }

    normalizeResponse(payload, defaultSource = 'AssistMe') {
        if (!payload) return null;

        if (typeof payload === 'string') {
            return {
                answer: payload,
                type: 'general',
                confidence: 0.3,
                source: defaultSource,
                providers: []
            };
        }

        return {
            answer: payload.answer ?? payload.text ?? '',
            type: payload.type || 'general',
            confidence: typeof payload.confidence === 'number' ? payload.confidence : 0.5,
            source: payload.source || defaultSource,
            providers: Array.isArray(payload.providers) ? payload.providers : [],
            processingTime: payload.processingTime
        };
    }

    isMeaningfulResponse(response) {
        if (!response || !response.answer) return false;
        if (this.isGenericFallback(response.answer)) return false;
        if (response.type && response.type !== 'general') return true;
        return (response.confidence ?? 0) >= 0.55;
    }

    isGenericFallback(answer) {
        if (!answer) return true;
        const lower = String(answer).toLowerCase();
        return lower.includes("i can help with information about mangesh raut's portfolio") ||
               lower.includes("i'm still learning") ||
               lower.includes('technical difficulties') ||
               lower.includes('try rephrasing');
    }

    chooseBestResponse(responses = []) {
        const valid = responses.filter(Boolean);
        if (!valid.length) return null;
        return valid.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0] || valid[0];
    }

    basicQueryProcessing(query) {
        const result = {
            answer: '',
            type: 'general',
            confidence: 0.3,
            source: 'AssistMe',
            providers: []
        };

        const lower = query.toLowerCase();

        if (lower.includes('hello') || lower.includes('hi')) {
            result.answer = this.defaultGreetings[Math.floor(Math.random() * this.defaultGreetings.length)];
            result.type = 'greeting';
            return result;
        }

        if (lower.includes('portfolio') || lower.includes('work')) {
            result.answer = 'Mangesh is a Software Engineer specializing in Java Spring Boot, AngularJS, AWS, and machine learning. Check out his GitHub: github.com/mangeshraut712';
            result.type = 'portfolio';
            return result;
        }

        if (lower.includes('contact') || lower.includes('email')) {
            result.answer = 'You can reach Mangesh at mbr63@drexel.edu or connect on LinkedIn: linkedin.com/in/mangeshraut71298';
            result.type = 'portfolio';
            return result;
        }

        result.answer = 'I\'m here to help! Ask me about Mangesh\'s skills, experience, or general questions.';
        return result;
    }

    generateFallbackResponse(query, error) {
        const fallbackResponses = [
            "I'm experiencing some technical difficulties. Please try again in a moment.",
            "Sorry, I couldn't process that right now. Feel free to try a different question!",
            "I'm having trouble connecting right now. Please check your internet and try again."
        ];

        return {
            answer: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
            type: 'fallback',
            confidence: 0.2,
            source: 'AssistMe',
            providers: []
        };
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

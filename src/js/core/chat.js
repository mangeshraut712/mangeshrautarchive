import { localConfig } from './config.js';

let API_BASE = '';

if (typeof window !== 'undefined') {
    if (window.APP_CONFIG?.apiBaseUrl) {
        API_BASE = window.APP_CONFIG.apiBaseUrl;
    } else {
        const hostname = window.location.hostname || '';
        // Use LOCAL API if running on localhost with local server
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            API_BASE = ''; // This will use relative paths to local server
        }
        // Use DEPLOYED API for Vercel production
        else if (hostname.endsWith('.vercel.app')) {
            API_BASE = `https://${hostname}`;
        }
        // Use custom API base if configured
        else if (localConfig.apiBaseUrl) {
            API_BASE = localConfig.apiBaseUrl;
        }
        // Otherwise, no API_BASE means offline mode for GitHub Pages
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

const SOURCE_KEY_ALIASES = {
    'assistme': 'assistme',
    'assistme server': 'assistme',
    'assistme client': 'assistme',
    'assistme portfolio': 'assistme-portfolio',
    'assistme chat': 'assistme',
    'assistme math': 'assistme-math',
    'assistme math engine': 'assistme-math',
    'assistme general': 'assistme',
    'assistme utility': 'assistme-utility',
    'portfolio': 'assistme-portfolio',
    'math': 'assistme-math',
    'openai': 'openai',
    'openai gpt': 'openai',
    'gpt': 'openai',
    'gpt-4': 'openai',
    'gpt-4o': 'openai',
    'gpt-35-turbo': 'openai',
    'gpt-3.5-turbo': 'openai',
    'anthropic': 'claude',
    'claude': 'claude',
    'claude ai': 'claude',
    'claude 3': 'claude',
    'sonnet': 'claude',
    'haiku': 'claude',
    'grok': 'grok',
    'xai grok': 'grok',
    'grok ai': 'grok',
    'x.ai': 'grok',
    'gemini': 'gemini',
    'google gemini': 'gemini',
    'duckduckgo': 'duckduckgo',
    'duck duck go': 'duckduckgo',
    'duckduckgo search': 'duckduckgo',
    'wikipedia': 'wikipedia',
    'wiki': 'wikipedia',
    'wikipedia.org': 'wikipedia',
    'stack overflow': 'stackoverflow',
    'stackoverflow': 'stackoverflow',
    'offline knowledge': 'offline',
    'offline knowledge base': 'offline',
    'offline': 'offline',
    'restcountries': 'country_facts',
    'country facts': 'country_facts',
    'perplexity': 'perplexity',
    'perplexity ai': 'perplexity',
    'huggingface': 'huggingface',
    'hugging face': 'huggingface',
    'openrouter': 'openrouter',
    'open router': 'openrouter',
    'local cache': 'assistme',
    'cached': 'assistme'
};

const SOURCE_LABELS = {
    'assistme': 'AssistMe Portfolio',
    'assistme-portfolio': 'AssistMe Portfolio',
    'assistme-math': 'AssistMe Math Engine',
    'assistme-utility': 'AssistMe Utility',
    'assistme-general': 'AssistMe',
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
        this.conversation = [];

        // Determine if we can use server AI services
        this.canUseServerAI = false;
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            this.canUseServerAI = hostname.endsWith('.vercel.app') ||
                                  hostname === 'localhost' ||
                                  hostname === '127.0.0.1' ||
                                  (hostname.includes('github.io') && localConfig.apiBaseUrl && localConfig.apiBaseUrl.includes('vercel.app'));
        }
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

        if (isGitHubPages) {
            console.log('🤖 GitHub Pages detected - checking API availability...');
            console.log('Current hostname:', hostname);
            console.log('Protocol:', window.location.protocol);
            console.log('API Base URL:', localConfig.apiBaseUrl);
            
            // GitHub Pages can still use Vercel API if configured
            if (localConfig.apiBaseUrl && localConfig.apiBaseUrl.includes('vercel.app')) {
                console.log('✅ Vercel API configured - hybrid mode enabled');
                this.canUseServerAI = true;
                this.isReadyState = true;
                return true; // API is available
            } else {
                console.log('📴 No API configured - offline mode only');
                this.isReadyState = true;
                return false;
            }
        }
        
        if (!navigator.onLine) {
            console.log('📴 Offline mode - no network connection');
            this.isReadyState = true;
            return false;
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
            const trimmed = question.trim();
            this._pushConversation('user', trimmed);

            // Process the query
            const response = await this.processQuery(trimmed);

            // Add response to history
            this.history[this.history.length - 1].response = response;
            this.history[this.history.length - 1].processingTime = Date.now() - this.history[this.history.length - 1].timestamp;

            const answerText = this._extractAnswerText(response);
            if (answerText) {
                this._pushConversation('assistant', answerText);
            }

            return response;

        } catch (error) {
            console.error('Error processing query:', error);
            const fallback = this.generateFallbackResponse(question, error);
            const fallbackText = this._extractAnswerText(fallback);
            if (fallbackText) {
                this._pushConversation('assistant', fallbackText);
            }
            return fallback;
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
        // Allow API calls from GitHub Pages if CORS is configured and API base URL is set
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const canCallServerAPI = this.canUseServerAI ||
            (hostname.includes('github.io') &&
             localConfig.apiBaseUrl &&
             localConfig.apiBaseUrl.includes('vercel.app'));

        if (!canCallServerAPI) {
            console.log('🔄 Skipping server API call - GitHub Pages running in hybrid mode');
            return null;
        }

        console.log('📡 API Base URL:', localConfig.apiBaseUrl);

        try {
            const apiUrl = buildApiUrl('/api/chat');
            console.log('🖥️ Calling API:', apiUrl);
            console.log('📤 Request payload:', { message: query.substring(0, 50) + '...' });

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    message: query,
                    messages: this._getConversationForServer()
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details');
                console.error(`❌ Server error ${response.status}: ${errorText}`);
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ API response received:', {
                source: data.source,
                type: data.type,
                confidence: data.confidence,
                answerLength: data.answer?.length || 0
            });
            this.isReadyState = true;

            return data;

        } catch (error) {
            console.error('❌ API call failed:', error.message);
            console.log('💡 Falling back to client-side processing');
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

    _pushConversation(role, content) {
        if (!content || typeof content !== 'string') return;
        const normalized = content.trim();
        if (!normalized) return;
        this.conversation.push({ role: role === 'assistant' ? 'assistant' : 'user', content: normalized });
        if (this.conversation.length > 16) {
            this.conversation.splice(0, this.conversation.length - 16);
        }
    }

    _extractAnswerText(response) {
        if (!response && response !== 0) return '';
        if (typeof response === 'string') return response.trim();
        if (typeof response === 'number') return String(response);
        if (response?.html && typeof response.html === 'string') return response.html.replace(/<[^>]+>/g, ' ').trim();
        if (response?.answer && typeof response.answer === 'string') return response.answer.trim();
        if (response?.text && typeof response.text === 'string') return response.text.trim();
        if (response?.content && typeof response.content === 'string') return response.content.trim();
        return '';
    }

    _getConversationForServer() {
        return this.conversation.slice(-12).map(entry => ({
            role: entry.role === 'assistant' ? 'assistant' : 'user',
            content: entry.content
        }));
    }

    normalizeResponse(payload, defaultSource = 'AssistMe') {
        if (!payload) return null;

        if (typeof payload === 'string') {
            const defaultKey = this.normalizeSourceKey(defaultSource) || 'assistme-general';
            return {
                answer: payload,
                type: 'general',
                confidence: 0.3,
                source: defaultKey,
                sourceLabel: this.getSourceLabelForKey(defaultKey, 'general'),
                sourceMessage: '',
                providers: [],
                processingTime: undefined
            };
        }

        const { key: sourceKey, label: sourceLabel } = this.identifySource(payload, defaultSource);
        const providerCandidates = [
            ...(Array.isArray(payload.providers) ? payload.providers : []),
            ...(Array.isArray(payload.consensus) ? payload.consensus : [])
        ];

        const result = {
            answer: payload.answer ?? payload.text ?? '',
            type: payload.type || 'general',
            confidence: typeof payload.confidence === 'number' ? payload.confidence : 0.5,
            source: sourceKey,
            sourceLabel,
            sourceMessage: payload.sourceMessage || '',
            providers: this.normalizeProviders(providerCandidates, sourceKey),
            processingTime: payload.processingTime
        };

        if (this.isGenericFallback(result.answer)) {
            result.source = 'assistme-general';
            result.sourceLabel = this.getSourceLabelForKey('assistme-general', result.type);
            result.providers = [];
            if (typeof result.confidence === 'number') {
                result.confidence = Math.min(result.confidence, 0.25);
            }
        }

        return result;
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
            source: 'assistme-general',
            sourceLabel: this.getSourceLabelForKey('assistme-general', 'general'),
            sourceMessage: '',
            providers: []
        };

        const lower = query.toLowerCase();

        if (lower.includes('hello') || lower.includes('hi')) {
            result.answer = this.defaultGreetings[Math.floor(Math.random() * this.defaultGreetings.length)];
            result.type = 'greeting';
            result.source = 'assistme-utility';
            result.sourceLabel = this.getSourceLabelForKey('assistme-utility', 'utility');
            return result;
        }

        if (lower.includes('portfolio') || lower.includes('work')) {
            result.answer = 'Mangesh is a Software Engineer specializing in Java Spring Boot, AngularJS, AWS, and machine learning. Check out his GitHub: github.com/mangeshraut712';
            result.type = 'portfolio';
            result.source = 'assistme-portfolio';
            result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
            return result;
        }

        if (lower.includes('contact') || lower.includes('email')) {
            result.answer = 'You can reach Mangesh at mbr63@drexel.edu or connect on LinkedIn: linkedin.com/in/mangeshraut71298';
            result.type = 'portfolio';
            result.source = 'assistme-portfolio';
            result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
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
            source: 'assistme-general',
            sourceLabel: this.getSourceLabelForKey('assistme-general', 'general'),
            sourceMessage: '',
            providers: []
        };
    }

    normalizeSourceKey(value) {
        if (value === undefined || value === null) return '';
        const trimmed = String(value).trim();
        if (!trimmed) return '';
        const lowered = trimmed.toLowerCase();
        if (SOURCE_KEY_ALIASES[lowered]) {
            return SOURCE_KEY_ALIASES[lowered];
        }
        return lowered.replace(/\s+/g, '-');
    }

    getSourceLabelForKey(sourceKey, type = 'general') {
        const normalized = this.normalizeSourceKey(sourceKey);
        if (!normalized) {
            if (type === 'portfolio') return SOURCE_LABELS['assistme-portfolio'];
            if (type === 'math') return SOURCE_LABELS['assistme-math'];
            if (type === 'utility') return SOURCE_LABELS['assistme-utility'];
            return SOURCE_LABELS['assistme-general'];
        }

        if (SOURCE_LABELS[normalized]) {
            return SOURCE_LABELS[normalized];
        }

        if (normalized === 'assistme' && type === 'portfolio') {
            return SOURCE_LABELS['assistme-portfolio'];
        }

        const words = normalized.split(/[-_]/g).filter(Boolean);
        if (!words.length) return SOURCE_LABELS['assistme-general'];

        return words
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    inferSourceFromAnswer(answer) {
        if (!answer || typeof answer !== 'string') return '';
        const lower = answer.toLowerCase();

        if (lower.includes('powered by openai')) return 'openai';
        if (lower.includes('powered by claude')) return 'claude';
        if (lower.includes('powered by grok')) return 'grok';
        if (lower.includes('powered by gemini')) return 'gemini';
        if (lower.includes('(source: wikipedia')) return 'wikipedia';
        if (lower.includes('(source: duckduckgo')) return 'duckduckgo';
        if (lower.includes('(source: stack overflow')) return 'stackoverflow';
        if (lower.includes('source: portfolio')) return 'assistme-portfolio';
        if (lower.includes('source: linkedin')) return 'assistme-portfolio';
        if (lower.includes('offline knowledge')) return 'offline';
        if (lower.includes('restcountries')) return 'country_facts';

        return '';
    }

    identifySource(payload, defaultSource = 'AssistMe') {
        const defaultKey = this.normalizeSourceKey(defaultSource) || 'assistme-general';

        let key = this.normalizeSourceKey(payload?.source);
        if (!key && payload?.origin) {
            key = this.normalizeSourceKey(payload.origin);
        }
        if (!key && payload?.provider) {
            key = this.normalizeSourceKey(payload.provider);
        }

        if (!key && Array.isArray(payload?.providers) && payload.providers.length > 0) {
            const primary = payload.providers[0];
            if (typeof primary === 'string') {
                key = this.normalizeSourceKey(primary);
            } else if (primary) {
                key = this.normalizeSourceKey(primary.provider || primary.name || primary.source);
            }
        }

        if (!key && Array.isArray(payload?.consensus) && payload.consensus.length > 0) {
            const primary = payload.consensus[0];
            if (typeof primary === 'string') {
                key = this.normalizeSourceKey(primary);
            } else if (primary) {
                key = this.normalizeSourceKey(primary.provider || primary.name || primary.source);
            }
        }

        if (!key) {
            const inferred = this.inferSourceFromAnswer(payload?.answer ?? payload?.text ?? '');
            if (inferred) {
                key = inferred;
            }
        }

        if (!key) {
            if (payload?.type === 'portfolio') {
                key = 'assistme-portfolio';
            } else if (payload?.type === 'math') {
                key = 'assistme-math';
            } else if (payload?.type === 'utility') {
                key = 'assistme-utility';
            } else if (payload?.type === 'general' || payload?.type === 'factual' || payload?.type === 'definition') {
                key = defaultKey || 'assistme-general';
            } else {
                key = defaultKey || 'assistme-general';
            }
        }

        const answerText = payload?.answer ?? payload?.text ?? '';
        if (this.isGenericFallback(answerText)) {
            key = 'assistme-general';
        }

        const label = this.getSourceLabelForKey(key, payload?.type);
        return { key, label };
    }

    normalizeProviders(providers = [], primaryKey = '') {
        if (!Array.isArray(providers) || providers.length === 0) {
            return [];
        }

        const normalized = [];
        const seen = new Set();
        const primaryNormalized = this.normalizeSourceKey(primaryKey);

        providers.forEach((entry) => {
            if (!entry) return;

            let key = '';
            let confidence = undefined;

            if (typeof entry === 'string') {
                key = this.normalizeSourceKey(entry);
            } else if (typeof entry === 'object') {
                key = this.normalizeSourceKey(
                    entry.provider || entry.name || entry.source || entry.id || entry.value
                );
                if (typeof entry.confidence === 'number') {
                    confidence = entry.confidence;
                }
            }

            if (!key) return;
            if (key === primaryNormalized) return;

            const label = this.getSourceLabelForKey(key);
            if (!label) return;

            const display = typeof confidence === 'number'
                ? `${label} (${Math.round(confidence * 100)}%)`
                : label;

            if (!seen.has(display)) {
                seen.add(display);
                normalized.push(display);
            }
        });

        return normalized;
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
        this.canUseServerAI = false;
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
        this.conversation = [];
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
        this.conversation = [];
        this.cache = null;

        console.log('Assistant destroyed and cleaned up');
    }
}

// Create and export the singleton instance
const intelligentAssistant = new IntelligentAssistant();

export { intelligentAssistant };
export { IntelligentAssistant };

// Initialize chatbot UI when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🤖 Initializing chatbot UI...');
        
        const chatToggle = document.getElementById('portfolio-chat-toggle');
        const chatWidget = document.getElementById('portfolio-chat-widget');
        const chatClose = document.getElementById('portfolio-chat-close');
        const chatForm = document.getElementById('portfolio-chat-form');
        const chatInput = document.getElementById('portfolio-chat-input');
        const chatMessages = document.getElementById('portfolio-chat-messages');
        
        if (!chatToggle || !chatWidget) {
            console.error('❌ Chatbot elements not found!');
            return;
        }
        
        console.log('✅ Chatbot elements found');
        
        // Toggle chatbot
        chatToggle.addEventListener('click', () => {
            console.log('💬 Chatbot toggle clicked');
            const isHidden = chatWidget.classList.contains('hidden');
            
            if (isHidden) {
                chatWidget.classList.remove('hidden');
                chatToggle.setAttribute('aria-expanded', 'true');
                chatInput?.focus();
                console.log('✅ Chatbot opened');
            } else {
                chatWidget.classList.add('hidden');
                chatToggle.setAttribute('aria-expanded', 'false');
                console.log('✅ Chatbot closed');
            }
        });
        
        // Close button
        if (chatClose) {
            chatClose.addEventListener('click', () => {
                console.log('❌ Close button clicked');
                chatWidget.classList.add('hidden');
                chatToggle.setAttribute('aria-expanded', 'false');
            });
        }
        
        // Handle chat form submission
        if (chatForm && chatInput && chatMessages) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const message = chatInput.value.trim();
                
                if (!message) return;
                
                console.log('📤 Sending message:', message);
                
                // Add user message to UI
                const userDiv = document.createElement('div');
                userDiv.className = 'message user-message';
                userDiv.textContent = message;
                chatMessages.appendChild(userDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Clear input
                chatInput.value = '';
                
                // Show loading
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'message bot-message loading';
                loadingDiv.innerHTML = '<span class="typing-indicator">●●●</span>';
                chatMessages.appendChild(loadingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                try {
                    // Call API
                    const apiUrl = localConfig.apiBaseUrl || 'https://mangeshrautarchive.vercel.app';
                    const response = await fetch(`${apiUrl}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    
                    const data = await response.json();
                    
                    // Remove loading
                    loadingDiv.remove();
                    
                    // Add bot response
                    const botDiv = document.createElement('div');
                    botDiv.className = 'message bot-message';
                    botDiv.innerHTML = `
                        <div class="message-text">${data.answer}</div>
                        <div class="message-metadata" style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.5rem;">
                            <span>${data.source || 'AI'}</span>
                            ${data.model ? ` • <span>${data.model}</span>` : ''}
                            ${data.category ? ` • <span>${data.category}</span>` : ''}
                            • <span>${data.runtime || (data.processingTime + 'ms')}</span>
                        </div>
                    `;
                    chatMessages.appendChild(botDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    console.log('✅ Response received:', data);
                    
                } catch (error) {
                    console.error('❌ Chat error:', error);
                    loadingDiv.remove();
                    
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'message bot-message error';
                    errorDiv.textContent = '⚠️ Failed to get response. Please try again.';
                    chatMessages.appendChild(errorDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            });
        }
        
        console.log('🎉 Chatbot initialized successfully!');
    });
}
export default intelligentAssistant;

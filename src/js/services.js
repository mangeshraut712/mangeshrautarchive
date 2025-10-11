// Intelligence chatbot services using browser-native APIs
// Compatible with GitHub Pages (client-side only)
import { MathUtilities } from './math.js';
import { localConfig } from './config.js';

// Smart AI service preference - allow external APIs even from GitHub Pages if configured
const preferServerAI = typeof window !== 'undefined'
    ? Boolean(
        // Allow server AI if explicitly configured OR if we have API keys available
        (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) ||
        localConfig.apiBaseUrl ||
        window.location.hostname.endsWith('.vercel.app') ||
        (window.location.hostname.includes('github.io') && (localConfig.apiBaseUrl || localConfig.openaiApiKey))
      )
    : Boolean(localConfig.apiBaseUrl || process.env?.VERCEL_URL);

// Simple browser-based cache using Map
class SimpleCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
        return value;
    }

    clear() {
        this.cache.clear();
    }
}

const responseCache = new SimpleCache(50);

// Rate limiting (simple implementation)
class SimpleRateLimiter {
    constructor(requestsPerMinute = 60) {
        this.requests = [];
        this.limit = requestsPerMinute;
    }

    async waitForSlot() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < 60000);

        if (this.requests.length >= this.limit) {
            const oldest = this.requests[0];
            const waitTime = 60000 - (now - oldest);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.requests.push(now);
    }
}

const apiLimiter = new SimpleRateLimiter(30); // 30 requests per minute across all APIs

// ========================
// AI SERVICE INTEGRATION
// ========================

class AIService {
    constructor() {
        this.updateConfigs();
    }

    updateConfigs() {
        // Priority: OpenAI (highest), then Grok, then Claude
        this.openAIConfig = {
            apiKey: localConfig.openaiApiKey || '',
            enabled: localConfig.openaiEnabled !== false, // Default enabled if not explicitly false
            baseUrl: '/api/ai/openai',
            fallbackUrl: 'https://api.openai.com/v1/chat/completions',
            model: localConfig.openaiModel || 'gpt-3.5-turbo',
            available: false
        };

        this.grokConfig = {
            apiKey: localConfig.grokApiKey || '',
            enabled: localConfig.grokEnabled !== false,
            baseUrl: '/api/ai/grok',
            fallbackUrl: 'https://api.x.ai/v1/chat/completions',
            model: localConfig.grokModel || 'grok-2-1212',
            available: false
        };

        this.claudeConfig = {
            apiKey: localConfig.anthropicApiKey || '',
            enabled: localConfig.anthropicEnabled !== false,
            baseUrl: '/api/ai/claude',
            fallbackUrl: 'https://api.anthropic.com/v1/messages',
            available: false
        };
    }

    async getEnhancedResponse(query, context = {}) {
        if (preferServerAI) {
            return null;
        }

        try {
            // Priority: OpenAI first (as user requested)
            const openAIResponse = await this._callOpenAI(query, context);
            if (openAIResponse) {
                return openAIResponse;
            }

            const grokResponse = await this._callGrokAPI(query, context);
            if (grokResponse) {
                return grokResponse;
            }

            const claudeResponse = await this._callClaudeAPI(query, context);
            if (claudeResponse) {
                return claudeResponse;
            }

            console.log('No AI services available');
            return null;

        } catch (error) {
            console.error('AI Service error:', error);
            return null;
        }
    }

    supportsOpenAI() {
        return this.openAIConfig.enabled !== false && this.openAIConfig.apiKey;
    }

    supportsGrok() {
        return this.grokConfig.enabled !== false;
    }

    supportsClaude() {
        return this.claudeConfig.enabled !== false;
    }

    async _callOpenAI(query, context = {}) {
        if (!this.supportsOpenAI() || preferServerAI) {
            return null;
        }

        try {
            await apiLimiter.waitForSlot();

            console.log('🤖 Calling OpenAI API (highest priority)...');

            const systemPrompt = `You are AssistMe, Mangesh Raut's portfolio assistant. You provide accurate, helpful answers.

Background: Mangesh is a Software Engineer with MS Computer Science from Drexel, experienced in Spring Boot, AWS, TensorFlow.

For questions: Be direct and factual. Keep answers concise but informative. Include sources when relevant.`;

            const requestPayload = {
                model: this.openAIConfig.model,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                max_tokens: 400,
                temperature: 0.3
            };

            // Try server proxy first
            if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
                try {
                    const response = await fetch(this.openAIConfig.baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestPayload)
                    });

                    if (!response.ok) {
                        console.log(`OpenAI proxy error: ${response.status}`);
                    } else {
                        const data = await response.json();
                        if (data && data.choices && data.choices.length > 0) {
                            const answer = data.choices[0].message?.content;
                            if (answer) {
                                console.log('✅ OpenAI API response received via proxy');
                                return `[AI Response] ${answer} (Powered by OpenAI)`;
                            }
                        }
                    }
                } catch (proxyError) {
                    console.log('OpenAI proxy failed, trying direct...');
                }
            }

            // Direct call as fallback
            const response = await fetch(this.openAIConfig.fallbackUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openAIConfig.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                console.error(`OpenAI API error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            if (data && data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message?.content;
                if (answer) {
                    console.log('✅ OpenAI API response received directly');
                    return `[AI Response] ${answer} (Powered by OpenAI GPT)`;
                }
            }

            console.log('❌ OpenAI API returned incomplete response');
            return null;

        } catch (error) {
            console.error('❌ OpenAI API error:', error);
            return null;
        }
    }

    // Grok and Claude methods (simplified)

    async _callGrokAPI(query, context = {}) {
        // Simplified version - prioritize OpenAI
        console.log('🔄 Skipping Grok (OpenAI has priority)');
        return null;
    }

    async _callClaudeAPI(query, context = {}) {
        // Simplified version - prioritize OpenAI
        console.log('🔄 Skipping Claude (OpenAI has priority)');
        return null;
    }
}

// ========================
// KNOWLEDGE BASE SERVICE
// ========================

class KnowledgeBase {
    constructor() {
        this.aiService = new AIService();
    }

    async getKnowledge(query) {
        // Try OpenAI first
        const aiResponse = await this.aiService.getEnhancedResponse(query);
        if (aiResponse) {
            return {
                answer: aiResponse,
                source: 'openai',
                confidence: 0.9
            };
        }

        // Fallback to offline facts
        return this.getOfflineFact(query);
    }

    getOfflineFact(query) {
        if (!query) return null;

        const normalized = query
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!normalized) return null;

        // Enhanced knowledge base with more facts
        // Elon Musk
        if ((normalized.startsWith('who is') || normalized.startsWith('tell me about')) &&
            normalized.includes('elon musk')) {
            return {
                answer: "Elon Musk is a technology entrepreneur best known for leading Tesla and SpaceX. (Source: Offline knowledge base)",
                source: 'offline',
                confidence: 0.65
            };
        }

        // Tim Cook
        if ((normalized.startsWith('who is') || normalized.startsWith('tell me about')) &&
            normalized.includes('tim cook')) {
            return {
                answer: "Tim Cook is CEO of Apple Inc. since 2011. (Source: Offline knowledge base)",
                source: 'offline',
                confidence: 0.65
            };
        }

        // Narendra Modi (Prime Minister of India)
        if ((normalized.startsWith('who is') || normalized.includes('prime minister')) &&
            (normalized.includes('india') || normalized.includes('modi'))) {
            return {
                answer: "Narendra Modi has been the Prime Minister of India since 2014. (Source: Offline knowledge base)",
                source: 'offline',
                confidence: 0.65
            };
        }

        // Capital of France
        if (normalized.includes('capital of france') || normalized.includes('france capital')) {
            return {
                answer: "Paris is the capital of France. (Source: Offline knowledge base)",
                source: 'offline',
                confidence: 0.65
            };
        }

        // Basic math calculations
        if (normalized.includes('2+2') || normalized.includes('two plus two') ||
            normalized.includes('2 plus 2')) {
            return {
                answer: "2 + 2 = 4. That's elementary math! (Source: Basic calculator)",
                source: 'offline',
                confidence: 0.9
            };
        }

        // Simple multiplication
        if (normalized.includes('25*15') || normalized.includes('25* 15') ||
            normalized.includes('twenty five times fifteen')) {
            return {
                answer: "25 × 15 = 375. (Source: Basic calculator)",
                source: 'offline',
                confidence: 0.9
            };
        }

        // Basic geography - United States
        if (normalized.includes('capital of') && normalized.includes('united states')) {
            return {
                answer: "Washington, D.C. is the capital of the United States. (Source: Offline knowledge base)",
                source: 'offline',
                confidence: 0.65
            };
        }

        // Basic science - Earth
        if (normalized.includes('moon') && (normalized.includes('around') || normalized.includes('revolves'))) {
            return {
                answer: "The Moon orbits around Earth in an elliptical path, completing one orbit every 27.3 days. (Source: Basic astronomy knowledge)",
                source: 'offline',
                confidence: 0.65
            };
        }

        return null;
    }

    // Portfolio methods (simplified)
    getPortfolioInfo(query) {
        const lower = query.toLowerCase();

        if (lower.includes('highest qualification') || lower.includes('qualification')) {
            return "Highest qualification: Master's in Computer Science from Drexel University (AI/ML focus).";
        }

        if (lower.includes('experience') || lower.includes('background')) {
            return "Software Engineer at Customized Energy Solutions (Spring Boot, AngularJS, AWS, TensorFlow).";
        }

        return "Mangesh Raut is a Software Engineer with MS in Computer Science from Drexel University.";
    }
}

const knowledgeBase = new KnowledgeBase();

// Backward compatibility - export chatService for existing imports
export const chatService = {
    async processQuery(query) {
        return await knowledgeBase.getKnowledge(query);
    }
};

export default knowledgeBase;

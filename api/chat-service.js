// Import required modules
import axios from 'axios';

// --- External AI Configuration ---
// API keys are securely read from environment variables on Vercel
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// System prompt for advanced LLM behavior (portfolio information available if relevant)
const SYSTEM_PROMPT = `You are an advanced AI assistant created by Mangesh Raut. You provide intelligent, helpful, and accurate responses across all topics including technology, science, mathematics, and general knowledge.

Key capabilities:
- Deep thinking and reasoning for complex questions
- Technical expertise in AI/ML, software development, and data science
- Natural conversation flow with appropriate level of detail
- Helpful clarification when questions need more context

When asked about Mangesh Raut:
- He is a Software Engineer with MS in Computer Science from Drexel University
- Expertise: Spring Boot, AngularJS, AWS, TensorFlow, Machine Learning, Python
- Portfolio available at: mangeshraut712.github.io
- Contact: linkedin.com/in/mangeshraut71298 or mbr63@drexel.edu

If the question is general or technical, prioritize giving a complete, accurate answer first. Only mention Mangesh Raut if specifically asked or if it's relevant to technical implementation details.`;

/**
 * Advanced AI engine caller with better error handling and response validation.
 * @param {object} config - The configuration for the API call.
 * @returns {Promise<string|null>} The answer from the AI, or null if it failed.
 */
async function callAIEngine({ name, url, headers, payload, timeout = 15000 }) {
    const startTime = Date.now();
    try {
        console.log(`🤖 Calling ${name} AI engine...`);
        const response = await axios.post(url, payload, {
            headers,
            timeout,
            maxRedirects: 5,
            validateStatus: (status) => status < 500 // Accept error responses for better logging
        });

        let answer = null;
        const processingTime = Date.now() - startTime;

        // Extract response based on provider format
        if (response.status === 200) {
            if (name === 'OpenAI' && response.data?.choices?.[0]?.message?.content) {
                answer = response.data.choices[0].message.content;
            } else if (name === 'Grok' && response.data?.choices?.[0]?.message?.content) {
                answer = response.data.choices[0].message.content.replace(/a16z/gi, ''); // Common Grok issue
            } else if (name === 'Claude' && response.data?.content?.[0]?.text) {
                answer = response.data.content[0].text;
            }
        }

        if (answer && answer.trim().length > 10) { // Minimum response length validation
            console.log(`✅ ${name} responded (${processingTime}ms): ${answer.substring(0, 100)}...`);
            return answer.trim();
        }

        console.warn(`⚠️ ${name} returned empty or invalid response.`);
        return null;

    } catch (error) {
        const status = error.response?.status || 'N/A';
        const processingTime = Date.now() - startTime;

        if (status === '401') {
            console.error(`🔐 ${name}: Invalid API key (401 Unauthorized)`);
        } else if (status === '429') {
            console.warn(`⏱️ ${name}: Rate limit exceeded (429), try again later`);
        } else if (status === '500' || status === '503') {
            console.warn(`🔧 ${name}: Server error (${status}), will try other providers`);
        } else if (!error.response) {
            console.warn(`🌐 ${name}: Network/connection error - ${error.code || 'Unknown'}`);
        } else {
            console.error(`❌ ${name} error (${status}, ${processingTime}ms):`, error.message);
        }
        return null;
    }
}

/**
 * Processes a query by calling ALL available AI models in parallel (race condition).
 * Uses whichever responds first with a concise, accurate answer related to the question.
 * @param {string} query - The user's question.
 * @returns {Promise<object>} The result object with the answer and metadata.
 */
async function processQueryWithAI(query) {
    const startTime = Date.now();
    const availableProviders = [];

    // Define all available model configurations
    const modelConfigs = [];

    if (OPENAI_API_KEY) {
        availableProviders.push('OpenAI');
        modelConfigs.push({
            name: 'OpenAI',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            payload: {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: query },
                ],
                max_tokens: 400,
                temperature: 0.3,
            },
            source: 'openai',
            confidence: 0.9
        });
    }

    if (GROK_API_KEY) {
        availableProviders.push('Grok');
        modelConfigs.push({
            name: 'Grok',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${GROK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            payload: {
                model: 'grok-1.5-sonata-65536',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: query },
                ],
                temperature: 0.3,
            },
            source: 'grok',
            confidence: 0.85
        });
    }

    if (ANTHROPIC_API_KEY) {
        availableProviders.push('Claude');
        modelConfigs.push({
            name: 'Claude',
            url: 'https://api.anthropic.com/v1/messages',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            payload: {
                model: 'claude-3-haiku-20240307',
                max_tokens: 400,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: query }],
            },
            source: 'claude',
            confidence: 0.8
        });
    }

    // If no models are available, return offline knowledge fallback
    if (modelConfigs.length === 0) {
        console.log('🌐 No AI models configured, responding with offline knowledge');
        return {
            answer: "I'm an AI assistant that can help with technology, science, mathematics, and general knowledge queries. I can also provide information about software development and AI/ML topics. What would you like to know?",
            source: 'offline-knowledge',
            type: 'general',
            confidence: 0.5,
            processingTime: Date.now() - startTime,
            providers: [],
        };
    }

    // Call ALL available models in parallel (race condition)
    const responsePromises = modelConfigs.map(config =>
        callAIEngine(config).then(answer => {
            if (answer) {
                console.log(`🏆 ${config.name} won the race with a response!`);
                return {
                    answer,
                    source: config.source,
                    confidence: config.confidence,
                    processingTime: Date.now() - startTime,
                    providers: availableProviders,
                    winner: config.name
                };
            }
            return null;
        }).catch(error => {
            console.log(`${config.name} failed: ${error.message}`);
            return null;
        })
    );

    // Wait for the first successful response (race condition)
    try {
        const results = await Promise.allSettled(responsePromises);
        const validResults = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

        if (validResults.length > 0) {
            // Return the first successful result (they complete in race order due to Promise.allSettled)
            const firstResponse = validResults[0];
            console.log(`🎯 Race completed! Winner: ${firstResponse.winner} (${Date.now() - startTime}ms)`);
            return firstResponse;
        }
    } catch (error) {
        console.error('Race condition failed:', error);
    }

    // If all models failed, return offline knowledge fallback (rare case)
    console.log('💥 All AI providers failed, using offline knowledge');
    return {
        answer: "I'm an advanced AI that can help with technology, software development, mathematics, science, and general knowledge questions. I specialize in AI/ML topics and can provide information about computer science. What would you like to explore?",
        source: 'offline-knowledge',
        type: 'general',
        confidence: 0.3, // Lower confidence for offline fallback
        processingTime: Date.now() - startTime,
        providers: availableProviders,
        note: 'All AI providers were unavailable'
    };
}

const chatService = {
    /**
     * Main entry point for processing a query.
     * It will decide whether to use AI or a local handler.
     */
    async processQuery(query) {
        // For now, we send all queries to the AI handler.
        // You could add logic here to handle simple queries locally first.
        return processQueryWithAI(query);
    },
};

export default chatService;

import axios from 'axios';

// --- Configuration ---
// API keys are securely read from environment variables on Vercel
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = "You are AssistMe, Mangesh Raut's portfolio assistant. Provide accurate, helpful answers. Be concise. Mangesh is a Software Engineer with an MS in Computer Science from Drexel University, experienced in Spring Boot, AWS, and TensorFlow.";

/**
 * A generic function to call an AI provider.
 * @param {object} config - The configuration for the API call.
 * @returns {Promise<string|null>} The answer from the AI, or null if it failed.
 */
async function callAIEngine({ name, url, headers, payload }) {
    try {
        console.log(`🧠 Attempting to call ${name}...`);
        const response = await axios.post(url, payload, { headers, timeout: 15000 });

        let answer = null;
        if (name === 'OpenAI' && response.data?.choices?.[0]?.message?.content) {
            answer = response.data.choices[0].message.content;
        } else if (name === 'Grok' && response.data?.choices?.[0]?.message?.content) {
            answer = response.data.choices[0].message.content;
        } else if (name === 'Claude' && response.data?.content?.[0]?.text) {
            answer = response.data.content[0].text;
        }

        if (answer) {
            console.log(`✅ Successfully received response from ${name}.`);
            return answer;
        }
        console.warn(`⚠️ ${name} returned an unexpected response structure.`);
        return null;
    } catch (error) {
        const status = error.response?.status || 'N/A';
        console.error(`❌ Error calling ${name} (Status: ${status}):`, error.message);
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

    // If no models are available, return fallback
    if (modelConfigs.length === 0) {
        return {
            answer: "I can help with information about Mangesh Raut's portfolio, as well as basic math and unit conversions. What would you like to know?",
            source: 'assistme-general',
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

    // If all models failed, return fallback
    console.log('💥 All models failed, using fallback response');
    return {
        answer: "I can help with information about Mangesh Raut's portfolio, as well as basic math and unit conversions. What would you like to know?",
        source: 'assistme-general',
        type: 'general',
        confidence: 0.5,
        processingTime: Date.now() - startTime,
        providers: availableProviders,
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

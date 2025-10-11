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
 * Processes a query by trying different AI models in a specific order.
 * This is the "auto mode" implementation.
 * @param {string} query - The user's question.
 * @returns {Promise<object>} The result object with the answer and metadata.
 */
async function processQueryWithAI(query) {
    const startTime = Date.now();
    const providersTried = [];

    // --- 1. Try OpenAI (Highest Priority) ---
    if (OPENAI_API_KEY) {
        providersTried.push('OpenAI');
        const answer = await callAIEngine({
            name: 'OpenAI',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            payload: {
                model: 'gpt-4o', // Or 'gpt-3.5-turbo'
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: query },
                ],
                max_tokens: 400,
                temperature: 0.3,
            },
        });
        if (answer) {
            return {
                answer,
                source: 'openai',
                confidence: 0.9,
                processingTime: Date.now() - startTime,
                providers: providersTried,
            };
        }
    }

    // --- 2. Fallback to Grok ---
    if (GROK_API_KEY) {
        providersTried.push('Grok');
        const answer = await callAIEngine({
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
        });
        if (answer) {
            return {
                answer,
                source: 'grok',
                confidence: 0.85,
                processingTime: Date.now() - startTime,
                providers: providersTried,
            };
        }
    }
    
    // --- 3. Fallback to Claude (Haiku) ---
    if (ANTHROPIC_API_KEY) {
        providersTried.push('Claude');
        const answer = await callAIEngine({
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
        });
        if (answer) {
            return {
                answer,
                source: 'claude',
                confidence: 0.8,
                processingTime: Date.now() - startTime,
                providers: providersTried,
            };
        }
    }

    // --- Final Fallback ---
    return {
        answer: "I can help with information about Mangesh Raut's portfolio, as well as basic math and unit conversions. What would you like to know?",
        source: 'assistme-general',
        type: 'general',
        confidence: 0.5,
        processingTime: Date.now() - startTime,
        providers: providersTried,
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
// Direct test of all APIs with simple question
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const GROK_API_KEY = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();
    const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
    const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();

    const results = {
        timestamp: new Date().toISOString(),
        tests: {}
    };

    // Test Grok
    if (GROK_API_KEY) {
        try {
            console.log('Testing Grok...');
            const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'grok-beta',
                    messages: [{ role: 'user', content: 'Say hello in 3 words' }],
                    stream: false,
                    max_tokens: 50
                })
            });

            if (grokResponse.ok) {
                const data = await grokResponse.json();
                results.tests.grok = {
                    status: 'SUCCESS',
                    response: data?.choices?.[0]?.message?.content || 'No content',
                    httpStatus: grokResponse.status
                };
            } else {
                const error = await grokResponse.text();
                results.tests.grok = {
                    status: 'FAILED',
                    error: error.substring(0, 300),
                    httpStatus: grokResponse.status
                };
            }
        } catch (error) {
            results.tests.grok = {
                status: 'ERROR',
                error: error.message
            };
        }
    } else {
        results.tests.grok = { status: 'NO_KEY' };
    }

    // Test Gemini
    if (GEMINI_API_KEY) {
        try {
            console.log('Testing Gemini...');
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Say hello in 3 words' }] }]
                })
            });

            if (geminiResponse.ok) {
                const data = await geminiResponse.json();
                results.tests.gemini = {
                    status: 'SUCCESS',
                    response: data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content',
                    httpStatus: geminiResponse.status
                };
            } else {
                const error = await geminiResponse.text();
                results.tests.gemini = {
                    status: 'FAILED',
                    error: error.substring(0, 300),
                    httpStatus: geminiResponse.status
                };
            }
        } catch (error) {
            results.tests.gemini = {
                status: 'ERROR',
                error: error.message
            };
        }
    } else {
        results.tests.gemini = { status: 'NO_KEY' };
    }

    // Test OpenRouter
    if (OPENROUTER_API_KEY) {
        try {
            console.log('Testing OpenRouter...');
            const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://mangeshrautarchive.vercel.app'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.1-8b-instruct:free',
                    messages: [{ role: 'user', content: 'Say hello in 3 words' }]
                })
            });

            if (orResponse.ok) {
                const data = await orResponse.json();
                results.tests.openrouter = {
                    status: 'SUCCESS',
                    response: data?.choices?.[0]?.message?.content || 'No content',
                    httpStatus: orResponse.status
                };
            } else {
                const error = await orResponse.text();
                results.tests.openrouter = {
                    status: 'FAILED',
                    error: error.substring(0, 300),
                    httpStatus: orResponse.status
                };
            }
        } catch (error) {
            results.tests.openrouter = {
                status: 'ERROR',
                error: error.message
            };
        }
    } else {
        results.tests.openrouter = { status: 'NO_KEY' };
    }

    res.status(200).json(results);
}

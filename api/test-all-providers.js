/**
 * Test All API Providers - Find Best Working Key
 * Tests all 8 API keys configured in Vercel
 */

// All API keys from Vercel environment
const API_KEYS = {
    openrouter: process.env.OPENROUTER_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    grok: process.env.GROK_API_KEY || process.env.XAI_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
    groq: process.env.GROQ_API_KEY
};

const TEST_QUESTION = "What is 2+2? Answer briefly.";

// Test OpenRouter
async function testOpenRouter() {
    if (!API_KEYS.openrouter) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.openrouter}`,
                'HTTP-Referer': 'https://mangeshrautarchive.vercel.app'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini:free',
                messages: [{ role: 'user', content: TEST_QUESTION }],
                max_tokens: 100
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'fast',
            quality: answer?.length > 5 ? 'good' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test Gemini
async function testGemini() {
    if (!API_KEYS.gemini) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEYS.gemini}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: TEST_QUESTION }] }]
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'fast',
            quality: answer?.length > 5 ? 'excellent' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test Anthropic (Claude)
async function testAnthropic() {
    if (!API_KEYS.anthropic) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEYS.anthropic,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 100,
                messages: [{ role: 'user', content: TEST_QUESTION }]
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.content?.[0]?.text;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'fast',
            quality: answer?.length > 5 ? 'excellent' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test Grok (xAI)
async function testGrok() {
    if (!API_KEYS.grok) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.grok}`
            },
            body: JSON.stringify({
                model: 'grok-beta',
                messages: [{ role: 'user', content: TEST_QUESTION }],
                max_tokens: 100
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'medium',
            quality: answer?.length > 5 ? 'excellent' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test Perplexity
async function testPerplexity() {
    if (!API_KEYS.perplexity) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.perplexity}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [{ role: 'user', content: TEST_QUESTION }],
                max_tokens: 100
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'fast',
            quality: answer?.length > 5 ? 'excellent' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test OpenAI
async function testOpenAI() {
    if (!API_KEYS.openai) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.openai}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: TEST_QUESTION }],
                max_tokens: 100
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'fast',
            quality: answer?.length > 5 ? 'excellent' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test Groq (very fast inference)
async function testGroq() {
    if (!API_KEYS.groq) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.groq}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: TEST_QUESTION }],
                max_tokens: 100
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'very-fast',
            quality: answer?.length > 5 ? 'good' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test HuggingFace
async function testHuggingFace() {
    if (!API_KEYS.huggingface) return { working: false, error: 'No API key' };
    
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEYS.huggingface}`
            },
            body: JSON.stringify({
                inputs: TEST_QUESTION,
                parameters: { max_new_tokens: 100 }
            })
        });
        
        if (!response.ok) return { working: false, error: `HTTP ${response.status}` };
        
        const data = await response.json();
        const answer = data?.[0]?.generated_text || data?.generated_text;
        
        return {
            working: true,
            answer: answer?.trim(),
            responseTime: 'slow',
            quality: answer?.length > 5 ? 'fair' : 'poor'
        };
    } catch (error) {
        return { working: false, error: error.message };
    }
}

// Test all providers
async function testAllProviders() {
    console.log('🧪 Testing all 8 API providers...');
    
    const results = {
        openrouter: await testOpenRouter(),
        gemini: await testGemini(),
        anthropic: await testAnthropic(),
        grok: await testGrok(),
        perplexity: await testPerplexity(),
        openai: await testOpenAI(),
        groq: await testGroq(),
        huggingface: await testHuggingFace()
    };
    
    // Log results
    for (const [provider, result] of Object.entries(results)) {
        if (result.working) {
            console.log(`✅ ${provider}: WORKING - ${result.answer?.substring(0, 50)}...`);
        } else {
            console.log(`❌ ${provider}: FAILED - ${result.error}`);
        }
    }
    
    // Find best provider
    const working = Object.entries(results)
        .filter(([_, r]) => r.working)
        .sort((a, b) => {
            const qualityScore = { excellent: 3, good: 2, fair: 1, poor: 0 };
            const speedScore = { 'very-fast': 3, fast: 2, medium: 1, slow: 0 };
            
            const scoreA = (qualityScore[a[1].quality] || 0) + (speedScore[a[1].responseTime] || 0);
            const scoreB = (qualityScore[b[1].quality] || 0) + (speedScore[b[1].responseTime] || 0);
            
            return scoreB - scoreA;
        });
    
    return {
        results,
        working: working.map(([name]) => name),
        best: working[0]?.[0] || null,
        summary: `${working.length}/8 providers working`
    };
}

// API endpoint to test all providers
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const testResults = await testAllProviders();
        
        return res.status(200).json({
            success: true,
            testResults,
            recommendation: testResults.best,
            apiKeysConfigured: Object.entries(API_KEYS)
                .filter(([_, key]) => key && key.length > 10)
                .map(([name]) => name)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

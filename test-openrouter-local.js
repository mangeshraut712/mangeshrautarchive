// Local test of OpenRouter with google/gemini-2.0-flash-001
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const MODEL = 'google/gemini-2.0-flash-001';

async function testOpenRouter(question, category) {
    console.log(`\n🧪 Testing: "${question}"`);
    console.log(`📂 Category: ${category}`);
    
    const start = Date.now();
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://mangeshrautarchive.vercel.app',
                'X-Title': 'AssistMe AI Test'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'user', content: question }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const elapsed = Date.now() - start;

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Error ${response.status}:`, errorText.substring(0, 200));
            return;
        }

        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;

        console.log(`✅ Success (${elapsed}ms)`);
        console.log(`📊 Response:`);
        console.log(JSON.stringify({
            answer: answer?.substring(0, 200) + (answer?.length > 200 ? '...' : ''),
            source: 'OpenRouter',
            model: 'Gemini 2.0 Flash',
            category: category,
            confidence: category === 'portfolio' ? 0.95 : 0.90,
            runtime: elapsed + 'ms'
        }, null, 2));

    } catch (error) {
        console.error(`❌ Exception:`, error.message);
    }
}

async function runTests() {
    console.log('🚀 Testing OpenRouter with Gemini 2.0 Flash\n');
    console.log(`🔑 API Key: ${OPENROUTER_API_KEY ? 'Found ✓' : 'Missing ✗'}`);
    console.log(`🤖 Model: ${MODEL}\n`);
    
    if (!OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY not set!');
        process.exit(1);
    }

    // Test cases
    await testOpenRouter('What is 15 + 27?', 'math');
    await testOpenRouter('What is artificial intelligence?', 'general');
    await testOpenRouter('Explain quantum computing in one sentence', 'technical');
    await testOpenRouter('How do I reverse a string in Python?', 'coding');
    
    console.log('\n✅ All tests completed!');
}

runTests();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
    const MODEL = 'google/gemini-2.0-flash-001';

    console.log('🔍 Testing OpenRouter directly...');
    console.log(`🔑 API Key present: ${!!OPENROUTER_API_KEY}`);
    console.log(`📦 Model: ${MODEL}`);

    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({
            error: 'OPENROUTER_API_KEY not found',
            model: MODEL
        });
    }

    try {
        const testMessage = req.body?.message || "What is 5+5? Answer in one short sentence.";
        
        console.log(`💬 Test message: ${testMessage}`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://mangeshrautarchive.vercel.app',
                'X-Title': 'AssistMe Test'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'user', content: testMessage }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        console.log(`📡 Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error: ${errorText}`);
            return res.status(response.status).json({
                error: 'OpenRouter request failed',
                status: response.status,
                details: errorText.substring(0, 500),
                model: MODEL
            });
        }

        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;

        console.log(`✅ Success! Answer: ${answer?.substring(0, 100)}`);

        return res.status(200).json({
            success: true,
            model: MODEL,
            answer: answer,
            timestamp: new Date().toISOString(),
            message: 'OpenRouter with Google Gemini 2.0 Flash is WORKING! 🎉'
        });
    } catch (error) {
        console.error(`❌ Exception: ${error.message}`);
        return res.status(500).json({
            error: 'Exception occurred',
            message: error.message,
            model: MODEL
        });
    }
}

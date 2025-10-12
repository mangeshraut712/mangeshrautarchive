export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(200).json({
        version: 'SIMPLIFIED-OPENROUTER-ONLY',
        model: 'google/gemini-2.0-flash-001',
        timestamp: new Date().toISOString(),
        providers: ['OpenRouter'],
        message: 'Using ONLY OpenRouter with Google Gemini 2.0 Flash'
    });
}

// Test endpoint to verify environment variables are accessible
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const GROK_API_KEY = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();
    const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
    const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();

    const response = {
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || 'unknown',
        keys: {
            grok: {
                found: !!GROK_API_KEY,
                length: GROK_API_KEY.length,
                prefix: GROK_API_KEY.substring(0, 4),
                valid: GROK_API_KEY.startsWith('xai-')
            },
            gemini: {
                found: !!GEMINI_API_KEY,
                length: GEMINI_API_KEY.length,
                prefix: GEMINI_API_KEY.substring(0, 4),
                valid: GEMINI_API_KEY.startsWith('AIza')
            },
            openrouter: {
                found: !!OPENROUTER_API_KEY,
                length: OPENROUTER_API_KEY.length,
                prefix: OPENROUTER_API_KEY.substring(0, 5),
                valid: OPENROUTER_API_KEY.startsWith('sk-or-')
            }
        },
        allEnvVars: Object.keys(process.env).filter(k => 
            k.includes('API') || k.includes('GROK') || k.includes('GEMINI') || k.includes('XAI')
        )
    };

    res.status(200).json(response);
}

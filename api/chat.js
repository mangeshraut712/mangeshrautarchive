import chatService from './chat-service.js';

function applyCors(res, origin) {
    const allowedOrigins = [
        'https://mangeshraut712.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
        if (origin === allowed) return true;
        if (allowed === 'https://mangeshraut712.github.io' && origin && origin.startsWith('https://mangeshraut712.github.io')) {
            return true;
        }
        return false;
    });
    
    if (origin && isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://mangeshraut712.github.io');
    }
    
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
    applyCors(res, req.headers.origin);

    if (req.method === 'OPTIONS') {
        console.log('✅ CORS preflight handled');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        console.log('❌ Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('📨 Chat request received');

    try {
        const { message, messages } = req.body ?? {};

        if (!message || typeof message !== 'string') {
            console.log('❌ Invalid message');
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            console.log('❌ Empty message');
            return res.status(400).json({
                error: 'Message cannot be empty'
            });
        }

        console.log('💬 Processing:', trimmedMessage.substring(0, 100));

        const result = await chatService.processQuery({ 
            message: trimmedMessage, 
            messages: messages || [] 
        });

        res.setHeader('Content-Type', 'application/json');

        console.log('✅ Response:', {
            source: result.source,
            confidence: result.confidence,
            length: result.answer?.length || 0
        });

        return res.status(200).json({
            answer: result.answer,
            source: result.source || 'OpenRouter',
            model: result.model || 'Gemini 2.0 Flash',
            category: result.category || 'General',
            confidence: result.confidence,
            runtime: result.runtime || (result.processingTime + 'ms'),
            // Legacy fields for compatibility
            type: result.type || 'general',
            processingTime: result.processingTime,
            providers: result.providers || ['OpenRouter']
        });
    } catch (error) {
        console.error('❌ Chat error:', error);

        res.setHeader('Content-Type', 'application/json');

        return res.status(500).json({
            error: 'Internal server error',
            message: 'I\'m experiencing technical difficulties. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

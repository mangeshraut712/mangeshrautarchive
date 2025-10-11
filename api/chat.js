import chatService from './chat-service.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body ?? {};

        if (!message || typeof message !== 'string') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const trimmedMessage = message.trim();
        const result = await chatService.processQuery(trimmedMessage);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        return res.status(200).json({
            answer: result.answer,
            type: result.type,
            confidence: result.confidence,
            processingTime: result.processingTime,
            source: result.source,
            providers: result.providers,
            mcpEnhanced: false
        });
    } catch (error) {
        console.error('Chat API error:', error);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        try {
            const fallbackResult = await chatService.processQuery(
                `${req.body?.message || ''} (error occurred, please provide a simplified response)`
            );

            if (fallbackResult) {
                return res.status(200).json({
                    answer: `🤖 ${fallbackResult.answer} (Note: There was an issue with advanced processing, so you received a basic response)`,
                    type: 'fallback',
                    confidence: 0.5,
                    processingTime: fallbackResult.processingTime,
                    source: fallbackResult.source || 'AssistMe',
                    providers: fallbackResult.providers || [],
                    error: true
                });
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }

        return res.status(500).json({
            error: 'Internal server error',
            message: 'I\'m experiencing technical difficulties. Please try again in a moment.'
        });
    }
}

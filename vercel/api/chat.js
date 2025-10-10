import { chatService } from './chat-service.js';

// Vercel serverless function for chat processing
export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    const trimmedMessage = message.trim();
    console.log(`🎯 Processing query: "${trimmedMessage}"`);

    // Process the query using the chat service
    const result = await chatService.processQuery(trimmedMessage);

    // Set CORS headers for the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      answer: result.answer,
      type: result.type,
      confidence: result.confidence,
      processingTime: result.processingTime,
      mcpEnhanced: false
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);

    // Set CORS headers for error response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    // Try to provide a helpful fallback response
    try {
      const fallbackResult = await chatService.processQuery(
        (req.body?.message || 'error occurred') + ' (error occurred, please provide a simplified response)'
      );

      if (fallbackResult) {
        return res.status(200).json({
          answer: `🤖 ${fallbackResult.answer} (Note: There was an issue with advanced processing, so you received a basic response)`,
          type: 'fallback',
          confidence: 0.5,
          processingTime: fallbackResult.processingTime,
          error: true
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'I\'m experiencing technical difficulties. Please try again in a moment.'
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * CHAT API ENDPOINT
 * OpenRouter + Gemini 2.0 Flash ONLY
 * Returns proper response format
 * ═══════════════════════════════════════════════════════════
 */

import chatService from './chat-service.js';

/**
 * Apply CORS headers
 */
function applyCors(res, origin) {
  const allowedOrigins = [
    'https://mangeshraut712.github.io',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:3000'
  ];

  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Apply CORS
  applyCors(res, req.headers.origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST method'
    });
  }

  try {
    // Get message from request
    const { message, messages } = req.body ?? {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required'
      });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message cannot be empty'
      });
    }

    console.log(`📨 Received: "${trimmedMessage}"`);

    // Process query through chat service
    const result = await chatService.processQuery({
      message: trimmedMessage,
      messages: messages || []
    });

    console.log(`✅ Response: ${result.source} | ${result.model} | ${result.category}`);

    // Return standardized response format
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      answer: result.answer,
      source: result.source,           // "OpenRouter"
      model: result.model,              // "Gemini 2.0 Flash"
      category: result.category,        // "Mathematics", "Portfolio", etc.
      confidence: result.confidence,    // 0.90
      runtime: result.runtime,          // "450ms"
      
      // Legacy fields for backward compatibility
      type: result.type || 'general',
      processingTime: result.processingTime || 0,
      providers: result.providers || [result.source]
    });

  } catch (error) {
    console.error('❌ API Error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request',
      answer: '⚠️ Something went wrong. Please try again.',
      source: 'Error',
      model: 'None',
      category: 'Error',
      confidence: 0,
      runtime: '0ms'
    });
  }
}

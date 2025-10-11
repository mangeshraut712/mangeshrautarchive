import { chatService } from './chat-service.js';

export default function handler(req, res) {
  // Add CORS headers for GitHub Pages and Local Development
  const allowedOrigins = [
    'https://mangeshraut712.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const enabledProviders = chatService.multiModelService.getEnabledProviders();
    const status = {
      grok: {
        available: enabledProviders.includes('grok'),
      },
      anthropic: {
        available: enabledProviders.includes('anthropic'),
      },
      perplexity: {
        available: enabledProviders.includes('perplexity'),
      },
      gemini: {
        available: enabledProviders.includes('gemini'),
      },
      huggingface: {
        available: enabledProviders.includes('huggingface'),
      },
    };

    res.status(200).json(status);
  } catch (error) {
    console.error('Status API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Status check failed'
    });
  }
}

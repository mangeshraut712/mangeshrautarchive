export default function handler(req, res) {
  // Add comprehensive CORS headers for all environments
  const allowedOrigins = [
    'https://mangeshraut712.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://mangeshraut712.github.io/mangeshrautarchive'
  ];

  const origin = req.headers.origin;
  // Allow any HTTP/HTTPS localhost for development
  if (origin && (allowedOrigins.includes(origin) ||
                 origin.startsWith('http://localhost:') ||
                 origin.startsWith('https://localhost:') ||
                 origin.startsWith('http://127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (req.headers['user-agent'] && req.headers['user-agent'].includes('curl')) {
    // Allow curl requests for testing (no origin header)
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && (
    origin.includes('vercel.app') ||
    origin.includes('github.io') ||
    origin.includes('netlify.app') ||
    origin.includes('surge.sh')
  )) {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    // Check availability based on environment variables
    const status = {
      grok: {
        available: !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
      },
      anthropic: {
        available: !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
      },
      perplexity: {
        available: !!process.env.PERPLEXITY_API_KEY,
      },
      gemini: {
        available: !!process.env.GEMINI_API_KEY,
      },
      huggingface: {
        available: !!process.env.HUGGINGFACE_API_KEY,
      },
      openai: {
        available: !!(process.env.OPENAI_API_KEY || process.env.GPT_API_KEY),
      },
    };

    // Force response format compatibility
    const response = {
      ...status,
      timestamp: new Date().toISOString(),
      server: 'local',
      version: '1.0'
    };

    console.log('📊 API Status Check:', {
      environment: process.env.NODE_ENV || 'development',
      providers: Object.entries(response).filter(([k, v]) => typeof v === 'boolean' || typeof v === 'object').map(([name, data]) => `${name}: ${data.available !== undefined ? (data.available ? '✅' : '❌') : 'N/A'}`),
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Status API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Status check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

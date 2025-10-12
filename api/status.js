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
    // Check availability based on environment variables
    const status = {
      grok: {
        available: !!process.env.GROK_API_KEY || !!process.env.XAI_API_KEY,
      },
      anthropic: {
        available: !!process.env.ANTHROPIC_API_KEY || !!process.env.CLAUDE_API_KEY,
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
        available: !!process.env.OPENAI_API_KEY || !!process.env.GPT_API_KEY,
      },
    };

    console.log('📊 API Status Check:', {
      environment: process.env.NODE_ENV || 'development',
      providers: Object.entries(status).map(([name, { available }]) => `${name}: ${available ? '✅' : '❌'}`),
    });

    res.status(200).json(status);
  } catch (error) {
    console.error('Status API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Status check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

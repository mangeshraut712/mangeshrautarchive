function applyCors(res, origin) {
  const allowedOrigins = [
    'https://mangeshraut712.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ];

  // Check if origin matches any allowed origin or is a subdomain
  const isAllowed = allowedOrigins.some(allowed => {
    if (origin === allowed) return true;
    // Allow subpaths of GitHub Pages
    if (allowed === 'https://mangeshraut712.github.io' && origin && origin.startsWith('https://mangeshraut712.github.io')) {
      return true;
    }
    return false;
  });

  if (origin && isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default to GitHub Pages origin if no origin header or not allowed
    res.setHeader('Access-Control-Allow-Origin', 'https://mangeshraut712.github.io');
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
}

export default function handler(req, res) {
  // Apply CORS headers to ALL responses
  applyCors(res, req.headers.origin);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check OpenRouter availability (only provider used)
    const openrouterAvailable = !!process.env.OPENROUTER_API_KEY;

    const response = {
      status: 'ok',
      provider: 'OpenRouter',
      available: openrouterAvailable,
      model: 'google/gemini-2.0-flash',
      timestamp: new Date().toISOString(),
      server: 'local',
      version: '2.0',
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('📊 API Status Check:', {
      environment: process.env.NODE_ENV || 'development',
      openrouter: openrouterAvailable ? '✅' : '❌'
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

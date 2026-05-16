import express from 'express';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = Number.parseInt(process.env.PORT || '4000', 10);
const apiTarget = process.env.API_TARGET || 'http://127.0.0.1:8001';

// Get the project root directory
const projectRoot = resolve(__dirname, '..');
const hopByHopHeaders = new Set([
  'accept-encoding',
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function getPublicBuildConfig() {
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE || `http://localhost:${port}`,
    siteUrl: process.env.OPENROUTER_SITE_URL || `http://localhost:${port}`,
    appTitle: process.env.OPENROUTER_APP_TITLE || 'AssistMe Portfolio Assistant',
    selectedModel: process.env.OPENROUTER_MODEL || 'x-ai/grok-4.1-fast',
    lastfmApiKey: process.env.NEXT_PUBLIC_LASTFM_API_KEY || 'bef46b0d7702dac5b071906cd186bd28',
    musicDirectFallback: true,
    buildTime: new Date().toISOString(),
    version: `dev-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
  };
}

app.use('/api', express.raw({ type: '*/*', limit: '10mb' }));

function buildProxyHeaders(req) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (hopByHopHeaders.has(key.toLowerCase()) || value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  return headers;
}

async function proxyApiRequest(req, res) {
  const targetUrl = new URL(req.originalUrl, apiTarget);
  const method = req.method || 'GET';
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody && Buffer.isBuffer(req.body) && req.body.length > 0 ? req.body : undefined;

  try {
    console.log(`[API] ${method} ${req.originalUrl} -> ${targetUrl}`);

    const upstream = await fetch(targetUrl, {
      method,
      headers: buildProxyHeaders(req),
      body,
      redirect: 'manual',
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (hopByHopHeaders.has(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('API Proxy Error:', err.message);
    res.status(503).json({
      error: 'Backend API not available',
      message: `Could not connect to API at ${apiTarget}. Please ensure the backend is running with "pnpm run dev:backend"`,
      status: 503,
    });
  }
}

app.use('/api', proxyApiRequest);

// Cache-busting middleware for development
app.use((req, res, next) => {
  // Disable caching for all requests in development
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.get('/build-config.json', (_req, res) => {
  res.type('application/json');
  res.send(JSON.stringify(getPublicBuildConfig(), null, 2));
});

app.get('/build-config.js', (_req, res) => {
  const config = JSON.stringify(getPublicBuildConfig(), null, 2);
  res.type('application/javascript');
  res.send(`(function () {
  const buildConfig = ${config};
  globalThis.buildConfig = buildConfig;
  globalThis.APP_CONFIG = Object.assign({}, globalThis.APP_CONFIG || {}, buildConfig);
})();`);
});

// Serve static files from the 'src' directory
const staticPath = join(projectRoot, 'src');
app.use(express.static(staticPath));

// Serve chatbot assets so linked styles/scripts resolve correctly
const chatbotPath = join(projectRoot, 'chatbot');
app.use('/chatbot', express.static(chatbotPath));

app.listen(port, () => {
  console.log(`\n🚀 Local development server running!`);
  console.log(`   - Frontend: http://localhost:${port}`);
  console.log(`   - API proxy target: ${apiTarget}`);
});

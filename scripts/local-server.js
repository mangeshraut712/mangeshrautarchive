import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { Readable } from 'stream';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const apiTarget = process.env.API_TARGET || 'http://127.0.0.1:8000';
const projectRoot = resolve(__dirname, '..');

app.disable('x-powered-by');
app.disable('etag');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

function buildProxyHeaders(req) {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (!value) return;
    if (['host', 'connection', 'content-length'].includes(key.toLowerCase())) return;

    if (Array.isArray(value)) {
      value.forEach(item => headers.append(key, item));
      return;
    }

    headers.set(key, value);
  });

  return headers;
}

function buildProxyBody(req) {
  if (['GET', 'HEAD'].includes(req.method)) {
    return undefined;
  }

  if (req.body == null) {
    return undefined;
  }

  const contentType = String(req.headers['content-type'] || '');
  if (contentType.includes('application/json')) {
    return JSON.stringify(req.body);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return new URLSearchParams(req.body).toString();
  }

  return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
}

function buildDevApiFallback(req, error) {
  const pathname = new URL(req.originalUrl, 'http://localhost').pathname;

  if (pathname === '/api/profile/views') {
    return {
      status: 200,
      body: {
        success: false,
        count: 0,
        mode: String(req.query?.mode || 'get'),
        page: String(req.query?.page || 'home'),
        provider: 'dev-fallback',
        message: `Profile views unavailable during local proxy fallback: ${error.message}`,
      },
    };
  }

  if (pathname === '/api/profile/spotify') {
    return {
      status: 200,
      body: {
        available: false,
        isPlaying: false,
        statusLabel: 'Unavailable',
        song: 'Nothing playing',
        artist: 'Local backend unavailable',
        album: '',
        albumArt: '',
        trackUrl: 'https://open.spotify.com/',
        source: 'spotify',
      },
    };
  }

  return null;
}

app.use('/api', async (req, res) => {
  const targetUrl = new URL(req.originalUrl, apiTarget);

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: buildProxyHeaders(req),
      body: buildProxyBody(req),
      redirect: 'manual',
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        return;
      }
      res.setHeader(key, value);
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    const fallback = buildDevApiFallback(req, error);
    if (fallback) {
      res.status(fallback.status).json(fallback.body);
      return;
    }

    res.status(502).json({
      success: false,
      detail: `Proxy request failed: ${error.message}`,
    });
  }
});

// Cache-busting middleware for development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Serve static files from the 'src' directory
const staticPath = join(projectRoot, 'src');
app.use(express.static(staticPath, {
  etag: false,
  lastModified: false,
  cacheControl: false,
}));

// Serve chatbot assets so linked styles/scripts resolve correctly
const chatbotPath = join(projectRoot, 'chatbot');
app.use('/chatbot', express.static(chatbotPath, {
  etag: false,
  lastModified: false,
  cacheControl: false,
}));

app.listen(port, () => {
  console.log(`\n🚀 Local development server running!`);
  console.log(`   - Frontend: http://localhost:${port}`);
  console.log(`   - API proxy target: ${apiTarget}`);
});

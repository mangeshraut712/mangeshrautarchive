import express from 'express';
import http from 'node:http';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';
import { WebSocket, WebSocketServer } from 'ws';
import { generateCaseStudyPages } from '../build/generate-case-study-pages.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../');

// Load environment variables (.env.local overrides .env).
dotenv.config({ path: join(projectRoot, '.env.local') });
dotenv.config({ path: join(projectRoot, '.env') });

const app = express();
const port = Number.parseInt(process.env.PORT || '4000', 10);
const host = process.env.HOST || '127.0.0.1';
const apiTarget = process.env.API_TARGET || 'http://127.0.0.1:8001';
const strictPort = ['1', 'true', 'yes'].includes(
  String(process.env.STRICT_PORT || '').toLowerCase()
);

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

function getPublicBuildConfig(activePort = port) {
  const origin = `http://${host}:${activePort}`;
  const useProductionApi = ['1', 'true', 'yes'].includes(
    String(process.env.LOCAL_USE_PRODUCTION_API || '').toLowerCase()
  );

  return {
    apiBaseUrl: useProductionApi
      ? (process.env.NEXT_PUBLIC_API_BASE || origin).replace(/\/$/, '')
      : origin,
    siteUrl: process.env.OPENROUTER_SITE_URL || origin,
    appTitle: process.env.OPENROUTER_APP_TITLE || 'AssistMe Portfolio Assistant',
    selectedModel: process.env.OPENROUTER_MODEL || 'x-ai/grok-4.3',
    lastfmApiKey: '',
    musicDirectFallback: true,
    buildTime: new Date().toISOString(),
    version: `dev-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    localDev: true,
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
      message: `Could not connect to API at ${apiTarget}. Please ensure the backend is running with "npm run dev:backend"`,
      status: 503,
    });
  }
}

app.use('/api', proxyApiRequest);

function attachRealtimeWsProxy(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const pathname = req.url?.split('?')[0] || '';
    if (pathname !== '/api/realtime/ws') {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, clientWs => {
      const targetUrl = new URL(req.url, apiTarget);
      targetUrl.protocol = targetUrl.protocol === 'https:' ? 'wss:' : 'ws:';

      const headers = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (hopByHopHeaders.has(key.toLowerCase()) || value == null) continue;
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
      }

      const upstream = new WebSocket(targetUrl.toString(), { headers });

      upstream.on('open', () => {
        clientWs.on('message', data => {
          if (upstream.readyState === WebSocket.OPEN) {
            upstream.send(data);
          }
        });
        upstream.on('message', data => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
          }
        });
      });

      clientWs.on('close', () => upstream.close());
      upstream.on('close', () => clientWs.close());
      clientWs.on('error', () => upstream.close());
      upstream.on('error', () => clientWs.close());
    });
  });
}

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.get('/build-config.json', (req, res) => {
  res.type('application/json');
  res.send(JSON.stringify(getPublicBuildConfig(Number(req.socket.localPort || port)), null, 2));
});

app.get('/build-config.js', (req, res) => {
  const activePort = Number(req.socket.localPort || port);
  const config = JSON.stringify(getPublicBuildConfig(activePort), null, 2);
  res.type('application/javascript');
  res.send(`(function () {
  const buildConfig = ${config};
  globalThis.buildConfig = buildConfig;
  globalThis.APP_CONFIG = Object.assign({}, globalThis.APP_CONFIG || {}, buildConfig);
})();`);
});

app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
});

const staticPath = join(projectRoot, 'src');
const distPath = join(projectRoot, 'dist');
app.use('/case-studies', express.static(join(distPath, 'case-studies'), { extensions: ['html'] }));
app.use(express.static(staticPath, { extensions: ['html'] }));

const chatbotPath = join(projectRoot, 'chatbot');
app.use('/chatbot', express.static(chatbotPath));

function startServer(listenPort) {
  const server = http.createServer(app);
  attachRealtimeWsProxy(server);
  server.listen(listenPort, host);

  server.on('listening', () => {
    const origin = `http://${host}:${listenPort}`;
    console.log('\n🚀 Local development server running!');
    console.log(`   - Frontend: ${origin}`);
    console.log(`   - API proxy: ${origin}/api/* → ${apiTarget}`);
    console.log(
      `   - Realtime WS: ${origin.replace(/^http/, 'ws')}/api/realtime/ws → ${apiTarget.replace(/^http/, 'ws')}/api/realtime/ws`
    );
    console.log(`   - apiBaseUrl: ${getPublicBuildConfig(listenPort).apiBaseUrl}`);
    if (listenPort !== port) {
      console.warn(`   ⚠️  Port ${port} was busy; using ${listenPort} instead.`);
    }
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      if (strictPort) {
        console.error(`❌ Port ${listenPort} is already in use and STRICT_PORT is enabled.`);
        process.exit(1);
      }
      console.warn(`⚠️  Port ${listenPort} is in use, trying port ${listenPort + 1}...`);
      startServer(listenPort + 1);
    } else {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    }
  });
}

async function prepareDevAssets() {
  try {
    await generateCaseStudyPages(distPath);
  } catch (error) {
    console.error('Failed to generate case study pages for local dev:', error.message);
    process.exit(1);
  }
}

prepareDevAssets()
  .then(() => startServer(port))
  .catch(error => {
    console.error('Failed to prepare local dev assets:', error.message);
    process.exit(1);
  });

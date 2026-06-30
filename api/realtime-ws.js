import http from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

const GATEWAY_REALTIME_SUBPROTOCOL = 'ai-gateway-realtime.v1';
const GATEWAY_AUTH_PREFIX = 'ai-gateway-auth.';
const DEFAULT_GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v4/ai';
const DEFAULT_REALTIME_MODEL = 'openai/gpt-realtime-2';

function getApiKey() {
  return (
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_AI_GATEWAY_API_KEY?.trim() ||
    ''
  );
}

function getGatewayRealtimeUrl() {
  const model = process.env.AI_GATEWAY_REALTIME_MODEL?.trim() || DEFAULT_REALTIME_MODEL;
  const base = (process.env.AI_GATEWAY_BASE_URL?.trim() || DEFAULT_GATEWAY_BASE).replace(/\/$/, '');
  const wsBase = base.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  return `${wsBase}/realtime-model?ai-model-id=${encodeURIComponent(model)}`;
}

function isRealtimePath(pathname) {
  return pathname === '/api/realtime/ws' || pathname === '/api/realtime-ws';
}

function bridgeSockets(clientWs, upstream) {
  const forward = (from, to) => {
    from.on('message', data => {
      if (to.readyState === WebSocket.OPEN) {
        to.send(data);
      }
    });
  };

  upstream.on('open', () => {
    forward(clientWs, upstream);
    forward(upstream, clientWs);
  });

  clientWs.on('close', () => upstream.close());
  upstream.on('close', () => clientWs.close());
  clientWs.on('error', () => upstream.close());
  upstream.on('error', () => clientWs.close());
}

const server = http.createServer((req, res) => {
  const pathname = req.url?.split('?')[0] || '';
  if (!isRealtimePath(pathname)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Not found' }));
    return;
  }

  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('Upgrade Required');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const pathname = req.url?.split('?')[0] || '';
  if (!isRealtimePath(pathname)) {
    socket.destroy();
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, clientWs => {
    const upstream = new WebSocket(getGatewayRealtimeUrl(), [
      GATEWAY_REALTIME_SUBPROTOCOL,
      `${GATEWAY_AUTH_PREFIX}${apiKey}`,
    ]);
    bridgeSockets(clientWs, upstream);
  });
});

export default server;

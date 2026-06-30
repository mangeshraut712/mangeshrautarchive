import http from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

const GATEWAY_REALTIME_SUBPROTOCOL = 'ai-gateway-realtime.v1';
const GATEWAY_AUTH_PREFIX = 'ai-gateway-auth.';
const DEFAULT_GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v4/ai';
const DEFAULT_GATEWAY_API_BASE = 'https://ai-gateway.vercel.sh';
const DEFAULT_REALTIME_MODEL = 'openai/gpt-realtime-2';

function getApiKey() {
  return (
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_AI_GATEWAY_API_KEY?.trim() ||
    ''
  );
}

function getRealtimeModel() {
  return process.env.AI_GATEWAY_REALTIME_MODEL?.trim() || DEFAULT_REALTIME_MODEL;
}

function getGatewayRealtimeUrl() {
  const model = getRealtimeModel();
  const base = (process.env.AI_GATEWAY_BASE_URL?.trim() || DEFAULT_GATEWAY_BASE).replace(/\/$/, '');
  const wsBase = base.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  return `${wsBase}/realtime-model?ai-model-id=${encodeURIComponent(model)}`;
}

function buildRealtimeSessionConfig() {
  return {
    instructions:
      process.env.AI_GATEWAY_REALTIME_INSTRUCTIONS?.trim() ||
      "You are AssistMe, the voice assistant for Mangesh Raut's portfolio website. Answer briefly and conversationally in English.",
    voice: process.env.AI_GATEWAY_REALTIME_VOICE?.trim() || 'alloy',
    turn_detection: { type: 'server_vad' },
    input_audio_transcription: {},
  };
}

async function mintGatewayRealtimeClientSecret() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('AI Gateway realtime is not configured.');
  }

  const apiBase = (process.env.AI_GATEWAY_API_BASE || DEFAULT_GATEWAY_API_BASE).replace(/\/$/, '');
  const response = await fetch(`${apiBase}/v1/realtime/client-secrets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getRealtimeModel(),
      session: buildRealtimeSessionConfig(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mint realtime client secret (${response.status})`);
  }

  const payload = await response.json();
  if (!payload?.token) {
    throw new Error('AI Gateway did not return a realtime client secret.');
  }

  return payload.token;
}

function isRealtimePath(pathname) {
  return pathname === '/api/realtime/ws' || pathname === '/api/realtime-ws';
}

function shouldDropClientMessage(raw) {
  try {
    const payload = JSON.parse(raw);
    const events = Array.isArray(payload) ? payload : [payload];
    return events.some(event => event?.type === 'session-update');
  } catch {
    return false;
  }
}

function bridgeSockets(clientWs, upstream) {
  const forward = (from, to, { filterSessionUpdate = false } = {}) => {
    from.on('message', data => {
      if (filterSessionUpdate && shouldDropClientMessage(data.toString())) {
        return;
      }
      if (to.readyState === WebSocket.OPEN) {
        to.send(data);
      }
    });
  };

  upstream.on('open', () => {
    forward(clientWs, upstream, { filterSessionUpdate: true });
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

  wss.handleUpgrade(req, socket, head, clientWs => {
    mintGatewayRealtimeClientSecret()
      .then(clientSecret => {
        const upstream = new WebSocket(getGatewayRealtimeUrl(), [
          GATEWAY_REALTIME_SUBPROTOCOL,
          `${GATEWAY_AUTH_PREFIX}${clientSecret}`,
        ]);
        bridgeSockets(clientWs, upstream);
      })
      .catch(() => {
        clientWs.close(1013, 'Realtime unavailable');
      });
  });
});

export default server;

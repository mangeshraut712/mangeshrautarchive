/**
 * Smoke test: connect to local realtime WS proxy and verify AI Gateway handshake.
 */
import WebSocket from 'ws';

const wsUrl = process.env.REALTIME_WS_URL || 'ws://127.0.0.1:8001/api/realtime/ws';
const timeoutMs = Number.parseInt(process.env.REALTIME_TEST_TIMEOUT_MS || '15000', 10);

const result = await new Promise(resolve => {
  const ws = new WebSocket(wsUrl);
  const timer = setTimeout(() => {
    ws.terminate();
    resolve({ ok: false, error: 'timeout', events: [] });
  }, timeoutMs);

  const events = [];

  ws.on('open', () => {
    events.push('open');
    clearTimeout(timer);
    ws.close();
    resolve({ ok: true, events });
  });

  ws.on('message', raw => {
    events.push(`message:${String(raw).slice(0, 80)}`);
  });

  ws.on('error', error => {
    clearTimeout(timer);
    resolve({ ok: false, error: error.message, events });
  });

  ws.on('close', (code, reason) => {
    events.push(`close:${code}:${String(reason || '')}`);
  });
});

if (!result.ok) {
  console.error('Realtime WebSocket test failed:', result.error || 'unknown');
  console.error('Events:', result.events?.join(' -> ') || 'none');
  process.exit(1);
}

console.log('Realtime WebSocket test passed');
console.log('Events:', result.events.join(' -> '));

import { describe, expect, it } from 'vitest';

function resolveRealtimeWsUrl(sessionPayload, apiBase = 'http://127.0.0.1:4000') {
  if (sessionPayload?.wsUrl) {
    return sessionPayload.wsUrl;
  }

  const url = new URL(apiBase);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/api/realtime/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}

describe('realtime voice helpers', () => {
  it('uses session wsUrl when provided', () => {
    expect(resolveRealtimeWsUrl({ wsUrl: 'wss://example.com/api/realtime/ws' })).toBe(
      'wss://example.com/api/realtime/ws'
    );
  });

  it('derives ws url from api base for local dev', () => {
    expect(resolveRealtimeWsUrl({}, 'http://127.0.0.1:4000')).toBe(
      'ws://127.0.0.1:4000/api/realtime/ws'
    );
  });

  it('derives wss url from https api base', () => {
    expect(resolveRealtimeWsUrl({}, 'https://mangeshraut.pro')).toBe(
      'wss://mangeshraut.pro/api/realtime/ws'
    );
  });
});

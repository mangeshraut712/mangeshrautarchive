import { describe, expect, it } from 'vitest';
import RealtimeVoiceService, {
  realtimeVoiceService,
  resolveRealtimeWsUrl,
  floatTo16BitPCM,
} from '../../src/js/services/RealtimeVoiceService.js';

describe('RealtimeVoiceService', () => {
  it('instantiates service with default disconnected state', () => {
    const service = new RealtimeVoiceService();
    expect(service.status).toBe('disconnected');
    expect(service.available).toBeNull();
    expect(service.playbackTime).toBe(0);
  });

  it('provides a singleton instance', () => {
    expect(realtimeVoiceService).toBeInstanceOf(RealtimeVoiceService);
    expect(realtimeVoiceService.status).toBe('disconnected');
  });

  it('uses session wsUrl when provided in payload', () => {
    expect(resolveRealtimeWsUrl({ wsUrl: 'wss://example.com/api/realtime/ws' })).toBe(
      'wss://example.com/api/realtime/ws'
    );
  });

  it('derives websocket url from api base when not in payload', () => {
    const derived = resolveRealtimeWsUrl({});
    expect(derived).toMatch(/^wss?:\/\/.*\/api\/realtime\/ws$/);
  });

  it('converts Float32Array to 16-bit PCM buffer', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const pcm = floatTo16BitPCM(samples);
    expect(pcm).toBeInstanceOf(Uint8Array);
    expect(pcm.length).toBe(samples.length * 2);
  });
});

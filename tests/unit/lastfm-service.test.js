import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../../src/js/utils/perf-audit.js', () => ({
  isPerformanceAudit: () => false,
}));

vi.mock('../../src/js/services/AnalyticsService.js', () => ({
  analytics: { track: vi.fn() },
}));

describe('LastFmService payload + artwork helpers', () => {
  let service;

  beforeEach(async () => {
    vi.resetModules();
    globalThis.APP_CONFIG = { apiBaseUrl: 'https://assistme-chat.mangeshraut712.workers.dev' };
    const mod = await import('../../src/js/modules/lastfm.js');
    service = mod.default;
  });

  it('normalizes a single recent track object into an array', () => {
    const tracks = service.getTracksFromPayload({
      recenttracks: {
        track: {
          name: 'Solo Track',
          artist: { '#text': 'Artist' },
          '@attr': { nowplaying: 'true' },
        },
      },
    });
    expect(tracks).toHaveLength(1);
    expect(tracks[0].name).toBe('Solo Track');
  });

  it('prefers scored iTunes artwork over an unrelated first hit', () => {
    const artwork = service.pickItunesArtwork(
      [
        {
          trackName: 'Wrong Song',
          artistName: 'Someone Else',
          artworkUrl100: 'https://example.com/100x100bb/wrong.jpg',
        },
        {
          trackName: 'Neele Neele Ambar Par',
          artistName: 'Kalyanji-Anandji',
          artworkUrl100: 'https://example.com/100x100bb/right.jpg',
        },
      ],
      'Neele Neele Ambar Par - Male Version',
      'Kalyanji-Anandji'
    );
    expect(artwork).toContain('right.jpg');
    expect(artwork).toContain('600x600bb');
  });

  it('builds a shelf signature that changes when now-playing flips', () => {
    const recent = [
      { name: 'A', artist: { '#text': 'X' } },
      { name: 'B', artist: { '#text': 'Y' } },
    ];
    const playing = [
      { name: 'A', artist: { '#text': 'X' }, '@attr': { nowplaying: 'true' } },
      { name: 'B', artist: { '#text': 'Y' } },
    ];
    expect(service.buildShelfSignature(recent)).not.toBe(service.buildShelfSignature(playing));
  });
});

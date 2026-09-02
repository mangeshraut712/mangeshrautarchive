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
    expect(artwork).toContain('1000x1000bb');
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

  it('formats relative listen times from Last.fm uts', () => {
    const now = Date.UTC(2026, 6, 28, 12, 0, 0);
    expect(service.formatRelativeListenTime(Math.floor(now / 1000) - 12, now)).toBe('Just now');
    expect(service.formatRelativeListenTime(Math.floor(now / 1000) - 12 * 60, now)).toBe('12m ago');
    expect(service.formatRelativeListenTime(Math.floor(now / 1000) - 3 * 3600, now)).toBe('3h ago');
    expect(service.formatRelativeListenTime(Math.floor(now / 1000) - 2 * 86400, now)).toBe(
      '2d ago'
    );
  });

  it('builds a 7-day week sparkline from recent track timestamps', () => {
    const now = Date.UTC(2026, 6, 28, 15, 0, 0);
    const todayStart = Math.floor(Date.UTC(2026, 6, 28) / 1000);
    const yesterday = todayStart - 86400;
    const bins = service.buildWeekBins(
      [
        { date: { uts: String(todayStart + 100) } },
        { date: { uts: String(todayStart + 200) } },
        { date: { uts: String(yesterday + 50) } },
      ],
      now
    );
    expect(bins).toHaveLength(7);
    expect(bins[6].count).toBe(2);
    expect(bins[5].count).toBe(1);
  });

  it('normalizes listen_now meta and falls back to derived top artists', () => {
    const tracks = [
      { name: 'One', artist: { '#text': 'Arijit' }, date: { uts: '1' } },
      { name: 'Two', artist: { '#text': 'Arijit' }, date: { uts: '2' } },
      { name: 'Three', artist: { '#text': 'Shreya' }, date: { uts: '3' } },
    ];
    const meta = service.normalizeListenNow({}, tracks);
    expect(meta.profile_url).toContain('/user/mbr63');
    expect(meta.top_artists[0].name).toBe('Arijit');
    expect(meta.week_bins).toHaveLength(7);
  });

  it('extracts full Apple Music details including previewUrl and trackViewUrl', () => {
    const details = service.pickItunesDetails(
      [
        {
          trackName: 'Blinding Lights',
          artistName: 'The Weeknd',
          artworkUrl100: 'https://example.com/100x100bb/weeknd.jpg',
          previewUrl: 'https://audio-ssl.itunes.apple.com/preview/blinding-lights.m4a',
          trackViewUrl: 'https://music.apple.com/us/album/blinding-lights/123456',
          primaryGenreName: 'R&B/Soul',
          trackTimeMillis: 200000,
        },
      ],
      'Blinding Lights',
      'The Weeknd'
    );
    expect(details).not.toBeNull();
    expect(details.previewUrl).toBe(
      'https://audio-ssl.itunes.apple.com/preview/blinding-lights.m4a'
    );
    expect(details.appleMusicUrl).toBe('https://music.apple.com/us/album/blinding-lights/123456');
    expect(details.genre).toBe('R&B/Soul');
    expect(details.artwork).toBe('https://example.com/1000x1000bb/weeknd.jpg');
  });

  it('formats audio time seconds into mm:ss accurately', () => {
    expect(service.formatTime(0)).toBe('0:00');
    expect(service.formatTime(9)).toBe('0:09');
    expect(service.formatTime(30)).toBe('0:30');
    expect(service.formatTime(75)).toBe('1:15');
    expect(service.formatTime(215)).toBe('3:35');
  });

  it('updates scrubber fill and thumb DOM based on currentTime and duration', () => {
    const mockHero = {
      scrubberFill: { style: { width: '0%' } },
      scrubberThumb: { style: { left: '0%' } },
      scrubberTrack: { setAttribute: vi.fn() },
      timeCurrent: { textContent: '' },
      timeDuration: { textContent: '' },
    };
    service.hero = mockHero;
    service.updateAudioProgress(15, 30);
    expect(mockHero.scrubberFill.style.width).toBe('50%');
    expect(mockHero.scrubberThumb.style.left).toBe('50%');
    expect(mockHero.timeCurrent.textContent).toBe('0:15');
    expect(mockHero.timeDuration.textContent).toBe('0:30');
    expect(mockHero.scrubberTrack.setAttribute).toHaveBeenCalledWith('aria-valuenow', 50);
  });
});

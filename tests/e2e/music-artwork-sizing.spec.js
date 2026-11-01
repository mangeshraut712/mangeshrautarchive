import { test, expect } from '@playwright/test';
import { gotoSiteReady } from './helpers/site.js';

test('hero music requests a suitably sized Last.fm image and preserves other artwork URLs', async ({
  page,
}) => {
  await gotoSiteReady(page);
  await page.waitForFunction(() => Boolean(window.lastFmService?.hero));
  const urls = await page.evaluate(() => {
    const service = window.lastFmService;
    service.fetchAppleMusicDetails = async () => null;
    const render = (name, artwork) => {
      service.updateHero({ name, artist: { '#text': 'Artist' }, resolved_artwork: artwork });
      return document.getElementById('album-art').src;
    };
    const original = 'https://lastfm-img.freetls.fastly.net/i/u/1000x1000/example.png';
    const compact = render('First', original);
    document.getElementById('album-art').dispatchEvent(new Event('error'));
    const fallback = document.getElementById('album-art').src;
    const noRetry = render('First', original);
    return [
      compact,
      fallback,
      noRetry,
      render('Second', 'https://example.com/i/u/1000x1000/example.png'),
    ];
  });
  expect(urls[0]).toBe('https://lastfm-img.freetls.fastly.net/i/u/300x300/example.png');
  expect(urls[1]).toBe('https://lastfm-img.freetls.fastly.net/i/u/1000x1000/example.png');
  expect(urls[2]).toBe(urls[1]);
  expect(urls[3]).toBe('https://example.com/i/u/1000x1000/example.png');
});

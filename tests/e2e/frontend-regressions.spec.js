import { expect, test } from '@playwright/test';
import { gotoSite, gotoSiteReady, openChatbot } from './helpers/site.js';

test('voice initialization and selection survive blocked preference storage', async ({ page }) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'assistme_voice') throw new DOMException('Storage blocked', 'SecurityError');
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'assistme_voice') throw new DOMException('Storage full', 'QuotaExceededError');
      return setItem.call(this, key, value);
    };
  });
  await gotoSite(page, '/');
  await openChatbot(page);
  const selectedVoice = await page.evaluate(async () => {
    const { voiceModeService } = await import('/js/services/VoiceModeService.js');
    voiceModeService.setVoice('sage');
    return voiceModeService.selectedVoice;
  });
  expect(selectedVoice).toBe('sage');
});

test('voice preferences ignore stale IDs and tolerate a denied storage getter', async ({
  page,
}) => {
  await gotoSite(page, '/');
  const result = await page.evaluate(async () => {
    const { default: VoiceModeService } = await import('/js/services/VoiceModeService.js');
    localStorage.setItem('assistme_voice', 'retired-voice');
    const stale = new VoiceModeService().selectedVoice;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage blocked', 'SecurityError');
      },
    });
    const voice = new VoiceModeService();
    voice.setVoice('rex');
    return { stale, selected: voice.selectedVoice };
  });
  expect(result).toEqual({ stale: 'eve', selected: 'rex' });
});

test('hero and music controls keep 44px targets and stop decorative motion', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await gotoSiteReady(page, '/');

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      cardHeight: document.querySelector('#music-card').getBoundingClientRect().height,
      statusBelowArtist:
        document.querySelector('.status-row').getBoundingClientRect().top >=
        document.querySelector('#artist-name').getBoundingClientRect().bottom,
      controlsRightOfDetails:
        document.querySelector('.music-header-meta').getBoundingClientRect().left >=
        document.querySelector('#track-name').getBoundingClientRect().right,

      controls: [
        ...document.querySelectorAll(
          '#name-pronounce-btn, #vibe-coder-badge, #portfolio-reach, .music-card-service-link'
        ),
      ].map(element => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    }));
    expect(layout.overflow).toBe(false);
    expect(layout.cardHeight).toBeLessThan(128);
    expect(layout.statusBelowArtist).toBe(true);
    expect(layout.controlsRightOfDetails).toBe(true);
    expect(layout.controls).toHaveLength(6);
    expect(
      layout.controls.every(({ width: controlWidth, height }) => controlWidth >= 44 && height >= 44)
    ).toBe(true);
  }

  const motion = await page.evaluate(() => {
    document.querySelector('#music-card')?.classList.add('is-playing', 'is-audio-previewing');
    document.querySelector('#playing-indicator')?.classList.add('active');
    return [...document.querySelectorAll('#album-art, #playing-indicator span')].map(
      element => getComputedStyle(element).animationName
    );
  });
  expect(motion).toEqual(['none', 'none', 'none', 'none']);
});

test('music artwork rotates when playing and pauses when idle', async ({ page }) => {
  await gotoSiteReady(page, '/');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const start = await page.evaluate(async () => {
    const { default: music } = await import('/js/modules/lastfm.js');
    music.setHeroMusicState('idle');
    const artwork = document.querySelector('#album-art');
    const idle = getComputedStyle(artwork).animationPlayState;
    music.setHeroMusicState('playing');
    const playing = getComputedStyle(artwork).animationPlayState;
    // A short PCM WAV exercises real media play, pause, and ended events without network audio.
    const samples = 8000;
    const bytes = new Uint8Array(44 + samples * 2);
    const view = new DataView(bytes.buffer);
    const label = (offset, text) =>
      [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    label(0, 'RIFF');
    view.setUint32(4, bytes.length - 8, true);
    label(8, 'WAVE');
    label(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 8000, true);
    view.setUint32(28, 16000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    label(36, 'data');
    view.setUint32(40, samples * 2, true);
    music.currentPreviewUrl = `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
    await music.toggleAudioPreview();
    const previewing = getComputedStyle(artwork).animationPlayState;
    return { idle, playing, previewing };
  });
  expect(start).toEqual({ idle: 'paused', playing: 'running', previewing: 'running' });
  const paused = await page.evaluate(async () => {
    const { default: music } = await import('/js/modules/lastfm.js');
    await music.toggleAudioPreview();
    music.setHeroMusicState('idle');
    return getComputedStyle(document.querySelector('#album-art')).animationPlayState;
  });
  expect(paused).toBe('paused');
  await expect(page.locator('#music-preview-btn')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(async () => {
    const { default: music } = await import('/js/modules/lastfm.js');
    await music.toggleAudioPreview();
  });
  await expect(page.locator('#music-preview-btn')).toHaveAttribute('aria-pressed', 'false', {
    timeout: 10000,
  });
  await expect(page.locator('#music-card')).not.toHaveClass(/is-audio-previewing/);
});

test('tab favicon tracks system theme independently of the page theme', async ({ page }) => {
  for (const path of ['/', '/systems.html', '/uses.html']) {
    await page.emulateMedia({ colorScheme: 'light' });
    await gotoSite(page, path);
    const icon = page.locator('link[data-system-favicon]');
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute('href', /favicon-light-20261101b\.png$/);
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    });
    await expect(icon).toHaveAttribute('href', /favicon-light-20261101b\.png$/);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(icon).toHaveAttribute('href', /favicon-dark-20261101b\.png$/);
    const response = await page.request.get(await icon.getAttribute('href'));
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(icon).toHaveAttribute('href', /favicon-light-20261101b\.png$/);
  }
});

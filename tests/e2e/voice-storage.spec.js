import { expect, test } from '@playwright/test';
import { gotoSite, openChatbot } from './helpers/site.js';

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

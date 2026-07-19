/**
 * Shared WWDC26 chrome for subpages: a11y, share, AssistMe, go-to-top, search, haptics.
 * Loaded by systems / monitor / uses / travel — keep this the single eager chrome owner.
 */
import '../utils/reduced-transparency-sync.js';
import { initGlobalSearch } from '../modules/global-search-overlay.js';
import { initAssistMeChrome } from './assistme-chrome.js';

const EAGER = [
  () => import('../modules/accessibility.js'),
  () => import('../modules/liquid-glass-engine.js'),
  () => import('../modules/liquid-glass-chrome.js'),
  () => import('../modules/share-widget.js'),
  () => import('../modules/apple-haptics.js'),
  () => import('../utils/view-transitions-nav.js'),
];

let bootPromise = null;

async function bootSubpageChrome() {
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    await Promise.all(EAGER.map(load => load().catch(() => {})));
    await initGlobalSearch().catch(() => {});
    await initAssistMeChrome().catch(() => {});

    document.addEventListener(
      'keydown',
      event => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          const toggle = document.getElementById('search-toggle');
          toggle?.click();
        }
      },
      true
    );
  })();

  return bootPromise;
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      void bootSubpageChrome();
    },
    { once: true }
  );
} else {
  void bootSubpageChrome();
}

export { bootSubpageChrome };

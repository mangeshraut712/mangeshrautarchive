/**
 * iPhone 17 Pro Max display compatibility audit (Chrome + Safari UA).
 * Run: node scripts/qa/iphone-17-pro-max-display-compat.mjs [url]
 */
import { chromium, webkit } from '@playwright/test';

const BASE = process.argv[2] || 'https://mangeshraut.pro';
const VIEWPORT = { width: 440, height: 956 };

async function audit(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1500);
  await page.waitForFunction(() => window.__portfolioViewNavReady === true, { timeout: 25_000 }).catch(() => {});
  await page.waitForFunction(() => typeof globalThis.appleHaptics?.trigger === 'function', {
    timeout: 25_000,
  }).catch(() => {});

  const data = await page.evaluate(async () => {
    if (window.websiteShareWidget) {
      await window.websiteShareWidget.ensureShareToggleReady();
    }
    const share = document.getElementById('website-share-dialog');
    const backdrop = document.getElementById('chatbot-backdrop');
    const goTop = document.getElementById('go-to-top');
    const cs = el => (el ? getComputedStyle(el) : null);
    const root = document.documentElement;

    return {
      title: document.title,
      innerW: window.innerWidth,
      innerH: window.innerHeight,
      dpr: window.devicePixelRatio,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      viewportFit: document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover'),
      appleCss: [...document.styleSheets].some(s => {
        try {
          return s.href?.includes('apple-super-retina-display.css');
        } catch {
          return false;
        }
      }),
      mobileCss: [...document.styleSheets].some(s => {
        try {
          return s.href?.includes('mobile-viewport.css');
        } catch {
          return false;
        }
      }),
      colorScheme: getComputedStyle(root).colorScheme,
      dynamicIsland: !!document.querySelector('.global-nav.dynamic-island'),
      mainPadTop: getComputedStyle(document.querySelector('#main-content')).paddingTop,
      chromeTop: getComputedStyle(root).getPropertyValue('--apple-chrome-top').trim(),
      ppi: getComputedStyle(root).getPropertyValue('--apple-display-ppi').trim(),
      physicalW: getComputedStyle(root).getPropertyValue('--apple-display-physical-w').trim(),
      physicalH: getComputedStyle(root).getPropertyValue('--apple-display-physical-h').trim(),
      htmlBg: getComputedStyle(root).backgroundColor,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      shareClosedDisplay: cs(share)?.display,
      chatClosedDisplay: cs(backdrop)?.display,
      goTopClosedDisplay: cs(goTop)?.display,
      xdrHighlight: !!document.querySelector('.xdr-highlight'),
      xdrMedia: !!document.querySelector('.xdr-media'),
      haptics: typeof globalThis.appleHaptics?.trigger === 'function',
      maskIcon: !!document.querySelector('link[rel="mask-icon"]'),
      startupImage: !!document.querySelector('link[rel="apple-touch-startup-image"]'),
      viewNavReady: Boolean(window.__portfolioViewNavReady),
      viewNavBound: Boolean(window.__portfolioViewNavBound),
      reducedTransparencyCss: null,
    };
  });

  const cssChecks = await page.evaluate(async () => {
    const lgCss = await fetch('assets/css/wwdc26-liquid-glass.css').then(r => r.text());
    return lgCss.includes('prefers-reduced-transparency');
  });

  data.reducedTransparencyCss = cssChecks;

  await browser.close();
  return { engine: label, ...data };
}

const results = await Promise.all([audit(chromium, 'Chrome'), audit(webkit, 'Safari')]);
const failures = [];

for (const r of results) {
  if (r.innerW !== 440 || r.innerH !== 956) failures.push(`${r.engine}: viewport ${r.innerW}x${r.innerH}`);
  if (r.dpr !== 3) failures.push(`${r.engine}: DPR ${r.dpr}`);
  if (r.overflowX > 2) failures.push(`${r.engine}: overflow ${r.overflowX}px`);
  if (!r.viewportFit) failures.push(`${r.engine}: missing viewport-fit=cover`);
  if (!r.appleCss) failures.push(`${r.engine}: apple-super-retina-display.css not loaded`);
  if (!r.dynamicIsland) failures.push(`${r.engine}: Dynamic Island nav missing`);
  if (r.ppi !== '460') failures.push(`${r.engine}: PPI token ${r.ppi}`);
  if (r.physicalW !== '1320' || r.physicalH !== '2868') {
    failures.push(`${r.engine}: physical dims ${r.physicalW}x${r.physicalH}`);
  }
  if (r.shareClosedDisplay !== 'none') failures.push(`${r.engine}: share dialog not display:none`);
  if (r.chatClosedDisplay !== 'none') failures.push(`${r.engine}: chatbot backdrop not display:none`);
  if (r.goTopClosedDisplay !== 'none') failures.push(`${r.engine}: go-to-top not display:none`);
  if (!r.xdrHighlight) failures.push(`${r.engine}: missing xdr-highlight`);
  if (!r.xdrMedia) failures.push(`${r.engine}: missing xdr-media`);
  if (!r.viewNavReady) failures.push(`${r.engine}: view transition nav not ready`);
  if (!r.reducedTransparencyCss) failures.push(`${r.engine}: prefers-reduced-transparency CSS missing`);
}

console.log(
  JSON.stringify(
    {
      base: BASE,
      device: 'iPhone 17 Pro Max',
      matrix: {
        resolution: '2868x1320 @ 460ppi (440x956 @3x)',
        dynamicIsland: true,
        aodDim: 'css+js (dark idle)',
        xdr: 'display-p3 highlights + xdr-media',
        promotion: 'scroll blur + offscreen pause + contain',
        liquidGlass: 'display:none overlays + root bg + reduced-transparency',
        p3: 'color-gamut p3 CSS',
        haptics: 'vibrate + iOS click fallback',
        viewTransitions: 'meta + site-wide startViewTransition nav',
      },
      results,
      failures,
      passed: !failures.length,
    },
    null,
    2
  )
);
process.exit(failures.length ? 1 : 0);

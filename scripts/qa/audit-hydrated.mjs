import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR =
  '/Users/mangeshraut/.gemini/antigravity/brain/b43c31db-0fa8-4790-bb36-99c700e6edfc/scratch/mobile_audit/hydrated';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function captureHydratedPages() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const viewports = [
    { name: 'iPhone_17_Pro_Max_Safari', width: 440, height: 956 },
    { name: 'iPhone_14_Standard_Safari', width: 390, height: 844 },
    { name: 'iPhone_SE_Small_Chrome', width: 375, height: 667 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    console.log(`Loading homepage on ${vp.name}...`);
    await page.goto('http://127.0.0.1:4000/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Scroll down gradually through the whole page to hydrate all lazy-loaded modules/sections
    const scrollStep = 500;
    let currentScroll = 0;
    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight);
    while (currentScroll < maxScroll + 2000) {
      currentScroll += scrollStep;
      await page.evaluate(y => window.scrollTo(0, y), currentScroll);
      await page.waitForTimeout(150);
    }
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Screenshot full homepage hydrated
    await page.screenshot({
      path: path.join(OUT_DIR, `homepage_hydrated_${vp.name}.png`),
      fullPage: true,
    });

    // Also let's capture individual section screenshots for close inspection
    const sections = [
      '#home',
      '#about',
      '#skills',
      '#experience',
      '#engineering',
      '#projects',
      '#education',
      '#publications',
      '#recommendations',
      '#blog',
      '#currently-section',
      '#contact',
    ];
    for (const secId of sections) {
      const el = page.locator(secId);
      if ((await el.count()) > 0 && (await el.isVisible())) {
        await el
          .screenshot({
            path: path.join(OUT_DIR, `sec_${secId.replace('#', '')}_${vp.name}.png`),
          })
          .catch(() => {});
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('Hydrated audit screenshots complete.');
}

captureHydratedPages();

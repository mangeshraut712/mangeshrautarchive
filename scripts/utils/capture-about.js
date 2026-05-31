import { chromium } from '@playwright/test';
import { join } from 'path';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const artifactsDir =
    '/Users/mangeshraut/.gemini/antigravity/brain/331c76eb-8f70-425a-84cc-f9badb8d7d88/';

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const dPage = await desktopContext.newPage();
  console.log('Navigating to homepage on desktop...');
  await dPage.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });

  // Let's scroll to about section
  const aboutSection = dPage.locator('#about');
  await aboutSection.scrollIntoViewIfNeeded();
  await dPage.waitForTimeout(500);

  // Take screenshot in default mode
  const defaultTheme = await dPage.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  console.log(`Default theme detected: ${defaultTheme}`);

  await aboutSection.screenshot({ path: join(artifactsDir, `about_desktop_${defaultTheme}.png`) });
  console.log(`Saved about_desktop_${defaultTheme}.png`);

  // Force toggle theme
  await dPage.evaluate(() => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
  });
  await dPage.waitForTimeout(500);
  const otherTheme = defaultTheme === 'dark' ? 'light' : 'dark';
  await aboutSection.screenshot({ path: join(artifactsDir, `about_desktop_${otherTheme}.png`) });
  console.log(`Saved about_desktop_${otherTheme}.png`);

  await desktopContext.close();

  // Mobile context
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  });
  const mPage = await mobileContext.newPage();
  console.log('Navigating to homepage on mobile...');
  await mPage.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });

  const mAboutSection = mPage.locator('#about');
  await mAboutSection.scrollIntoViewIfNeeded();
  await mPage.waitForTimeout(500);

  const mDefaultTheme = await mPage.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  await mAboutSection.screenshot({ path: join(artifactsDir, `about_mobile_${mDefaultTheme}.png`) });
  console.log(`Saved about_mobile_${mDefaultTheme}.png`);

  await mPage.evaluate(() => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
  });
  await mPage.waitForTimeout(500);
  const mOtherTheme = mDefaultTheme === 'dark' ? 'light' : 'dark';
  await mAboutSection.screenshot({ path: join(artifactsDir, `about_mobile_${mOtherTheme}.png`) });
  console.log(`Saved about_mobile_${mOtherTheme}.png`);

  await mobileContext.close();
  await browser.close();
  console.log('Capture completed.');
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

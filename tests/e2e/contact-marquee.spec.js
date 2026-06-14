import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';

async function openContactWithTheme(page, theme) {
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('themeMode', selectedTheme);
    localStorage.setItem('theme', selectedTheme);
  }, theme);
  await page.goto(`${pathPrefix}/#contact`, { waitUntil: 'domcontentloaded' });
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForSelector('.dream-companies-track', { state: 'visible' });
  await page.waitForSelector('.dream-cars-track', { state: 'visible' });
  await page.waitForFunction(() => {
    const logos = [...document.querySelectorAll('.company-logo, .car-logo')];
    return logos.length > 0 && logos.every(logo => logo.complete && logo.naturalWidth > 0);
  });
}

async function readLogoState(page, selector) {
  return page.locator(selector).evaluateAll(logos =>
    logos.map(logo => {
      const style = getComputedStyle(logo);
      const box = logo.getBoundingClientRect();
      return {
        label: logo.getAttribute('alt') || logo.closest('[title]')?.getAttribute('title') || 'logo',
        source: logo.currentSrc || logo.src || logo.dataset.deferredSrc || '',
        naturalWidth: logo.naturalWidth,
        naturalHeight: logo.naturalHeight,
        width: box.width,
        height: box.height,
        opacity: Number.parseFloat(style.opacity || '0'),
        visibility: style.visibility,
        display: style.display,
      };
    })
  );
}

test.describe('Contact marquees', () => {
  for (const theme of ['light', 'dark']) {
    test(`dream company and car logos stay visible in ${theme} theme`, async ({ page }) => {
      await openContactWithTheme(page, theme);

      const companies = await readLogoState(page, '.company-logo');
      const cars = await readLogoState(page, '.car-logo');

      expect(companies.length).toBeGreaterThanOrEqual(34);
      expect(cars.length).toBeGreaterThanOrEqual(38);

      for (const logo of [...companies, ...cars]) {
        expect(logo.source, `${logo.label} should have an image source`).toBeTruthy();
        expect(logo.naturalWidth, `${logo.label} should load image width`).toBeGreaterThan(0);
        expect(logo.naturalHeight, `${logo.label} should load image height`).toBeGreaterThan(0);
        expect(logo.width, `${logo.label} should occupy rendered width`).toBeGreaterThan(0);
        expect(logo.height, `${logo.label} should occupy rendered height`).toBeGreaterThan(0);
        expect(logo.opacity, `${logo.label} should not be transparent`).toBeGreaterThan(0.85);
        expect(logo.visibility, `${logo.label} should be visible`).toBe('visible');
        expect(logo.display, `${logo.label} should not be display none`).not.toBe('none');
      }
    });
  }
});

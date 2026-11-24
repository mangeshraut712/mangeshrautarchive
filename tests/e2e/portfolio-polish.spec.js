import { test, expect } from './helpers/isolated-test.js';
import { gotoSite } from './helpers/site.js';

test.use({ serviceWorkers: 'block' });
for (const width of [375, 768, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`contact and marquee parity at ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
      await page.addInitScript(value => localStorage.setItem('theme', value), theme);
      await gotoSite(page, '/');
      await page.locator('#skills').scrollIntoViewIfNeeded();
      const skills = page.locator('.skill-scroll-wrapper').first();
      await skills.evaluate(el => el.parentElement.scrollIntoView({ block: 'center' }));
      await expect(skills).toBeVisible();
      expect(await skills.evaluate(el => getComputedStyle(el).animationIterationCount)).toBe(
        'infinite'
      );
      await page.mouse.move(0, 0);
      const initialTransform = await skills.evaluate(el => getComputedStyle(el).transform);
      await expect
        .poll(() => skills.evaluate(el => getComputedStyle(el).transform))
        .not.toBe(initialTransform);
      const pause = page.locator('.marquee-pause').first();
      await pause.click();
      await expect(pause).toHaveAttribute('aria-pressed', 'true');
      expect(await skills.evaluate(el => getComputedStyle(el).animationPlayState)).toBe('paused');
      await pause.click();
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await expect(page.locator('#calendar-widget')).not.toContainText(
        'Automatic calendar updates'
      );
      await expect(page.locator('#calendar-widget')).not.toContainText('Owner sign-in');
      await expect(page.locator('#contact-panchang')).toBeHidden();
      for (const selector of ['#contact .wrapper .linkedin', 'footer .wrapper .linkedin']) {
        const icon = page.locator(selector).first();
        await icon.scrollIntoViewIfNeeded();
        await icon.hover();
        await expect
          .poll(() =>
            icon.evaluate(el => {
              const glyph = el.querySelector('svg, i');
              return getComputedStyle(glyph).color === getComputedStyle(el).color;
            })
          )
          .toBe(true);
        const colors = await icon.evaluate(el => ({
          icon: getComputedStyle(el).color,
          accent: getComputedStyle(document.documentElement).getPropertyValue('--ui-accent').trim(),
          opacity: getComputedStyle(el).opacity,
        }));
        expect(colors.opacity).toBe('1');
        expect(colors.icon).not.toBe('rgb(255, 255, 255)');
      }
      await page.locator('.dream-companies-marquee').scrollIntoViewIfNeeded();
      expect(
        await page
          .locator('.dream-companies-track')
          .evaluate(el => getComputedStyle(el).animationIterationCount)
      ).toBe('infinite');
      await page.screenshot({ path: `artifacts/polish-contact-${width}-${theme}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      await page.evaluate(() => document.documentElement.classList.add('reduce-motion'));
      expect(await skills.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
      await expect(page.locator('.marquee-pause').first()).toBeHidden();
      expect(
        await page.locator('.dream-cars-track').evaluate(el => getComputedStyle(el).animationName)
      ).toBe('none');
      await page.evaluate(() => document.documentElement.classList.remove('reduce-motion'));
      expect(await skills.evaluate(el => getComputedStyle(el).animationName)).not.toBe('none');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(await skills.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
      expect(
        await page
          .locator('.dream-companies-track')
          .evaluate(el => getComputedStyle(el).animationName)
      ).toBe('none');
    });
  }
}

test('Panchang appears only with a complete official entry for today', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-24T05:00:00Z'));
  await page.route('**/kalnirnay-panchang.json?*', route =>
    route.fulfill({
      json: {
        date: '2026-11-24',
        source: 'https://www.kalnirnay.com/',
        tithi: 'Test tithi',
        nakshatra: 'Test nakshatra',
        yog: 'Test yog',
        karan: 'Test karan',
        sunrise: '06:45',
        sunset: '17:55',
      },
    })
  );
  await gotoSite(page, '/#contact');
  await page.locator('#calendar-widget').scrollIntoViewIfNeeded();
  await expect(page.locator('#contact-panchang')).toBeVisible();
  await expect(page.locator('#contact-panchang')).toContainText('Test tithi');
  await expect(page.locator('#contact-panchang a')).toHaveAttribute(
    'href',
    'https://www.kalnirnay.com/'
  );
});

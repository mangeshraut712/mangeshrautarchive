import { expect, test } from '@playwright/test';

const pathPrefix = process.env.TEST_TARGET === 'github' ? '/mangeshrautarchive' : '';

async function openContactWithTheme(page, theme) {
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('themeMode', selectedTheme);
    localStorage.setItem('theme', selectedTheme);
  }, theme);
  await page.goto(`${pathPrefix}/#contact`, { waitUntil: 'domcontentloaded' });
  await page.locator('#contact').scrollIntoViewIfNeeded();

  // Progressive disclosure: marquees live under "View more ways to connect".
  // Prefer the real control; never force-expand AND click (click would toggle closed).
  const expandBtn = page.locator('#contact .contact-extras-actions .section-preview-btn');
  if (await expandBtn.count()) {
    const expanded = await expandBtn.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await expandBtn.click();
    }
  } else {
    await page.evaluate(() => {
      const contact = document.getElementById('contact');
      contact?.classList.add('is-contact-expanded');
      contact?.querySelectorAll('[data-contact-extra]').forEach(el => {
        el.hidden = false;
        el.classList.remove('is-preview-hidden');
        el.removeAttribute('hidden');
        el.style.display = '';
        el.setAttribute('aria-hidden', 'false');
      });
    });
  }

  // Bring marquees into the viewport so offscreen-pause / lazy-load engage
  await page.locator('.dream-companies-marquee, #contact').first().scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document
      .querySelectorAll(
        '.dream-companies-track, .dream-cars-track, .dream-companies-marquee, .dream-cars-marquee'
      )
      .forEach(el => {
        el.classList.remove('is-offscreen-paused');
        el.style.animationPlayState = 'running';
      });
  });

  await page.waitForSelector('.dream-companies-track', { state: 'attached', timeout: 20_000 });
  await page.waitForSelector('.dream-cars-track', { state: 'attached', timeout: 20_000 });
  await expect(page.locator('.dream-companies-track').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.dream-cars-track').first()).toBeVisible({ timeout: 15_000 });

  // Eager-load marquee logos (lazy + previously display:none kept naturalWidth at 0)
  await page.evaluate(async () => {
    const logos = [...document.querySelectorAll('.company-logo, .car-logo')];
    await Promise.all(
      logos.map(
        img =>
          new Promise(resolve => {
            img.loading = 'eager';
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
            const src = img.currentSrc || img.getAttribute('src') || '';
            if (src) {
              img.src = src;
            }
            setTimeout(done, 5000);
          })
      )
    );
  });

  await page.waitForFunction(
    () => {
      const logos = [...document.querySelectorAll('.company-logo, .car-logo')];
      if (logos.length < 60) return false;
      const loaded = logos.filter(logo => logo.complete && logo.naturalWidth > 0);
      return loaded.length >= Math.min(60, Math.floor(logos.length * 0.85));
    },
    { timeout: 30_000 }
  );
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

      // Marquee tracks duplicate logos for seamless loop; only assert on painted ones
      // with a positive layout box (off-screen clones can report 0×0 width).
      const painted = [...companies, ...cars].filter(
        logo => logo.naturalWidth > 0 && logo.width > 0 && logo.height > 0
      );
      expect(
        painted.length,
        `expected most marquee logos to paint (got ${painted.length}/${companies.length + cars.length})`
      ).toBeGreaterThanOrEqual(40);

      for (const logo of painted) {
        expect(logo.source, `${logo.label} should have an image source`).toBeTruthy();
        expect(logo.opacity, `${logo.label} should not be transparent`).toBeGreaterThan(0.85);
        expect(logo.visibility, `${logo.label} should be visible`).toBe('visible');
        expect(logo.display, `${logo.label} should not be display none`).not.toBe('none');
      }
    });
  }
});

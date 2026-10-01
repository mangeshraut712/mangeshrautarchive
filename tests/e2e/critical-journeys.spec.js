import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoSite, openChatbot } from './helpers/site.js';

test('homepage navigation loads a focused writing preview', async ({ page }) => {
  await gotoSite(page, '/');
  await expect(page.locator('main')).toBeAttached();
  await page.locator('a.nav-link[href="#blog"]').click();
  await expect(page).toHaveURL(/#blog$/);
  await expect(page.locator('#blog .blog-card')).toHaveCount(4);
  await expect(page.locator('#blog .blog-card--featured-home')).toHaveCount(1);
  await expect(page.locator('#blog .blog-title-link').first()).toHaveAttribute('href', /\/blog\//);
});

test('blog archive opens a full article with its lead image', async ({ page }) => {
  await gotoSite(page, '/blog/');
  await expect(page.locator('.blog-index-title')).toBeVisible();
  await expect(page.locator('.blog-featured')).toHaveCount(1);
  await expect(page.locator('#blog-posts-container .blog-card')).toHaveCount(17);
  const featuredHref = await page.locator('.blog-featured-media').getAttribute('href');
  await expect(
    page.locator(`#blog-posts-container .blog-card-media[href="${featuredHref}"]`)
  ).toHaveCount(0);
  await page.locator('#blog-posts-container .blog-title-link').first().click();
  await expect(page.locator('main h1')).toBeVisible();
  const leadImage = page.locator('.article-figure img').first();
  await expect(leadImage).toBeAttached();
  await leadImage.evaluate(image => {
    image.loading = 'eager';
    image.scrollIntoView({ block: 'center' });
  });
  await expect.poll(() => leadImage.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
});

test('homepage card leads directly to a complete article with section navigation', async ({
  page,
}) => {
  await gotoSite(page, '/');
  await page.locator('#blog').scrollIntoViewIfNeeded();
  await expect(page.locator('.blog-home-archive-link a')).toHaveAttribute('href', 'blog/');
  await expect(page.locator('#blog .blog-preview-btn')).toHaveCount(0);
  const readBtn = page.locator('#blog .blog-card .blog-read-btn').first();
  await expect(readBtn).toBeVisible({ timeout: 15_000 });
  await readBtn.click();
  await expect(page).toHaveURL(/\/blog\/[^/]+\.html$/);
  await expect(page.locator('.article-toc__list a').first()).toBeAttached();
  await expect(page.locator('.article-diagram')).toHaveCount(1);
});

test('old homepage preview links reach the complete article', async ({ page }) => {
  await gotoSite(page, '/#blog-read-google-io-2026-developer-insights');
  await expect(page).toHaveURL(/\/blog\/google-io-2026-developer-insights\.html$/);
  await expect(page.locator('main h1')).toBeVisible();
});

test('GitHub operating view leads into illustrated repository cards', async ({ page }) => {
  await gotoSite(page, '/#projects');
  const operatingView = page.locator('#projects-github-page');
  const repositoryList = page.locator('#projects-repos-page');
  await expect(operatingView).toBeAttached();
  await expect(repositoryList).toBeAttached();
  expect(
    await page.evaluate(
      () =>
        document
          .querySelector('#projects-github-page')
          .compareDocumentPosition(document.querySelector('#projects-repos-page')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    )
  ).toBeTruthy();
  await expect(page.locator('.showcase-project-card').first()).toBeAttached();
  expect(
    await page
      .locator('#github-projects-container')
      .evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length)
  ).toBe(3);
  await page.locator('#projects-expand-btn').click();
  const cards = page.locator('.showcase-project-card');
  expect(await cards.count()).toBeGreaterThan(10);
  const mediaChecks = await cards.evaluateAll(async elements =>
    Promise.all(
      elements.slice(0, 6).map(async card => {
        const image = card.querySelector('.project-media img');
        if (!image) return false;
        image.loading = 'eager';
        await image.decode().catch(() => {});
        return (
          image.naturalWidth > 0 &&
          Boolean(image.alt) &&
          card.querySelectorAll('.project-signal-grid dd').length === 3
        );
      })
    )
  );
  expect(mediaChecks.every(Boolean)).toBe(true);
  await expect(cards.first().locator('.project-footer .btn-github')).toHaveCount(1);
  await expect(cards.first().locator('.project-more summary')).toBeAttached();
  const previewRepo = await cards
    .first()
    .locator('.project-media-open')
    .getAttribute('data-repo-preview');
  await cards.first().locator('.project-media-open').click();
  const previewImage = page.locator('#repo-preview-modal .project-preview__media img');
  await expect(previewImage).toBeVisible();
  await expect.poll(() => previewImage.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.locator('#repo-preview-modal .blog-modal-close').click();
  await expect(page.locator('#repo-preview-modal')).toBeHidden();
  const currentCard = cards.filter({ has: page.locator(`[data-repo-preview="${previewRepo}"]`) });
  await expect(currentCard.locator('.project-media-open')).toBeFocused();
  await currentCard.locator('.project-more summary').click();
  await expect(currentCard.locator('.project-more-menu')).toBeVisible();
});

test('contact form sends a message and confirms storage', async ({ page }) => {
  let submitted;
  await page.route('**/api/contact', async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        persisted: true,
        id: 'contact-e2e',
        message: 'Saved successfully.',
      }),
    });
  });
  await gotoSite(page, '/#contact');
  await page.locator('.contact-manual-details > summary').click();
  const form = page.locator('#contact-form');
  await form.locator('#contact-name').fill('Ada Lovelace');
  await form.locator('#contact-email').fill('ada@example.com');
  await form.locator('#contact-subject').fill('Project question');
  await form.locator('#contact-message').fill('Please get in touch about this project.');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('.contact-feedback-toast')).toContainText('Saved successfully.');
  expect(submitted).toMatchObject({ email: 'ada@example.com', subject: 'Project question' });
});

test.describe('AssistMe chat', () => {
  test.use({ serviceWorkers: 'block' });

  test('chatbot renders a streamed answer', async ({ page }) => {
    await page.route('**/api/chat/health', route =>
      route.fulfill({ json: { provider_status: 'online' } })
    );
    await page.route('**/api/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: '{"type":"chunk","content":"Here is **the answer**."}\n{"type":"done","metadata":{"source":"e2e"}}\n',
      });
    });
    await gotoSite(page, '/');
    await openChatbot(page);
    await page.locator('#chatbot-input').fill('Explain the portfolio');
    await page.locator('#chatbot-input').dispatchEvent('keydown', {
      key: 'Enter',
      isComposing: true,
      keyCode: 229,
    });
    await expect(page.locator('#chatbot-input')).toHaveValue('Explain the portfolio');
    await expect(page.locator('#chatbot-messages .user-message')).toHaveCount(0);
    await page.locator('#chatbot-input').press('Enter');
    await expect(page.locator('#chatbot-messages .assistant-message').last()).toContainText(
      'the answer'
    );
    const answer = page.locator('#chatbot-messages .assistant-message').last();
    const details = answer.getByRole('button', { name: 'Details', exact: true });
    await expect(details).toHaveAttribute('aria-expanded', 'false');
    await expect(answer.locator('.meta-details')).toBeHidden();
    await details.click();
    await expect(details).toHaveAttribute('aria-expanded', 'true');
    await expect(answer.locator('.meta-details')).toContainText('estimated');
    await details.click();
    await expect(answer.locator('.meta-details')).toBeHidden();
    const completedCount = await page.evaluate(() => window.appleIntelligenceChatbot.messageCount);
    await page.evaluate(() => {
      const bot = window.appleIntelligenceChatbot;
      bot.chatAPI.ask = async () => {
        throw new Error('Simulated connection interruption');
      };
      bot.chatAPI.basicQueryProcessing = () => null;
    });
    await page.locator('#chatbot-input').fill('Keep this draft after a connection failure');
    await page.locator('#chatbot-input').press('Enter');
    await expect(page.locator('#chatbot-input')).toHaveValue(
      'Keep this draft after a connection failure'
    );
    await expect(page.locator('#chatbot-messages')).toContainText('Your draft is ready to retry');
    expect(await page.evaluate(() => window.appleIntelligenceChatbot.messageCount)).toBe(
      completedCount
    );
  });
});

test('homepage has no serious accessibility violations', async ({ page }) => {
  await gotoSite(page, '/');
  await expect(page.locator('main')).toBeAttached();
  await page.waitForLoadState('load');
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.getElementById('skills-loading'));
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations.filter(item => ['critical', 'serious'].includes(item.impact))).toEqual(
    []
  );
});

test('mobile homepage fits and floating controls stay in a vertical stack', async ({ page }) => {
  await gotoSite(page, '/');
  await expect(page.locator('main')).toBeAttached();
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 4000));
    await expect(page.locator('#go-to-top')).toBeVisible();
    for (const dark of [false, true]) {
      await page.evaluate(value => document.documentElement.classList.toggle('dark', value), dark);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
        .toBeLessThanOrEqual(1);
      await page.mouse.move(0, 0);
      await expect
        .poll(() =>
          page
            .locator('.a11y-toolbar__main, #website-share-toggle, #chatbot-toggle, #go-to-top')
            .evaluateAll(controls => {
              const positions = controls.map(control => control.getBoundingClientRect().x);
              return Math.max(...positions) - Math.min(...positions);
            })
        )
        .toBeLessThanOrEqual(1);
      const bounds = await page
        .locator('.a11y-toolbar__main, #website-share-toggle, #chatbot-toggle, #go-to-top')
        .evaluateAll(controls =>
          controls.map(control => {
            const rect = control.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            };
          })
        );
      expect(bounds).toHaveLength(4);
      expect(
        Math.max(...bounds.map(rect => rect.x)) - Math.min(...bounds.map(rect => rect.x))
      ).toBeLessThanOrEqual(1);
      for (const rect of bounds) {
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(width);
        expect(rect.bottom).toBeLessThanOrEqual(height);
      }
      const sorted = bounds.sort((a, b) => a.y - b.y);
      for (let index = 1; index < sorted.length; index++) {
        expect(sorted[index].y - sorted[index - 1].bottom).toBeGreaterThanOrEqual(8);
      }
      await page.locator('.a11y-toolbar__main').click();
      const panel = page.locator('.a11y-toolbar__panel');
      await expect(panel).toBeVisible();
      await expect
        .poll(() => panel.evaluate(element => element.getBoundingClientRect().top))
        .toBeGreaterThanOrEqual(0);
      await page.getByRole('button', { name: 'Liquid Glass transparency', exact: true }).click();
      const popover = page.locator('.a11y-glass-popover');
      await expect(popover).toBeVisible();
      await expect
        .poll(() => popover.evaluate(element => element.getBoundingClientRect().bottom))
        .toBeLessThanOrEqual(height);
      const popoverBounds = await popover.boundingBox();
      expect(popoverBounds.x).toBeGreaterThanOrEqual(0);
      expect(popoverBounds.y).toBeGreaterThanOrEqual(0);
      expect(popoverBounds.x + popoverBounds.width).toBeLessThanOrEqual(width);
      await popover.locator('.a11y-glass-popover__close').click();
      if (
        await page
          .locator('.a11y-toolbar')
          .evaluate(element => element.classList.contains('is-open'))
      ) {
        await page.locator('.a11y-toolbar__main').click();
      }
    }
  }
});

test('laptop navigation exposes every page and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoSite(page, '/');
  const menu = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(menu).toBeVisible();
  await menu.click();
  const dialog = page.getByRole('dialog', { name: 'Site navigation' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Uses', exact: true })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Changelog', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'Changelog', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(menu).toBeFocused();
});

test('travel map remains reachable and can retry a failed download', async ({ page }) => {
  let downloadAttempts = 0;
  await page.route('**/maplibre-gl.js', route => {
    downloadAttempts += 1;
    return route.abort('failed');
  });
  await page.setViewportSize({ width: 1440, height: 950 });
  await gotoSite(page, '/travel.html');
  const load = page.locator('#travel-map-load');
  await expect(load).toBeInViewport();
  await load.click();
  await expect(load).toHaveText(/Retry interactive map/);
  await expect(page.locator('#travel-map-prompt-status')).toContainText('places list');
  await expect(load).toBeEnabled();
  await load.click();
  await expect.poll(() => downloadAttempts).toBe(2);
  await expect(load).toHaveText(/Retry interactive map/);
  await expect(page.locator('#map-container')).toHaveAttribute('aria-busy', 'false');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(load).toBeInViewport();
});

test('contact calendar scrolls, clocks use timezones, and stale Panchang stays hidden', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-01T05:00:00Z'));
  await page.route('**/kalnirnay-panchang.json?*', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'https://www.kalnirnay.com/',
        date: '2026-09-30',
        tithi: 'Outdated source value',
      }),
    })
  );
  await gotoSite(page, '/#contact');
  await expect(page.locator('.world-clock:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'View 3 more clocks' }).click();
  await expect(page.locator('.world-clock:visible')).toHaveCount(6);
  await page.getByRole('button', { name: 'Show fewer clocks' }).click();
  await expect(page.locator('.world-clock:visible')).toHaveCount(3);
  const expectedTimes = ['1:00 AM', '6:00 AM', '10:30 AM', '2:00 PM', '3:00 PM', '7:00 AM'];
  await expect
    .poll(() => page.locator('.world-clock time').allTextContents())
    .toEqual(expectedTimes);
  await expect(page.locator('#contact-panchang')).not.toContainText('Outdated source value');
  await expect(page.locator('#contact-panchang .calendar-marathi-link')).toHaveAttribute(
    'href',
    'https://www.kalnirnay.com/'
  );
  await expect(page.locator('.calendar-snapshot-note,.card-source')).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: 'Year 2026 progress' })).toHaveAttribute(
    'value',
    '274'
  );
  const leftCards = await page
    .locator('.contact-column')
    .first()
    .locator(':scope > .contact-card')
    .evaluateAll(cards =>
      cards.slice(0, 2).map(card => card.querySelector('h3').textContent.trim())
    );
  expect(leftCards).toEqual(['Follow Me', 'Send a Message']);
  await page.locator('.filter-tab[data-filter="all"]').click();
  await expect(page.locator('.reminder-card:visible')).toHaveCount(5);
  await page.getByRole('button', { name: /View all \d+ items/ }).click();
  const list = page.locator('#reminders-list-container');
  await list.focus();
  await page.keyboard.press('PageDown');
  await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await list.evaluate(element => element.clientHeight < element.scrollHeight)).toBe(true);
  const add = page.getByRole('button', { name: 'Add new reminder' });
  await add.click();
  const modal = page.getByRole('dialog', { name: 'New reminder' });
  await expect(modal).toBeVisible();
  await expect(modal).not.toContainText('Antigravity');
  await modal.getByRole('button', { name: 'Save reminder' }).focus();
  await page.keyboard.press('Tab');
  await expect(modal.getByRole('button', { name: 'Close modal' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(add).toBeFocused();
  await add.click();
  await modal
    .getByRole('textbox', { name: 'Reminder details in natural language' })
    .fill('Follow up tomorrow at 3pm');
  await modal.getByRole('button', { name: 'Save reminder' }).click();
  await expect(modal).toBeHidden();
  await page.locator('.filter-tab[data-filter="reminders"]').click();
  await expect(list).toContainText('Follow up');
  await page.reload();
  await page.locator('.filter-tab[data-filter="reminders"]').click();
  await expect(list).toContainText('Follow up');
});

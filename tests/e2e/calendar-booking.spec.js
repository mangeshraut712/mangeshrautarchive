import { expect, test } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

async function openContactCalendar(page) {
  await page.addInitScript(() => {
    window.Calendly = {
      initPopupWidget: options => {
        document.documentElement.dataset.calendlyOpened = options?.url || 'opened';
      },
    };
  });
  await gotoSite(page, '/#contact');
  const calendar = page.locator('#calendar-widget');
  await calendar.scrollIntoViewIfNeeded();
  return { calendar };
}

test.describe('Apple-style Contact Calendar and Smart Reminders', () => {
  test('shows the deduplicated 2026 import and navigates calendar views', async ({ page }) => {
    const { calendar } = await openContactCalendar(page);
    await expect(calendar.locator('.ios-calendar-section')).toBeVisible();
    await expect(calendar.locator('.ios-weekdays')).toBeVisible();
    await expect(calendar.locator('.ios-reminders-section')).toBeVisible();
    await expect(calendar.getByText('Events & Reminders')).toBeVisible();
    await expect(calendar.locator('.calendar-snapshot-note')).toContainText('97 distinct events');
    await expect(page.locator('#contact .calendly-panel')).toBeVisible();

    await calendar.locator('[data-calendar-view="year"]').click();
    await expect(calendar.locator('.calendar-year-month')).toHaveCount(12);
    await calendar.locator('.calendar-year-month[data-month="0"]').click();
    await expect(calendar.locator('.current-month')).toHaveText('January');
    await expect(calendar.locator('.reminder-card')).not.toHaveCount(0);
    await calendar.locator('[data-calendar-view="week"]').click();
    await expect(calendar.locator('.ios-grid .day-cell:not(.empty)')).toHaveCount(7);
    await calendar.locator('.ios-grid .day-cell:not(.empty)').first().click();
    await expect(calendar.locator('.calendar-day-view')).toBeVisible();
  });

  test('keeps imported events read-only and browser tasks editable', async ({ page }) => {
    const { calendar } = await openContactCalendar(page);
    await calendar.locator('[data-filter="all"]').click();
    const firstCard = calendar.locator('.reminder-card').first();
    await expect(firstCard).not.toHaveClass(/completed/);
    await firstCard.click();
    await expect(firstCard).not.toHaveClass(/completed/);
    await expect(firstCard.locator('.card-source')).toBeVisible();
    await expect(firstCard.locator('.status-circle')).toHaveCount(0);
  });

  test('triggers Calendly popup from consultation panel', async ({ page }) => {
    await openContactCalendar(page);
    const btn = page.locator('.calendly-panel-button').first();
    await expect(btn).toBeVisible();
    await btn.click();

    await expect
      .poll(() => page.locator('html').getAttribute('data-calendly-opened'))
      .toContain('calendly.com');
  });

  test('fits mobile viewports cleanly without horizontal overflow', async ({ page }) => {
    const { calendar } = await openContactCalendar(page);
    await expect(calendar.locator('.ios-widget-wrapper')).toBeVisible();

    const metrics = await page.evaluate(() => {
      const root = document.getElementById('calendar-widget')?.getBoundingClientRect();
      const sections = ['.ios-calendar-section', '.ios-reminders-section'].map(selector => {
        const rect = document
          .querySelector(`#calendar-widget ${selector}`)
          ?.getBoundingClientRect();
        return {
          selector,
          left: rect?.left || 0,
          right: rect?.right || 0,
          width: rect?.width || 0,
        };
      });

      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        root: root ? { left: root.left, right: root.right, width: root.width } : null,
        sections,
      };
    });

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
    for (const section of metrics.sections) {
      expect(
        section.width,
        `${section.selector} should render with positive width`
      ).toBeGreaterThan(0);
    }
  });
});

import { expect, test } from '@playwright/test';
import { gotoSite } from './helpers/site.js';

const slots = [
  {
    start: '2026-08-26T14:00:00.000Z',
    end: '2026-08-26T14:30:00.000Z',
    timeZone: 'America/New_York',
    token: 'signed-slot-one',
  },
  {
    start: '2026-08-26T14:30:00.000Z',
    end: '2026-08-26T15:00:00.000Z',
    timeZone: 'America/New_York',
    token: 'signed-slot-two',
  },
];

async function openContactCalendar(page, availabilityStatus = 'live') {
  let bookingPayload;
  await page.addInitScript(() => {
    window.Calendly = {
      initPopupWidget: options => {
        document.documentElement.dataset.calendlyOpened = options?.url || 'opened';
      },
    };
  });
  await page.route('**/api/calendar/availability', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        status: availabilityStatus,
        timeZone: 'America/New_York',
        slots: availabilityStatus === 'live' ? slots : [],
      }),
    })
  );
  await page.route('**/api/calendar/book', async route => {
    bookingPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        persisted: true,
        eventCreated: true,
        invitationSent: true,
        bookingId: 'booking-test-id',
        start: slots[0].start,
        end: slots[0].end,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        message: 'Booked. Google Calendar emailed your invitation.',
      }),
    });
  });
  await gotoSite(page, '/#contact');
  const calendar = page.locator('#calendar-widget');
  await calendar.scrollIntoViewIfNeeded();
  return { calendar, getBookingPayload: () => bookingPayload };
}

test.describe('Contact Google Calendar booking', () => {
  test('books a live slot and confirms the emailed Calendar invitation', async ({ page }) => {
    const { calendar, getBookingPayload } = await openContactCalendar(page);
    await expect(calendar.getByText('Live Google Calendar availability')).toBeVisible();
    await expect(calendar.locator('[data-calendar-slot]')).toHaveCount(2);
    await expect(calendar.locator('.ios-calendar-section')).toBeVisible();
    await expect(calendar.locator('.calendar-events-section')).toBeVisible();
    await expect(calendar.locator('.ios-reminders-section')).toBeVisible();
    await expect(calendar.locator('.calendly-panel')).toBeVisible();
    await expect(calendar.getByText('Review Portfolio Design')).toHaveCount(0);
    await expect(calendar.getByText('AI Model Training')).toHaveCount(0);

    await calendar.locator('[data-calendar-slot]').first().click();
    const form = calendar.locator('[data-calendar-booking-form]');
    await form.locator('[name="name"]').fill('Ada Lovelace');
    await form.locator('[name="email"]').fill('ada@example.com');
    await form.locator('[name="topic"]').fill('Architecture review');
    await form.locator('button[type="submit"]').click();

    await expect(calendar.getByText('Meeting booked')).toBeVisible();
    await expect(calendar.getByText(/emailed your invitation/i)).toBeVisible();
    await expect(calendar.getByRole('button', { name: /Apple Calendar/i })).toBeVisible();
    await expect(calendar.getByRole('button', { name: /Outlook/i })).toBeVisible();
    await expect(calendar.locator('.calendar-event-card')).toContainText('Architecture review');
    await expect(calendar.locator('.reminder-card.is-active')).toHaveCount(3);
    expect(getBookingPayload()).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      topic: 'Architecture review',
      slotToken: 'signed-slot-one',
      source: 'github_pages_calendar',
    });
  });

  test('keeps the original integrated Calendly fallback working', async ({ page }) => {
    const { calendar } = await openContactCalendar(page);

    await calendar.getByRole('button', { name: /Check Calendly/i }).click();

    await expect
      .poll(() => page.locator('html').getAttribute('data-calendly-opened'))
      .toContain('calendly.com');
  });

  test('uses an honest email fallback while owner reauthorization is required', async ({
    page,
  }) => {
    const { calendar } = await openContactCalendar(page, 'needs_auth');

    await expect(calendar.getByText('Calendar connection is being refreshed')).toBeVisible();
    await expect(calendar.locator('a[href^="mailto:"]')).toBeVisible();
    await expect(calendar.locator('[data-calendar-slot]')).toHaveCount(0);
  });

  test('fits the mobile viewport without horizontal overflow', async ({ page }) => {
    const { calendar } = await openContactCalendar(page);
    await expect(calendar.locator('[data-calendar-slot]').first()).toBeVisible();
    const metrics = await page.evaluate(() => {
      const root = document.getElementById('calendar-widget')?.getBoundingClientRect();
      const sectionSelectors = [
        '.calendar-booking',
        '.calendar-booking__header',
        '.ios-calendar-section',
        '.ios-grid',
        '.calendar-events-section',
        '.ios-reminders-section',
        '.calendar-live-slots',
        '.calendar-slot-grid',
        '.calendly-panel',
      ];
      const sections = sectionSelectors.map(selector => {
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
    expect(metrics.root?.width).toBeLessThanOrEqual(metrics.innerWidth);
    for (const section of metrics.sections) {
      expect(
        section.width,
        `${section.selector} should render with a positive width`
      ).toBeGreaterThan(0);
      expect(
        section.left,
        `${section.selector} should stay inside the calendar card`
      ).toBeGreaterThanOrEqual((metrics.root?.left || 0) - 1);
      expect(
        section.right,
        `${section.selector} should stay inside the calendar card`
      ).toBeLessThanOrEqual((metrics.root?.right || metrics.innerWidth) + 1);
    }
  });
});

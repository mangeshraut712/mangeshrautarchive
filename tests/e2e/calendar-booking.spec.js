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
    expect(getBookingPayload()).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      topic: 'Architecture review',
      slotToken: 'signed-slot-one',
      source: 'github_pages_calendar',
    });
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
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      calendarWidth: document.getElementById('calendar-widget')?.getBoundingClientRect().width || 0,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
    expect(metrics.calendarWidth).toBeLessThanOrEqual(metrics.innerWidth);
  });
});

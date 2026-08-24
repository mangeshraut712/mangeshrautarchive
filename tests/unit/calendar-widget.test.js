import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  {
    start: '2026-08-27T17:00:00.000Z',
    end: '2026-08-27T17:30:00.000Z',
    timeZone: 'America/New_York',
    token: 'signed-slot-three',
  },
];

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Contact Google Calendar booking widget', () => {
  it('restores the month, events, reminders, and Calendly around real availability', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            status: 'live',
            timeZone: 'America/New_York',
            durationMinutes: 30,
            slots,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    );
    vi.stubGlobal('fetch', fetchImpl);
    const { CalendarBookingWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarBookingWidget('calendar-widget', {
      now: new Date('2026-08-24T12:00:00.000Z'),
    });
    await widget.init();

    expect(document.querySelector('.ios-calendar-section')).not.toBeNull();
    expect(document.querySelector('[data-calendar-date="2026-08-26"]')).not.toBeNull();
    expect(
      document
        .querySelector('[data-calendar-date="2026-08-26"]')
        .classList.contains('has-availability')
    ).toBe(true);
    expect(document.querySelector('.calendar-events-section')).not.toBeNull();
    expect(document.querySelector('.ios-reminders-section')).not.toBeNull();
    expect(document.querySelector('.calendly-panel')).not.toBeNull();
    expect(document.querySelectorAll('[data-calendar-slot]')).toHaveLength(3);
    expect(document.body.textContent).toContain('Live Multi-Calendar Availability');
    expect(document.body.textContent).toContain('Google Calendar Invitation');
    expect(document.body.textContent).toContain('Outlook & To-Do Sync');
    expect(document.body.textContent).toContain('Apple Calendar & Reminders');
    expect(document.body.textContent).toContain('30-minute popup reminder');
    expect(document.body.textContent).not.toContain('Review Portfolio Design');
    expect(document.body.textContent).not.toContain('AI Model Training');
    expect(document.querySelectorAll('.reminder-card')).toHaveLength(4);
  });

  it('filters live slots when an available calendar day is selected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ success: true, status: 'live', timeZone: 'America/New_York', slots }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
      )
    );
    const { CalendarBookingWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';
    const widget = new CalendarBookingWidget('calendar-widget', {
      now: new Date('2026-08-24T12:00:00.000Z'),
    });
    await widget.init();

    document.querySelector('[data-calendar-date="2026-08-27"]').click();

    expect(document.querySelectorAll('[data-calendar-slot]')).toHaveLength(1);
    expect(document.querySelector('[data-calendar-slot]').dataset.calendarSlot).toBe('2');
  });

  it('submits the selected signed slot and confirms the emailed invitation', async () => {
    let bookingPayload;
    const fetchImpl = vi.fn(async (url, options = {}) => {
      if (String(url).endsWith('/api/calendar/availability')) {
        return new Response(
          JSON.stringify({ success: true, status: 'live', timeZone: 'America/New_York', slots }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      bookingPayload = JSON.parse(options.body);
      return new Response(
        JSON.stringify({
          success: true,
          persisted: true,
          eventCreated: true,
          invitationSent: true,
          bookingId: 'booking-id',
          start: '2026-08-26T14:00:00.000Z',
          end: '2026-08-26T14:30:00.000Z',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          message: 'Booked. Google Calendar emailed your invitation.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });
    vi.stubGlobal('fetch', fetchImpl);
    const { CalendarBookingWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';
    const widget = new CalendarBookingWidget('calendar-widget', {
      now: new Date('2026-08-24T12:00:00.000Z'),
    });
    await widget.init();

    document.querySelector('[data-calendar-slot]').click();
    const form = document.querySelector('[data-calendar-booking-form]');
    form.querySelector('[name="name"]').value = 'Ada Lovelace';
    form.querySelector('[name="email"]').value = 'ada@example.com';
    form.querySelector('[name="topic"]').value = 'Architecture review';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(document.querySelector('[data-calendar-status]').textContent).toContain(
        'emailed your invitation'
      );
    });

    expect(bookingPayload).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      topic: 'Architecture review',
      slotToken: 'signed-slot-one',
      source: 'github_pages_calendar',
    });
    expect(document.querySelector('[data-calendar-booking-form]')).toBeNull();
    expect(document.querySelectorAll('[data-calendar-download]')).toHaveLength(2);
    expect(document.querySelector('.calendar-event-card')).not.toBeNull();
    expect(document.querySelector('.calendar-event-card').textContent).toContain(
      'Architecture review'
    );
    expect(document.querySelector('.ios-reminders-section').textContent).toContain('Active');
  });

  it('shows an honest owner-reauthorization fallback without fake availability', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, status: 'needs_auth', slots: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
    const { CalendarBookingWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';

    const widget = new CalendarBookingWidget('calendar-widget', {
      now: new Date('2026-08-24T12:00:00.000Z'),
    });
    await widget.init();

    expect(document.body.textContent).toContain('Calendar connection is being refreshed');
    expect(document.querySelector('a[href^="mailto:"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-calendar-slot]')).toHaveLength(0);
  });

  it('keeps the integrated Calendly fallback panel working', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ success: true, status: 'live', timeZone: 'America/New_York', slots }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
      )
    );
    window.Calendly = { initPopupWidget: vi.fn() };
    const { CalendarBookingWidget } = await import('../../src/js/modules/calendar.js');
    document.body.innerHTML = '<div id="calendar-widget"></div>';
    const widget = new CalendarBookingWidget('calendar-widget', {
      now: new Date('2026-08-24T12:00:00.000Z'),
    });
    await widget.init();

    document.querySelector('.calendly-panel-button').click();
    await vi.waitFor(() => expect(window.Calendly.initPopupWidget).toHaveBeenCalledOnce());
  });

  it('creates one standards-based event file for Apple Calendar and Outlook', async () => {
    const { buildCalendarInviteIcs } = await import('../../src/js/modules/calendar.js');

    const ics = buildCalendarInviteIcs({
      uid: 'booking-id@mangeshraut.pro',
      start: '2026-08-26T14:00:00.000Z',
      end: '2026-08-26T14:30:00.000Z',
      summary: 'Portfolio consultation with Ada, Inc.',
      description: 'Architecture review; APIs and cloud',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      now: new Date('2026-08-24T12:00:00.000Z'),
    });

    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('VERSION:2.0\r\n');
    expect(ics).toContain('METHOD:PUBLISH\r\n');
    expect(ics).toContain('DTSTART:20260826T140000Z\r\n');
    expect(ics).toContain('DTEND:20260826T143000Z\r\n');
    expect(ics).toContain('SUMMARY:Portfolio consultation with Ada\\, Inc.\r\n');
    expect(ics).toContain('URL:https://meet.google.com/abc-defg-hij\r\n');
    expect(ics).toContain('TRIGGER:-PT30M\r\n');
    expect(ics).toContain('END:VCALENDAR\r\n');
  });
});

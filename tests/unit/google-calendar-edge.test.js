import { describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_CALENDAR_SCOPES,
  buildGoogleAuthorizeUrl,
  createCalendarEventPayload,
  generateAvailableSlots,
  handleCalendarBooking,
  signSlotToken,
  verifySlotToken,
} from '../../workers/assistme-chat/src/google-calendar.js';

const ENV = {
  GOOGLE_CALENDAR_CLIENT_ID: 'google-client-id',
  GOOGLE_CALENDAR_CLIENT_SECRET: 'google-client-secret',
  GOOGLE_CALENDAR_REDIRECT_URI:
    'https://assistme-chat.example.workers.dev/api/calendar/callback/google',
  INTEGRATION_ENCRYPTION_KEY: 'calendar-signing-secret',
};

describe('Google Calendar edge booking', () => {
  it('generates weekday ET slots after the lead time and excludes busy ranges', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const busy = [
      {
        start: '2026-08-25T14:00:00.000Z',
        end: '2026-08-25T14:30:00.000Z',
      },
    ];

    const slots = generateAvailableSlots({ now, busy, days: 3, maxSlots: 20 });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every(slot => new Date(slot.start).getTime() >= now.getTime() + 86_400_000)).toBe(
      true
    );
    expect(slots.some(slot => slot.start === '2026-08-25T14:00:00.000Z')).toBe(false);
    expect(
      slots.every(slot => {
        const day = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
        }).format(new Date(slot.start));
        return day !== 'Sat' && day !== 'Sun';
      })
    ).toBe(true);
  });

  it('signs slots and rejects tampered or expired values', async () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const token = await signSlotToken(
      ENV,
      {
        start: '2026-08-26T14:00:00.000Z',
        end: '2026-08-26T14:30:00.000Z',
      },
      { now, ttlSeconds: 600 }
    );

    await expect(verifySlotToken(ENV, token, { now })).resolves.toMatchObject({
      start: '2026-08-26T14:00:00.000Z',
      end: '2026-08-26T14:30:00.000Z',
    });
    await expect(verifySlotToken(ENV, `${token}x`, { now })).resolves.toBeNull();
    await expect(
      verifySlotToken(ENV, token, { now: new Date('2026-08-24T12:11:00.000Z') })
    ).resolves.toBeNull();
  });

  it('requests only Calendar event and freebusy OAuth scopes', () => {
    const url = new URL(buildGoogleAuthorizeUrl(ENV, 'signed-state'));

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('redirect_uri')).toBe(ENV.GOOGLE_CALENDAR_REDIRECT_URI);
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('scope')?.split(' ')).toEqual(GOOGLE_CALENDAR_SCOPES);
    expect(GOOGLE_CALENDAR_SCOPES).not.toContain('https://mail.google.com/');
  });

  it('builds a private event with attendee email, invitation, Meet, and owner reminders', () => {
    const event = createCalendarEventPayload({
      bookingId: 'booking-id',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      topic: 'Architecture review',
      start: '2026-08-26T14:00:00.000Z',
      end: '2026-08-26T14:30:00.000Z',
    });

    expect(event.visibility).toBe('private');
    expect(event.attendees).toEqual([{ email: 'ada@example.com', displayName: 'Ada Lovelace' }]);
    expect(event.reminders).toEqual({
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 },
        { method: 'popup', minutes: 30 },
      ],
    });
    expect(event.conferenceData.createRequest.conferenceSolutionKey.type).toBe('hangoutsMeet');
    expect(event.extendedProperties.private.bookingId).toBe('booking-id');
    expect(event.guestsCanModify).toBe(false);
    expect(event.guestsCanInviteOthers).toBe(false);
  });

  it('rechecks availability and confirms a stored booking after Google creates the event', async () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const slotToken = await signSlotToken(
      ENV,
      {
        start: '2026-08-26T14:00:00.000Z',
        end: '2026-08-26T14:30:00.000Z',
      },
      { now, ttlSeconds: 600 }
    );
    const captured = {};
    const deps = {
      now: () => now,
      getAccessToken: vi.fn(async () => 'access-token'),
      isSlotBusy: vi.fn(async () => false),
      reserveBooking: vi.fn(async record => {
        captured.booking = record;
        return { id: 'booking-id', conflict: false };
      }),
      createEvent: vi.fn(async (_token, event) => {
        captured.event = event;
        return {
          id: 'google-event-id',
          htmlLink: 'https://calendar.google.com/event',
          hangoutLink: 'https://meet.google.com/abc-defg-hij',
        };
      }),
      confirmBooking: vi.fn(async () => true),
      failBooking: vi.fn(async () => true),
    };
    const request = new Request('https://worker.test/api/calendar/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://mangeshraut712.github.io' },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ADA@example.com',
        topic: 'Architecture review',
        slotToken,
        source: 'github_pages_calendar',
        landingPath: '/mangeshrautarchive/#contact',
        website: '',
      }),
    });

    const response = await handleCalendarBooking(request, ENV, {}, deps);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      persisted: true,
      eventCreated: true,
      invitationSent: true,
      start: '2026-08-26T14:00:00.000Z',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    });
    expect(deps.isSlotBusy).toHaveBeenCalledWith(
      'access-token',
      '2026-08-26T14:00:00.000Z',
      '2026-08-26T14:30:00.000Z'
    );
    expect(captured.booking.attendee_email).toBe('ada@example.com');
    expect(captured.event.reminders.overrides).toContainEqual({ method: 'email', minutes: 1440 });
    expect(deps.confirmBooking).toHaveBeenCalledWith('booking-id', {
      eventId: 'google-event-id',
      eventLink: 'https://calendar.google.com/event',
    });
  });

  it('returns a conflict without creating an event when the slot is no longer free', async () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const slotToken = await signSlotToken(
      ENV,
      {
        start: '2026-08-26T14:00:00.000Z',
        end: '2026-08-26T14:30:00.000Z',
      },
      { now, ttlSeconds: 600 }
    );
    const createEvent = vi.fn();
    const request = new Request('https://worker.test/api/calendar/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        topic: 'Architecture review',
        slotToken,
        website: '',
      }),
    });

    const response = await handleCalendarBooking(
      request,
      ENV,
      {},
      {
        now: () => now,
        getAccessToken: async () => 'access-token',
        isSlotBusy: async () => true,
        createEvent,
      }
    );

    expect(response.status).toBe(409);
    expect(createEvent).not.toHaveBeenCalled();
  });

  it('rejects repeated bookings when the storage quota is exhausted', async () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const slotToken = await signSlotToken(
      ENV,
      {
        start: '2026-08-26T14:00:00.000Z',
        end: '2026-08-26T14:30:00.000Z',
      },
      { now, ttlSeconds: 600 }
    );
    const createEvent = vi.fn();
    const request = new Request('https://worker.test/api/calendar/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        topic: 'Architecture review',
        slotToken,
        website: '',
      }),
    });

    const response = await handleCalendarBooking(
      request,
      ENV,
      {},
      {
        now: () => now,
        getAccessToken: async () => 'access-token',
        isSlotBusy: async () => false,
        reserveBooking: async () => ({ id: null, conflict: false, rateLimited: true }),
        createEvent,
      }
    );

    expect(response.status).toBe(429);
    expect(createEvent).not.toHaveBeenCalled();
  });
});

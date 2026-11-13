import { EDGE_API_BASE } from '../utils/api-host.js';

export const CALENDAR_SYNC_INTERVAL = 15 * 60 * 1000;
export const CALENDAR_OWNER_URL = `${EDGE_API_BASE}/api/calendar-sync/owner`;

function publicUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

export function mapPublicCalendarEvent(event) {
  if (
    !event ||
    !['events', 'luma'].includes(event.category) ||
    typeof event.id !== 'string' ||
    typeof event.title !== 'string' ||
    typeof event.start !== 'string' ||
    !Number.isFinite(Date.parse(event.start))
  ) {
    throw new Error('Invalid public calendar event');
  }
  const start = new Date(event.start);
  const timeZone = event.timeZone || 'UTC';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(start);
  const part = type => parts.find(value => value.type === type).value;
  const day = event.allDay
    ? event.start.slice(0, 10)
    : `${part('year')}-${part('month')}-${part('day')}`;
  const url = publicUrl(event.url);
  const isLuma = event.category === 'luma';
  return {
    id: `synced:${event.id}`,
    text: event.title,
    dateKey: day,
    startAt: event.start,
    endAt: event.end || null,
    time: event.allDay
      ? 'All Day'
      : new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        }).format(start),
    timeZone,
    category: 'events',
    color: 'blue',
    icon: isLuma ? 'ticket' : 'calendar',
    tag: isLuma ? 'Luma' : 'Event',
    isSynced: true,
    sourceFreshness: 'live',
    isLuma,
    url,
    lumaUrl: isLuma ? url : '',
    lumaStatus: ['going', 'waitlisted', 'pending', 'invited', 'attended'].includes(event.rsvp)
      ? event.rsvp
      : '',
  };
}

export function reconcilePublicCalendar(current, snapshot) {
  if (!snapshot || typeof snapshot.configured !== 'boolean') {
    throw new Error('Invalid calendar snapshot');
  }
  if (!snapshot.configured) return current;
  if (!Array.isArray(snapshot.events)) throw new Error('Missing calendar events');
  const events = snapshot.events.map(mapPublicCalendarEvent);
  return [
    ...current.filter(item => !item.isSynced || item.isCustomUserReminder || item.isChangelog),
    ...events,
  ];
}

export async function fetchPublicCalendar(fetcher = globalThis.fetch, signal) {
  const response = await fetcher(`${EDGE_API_BASE}/api/calendar-sync/public`, {
    credentials: 'omit',
    cache: 'no-store',
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Calendar sync unavailable');
  return response.json();
}

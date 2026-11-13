import { digest } from './security.js';
export function cleanText(value, max = 300) {
  return typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001f]/g, ' ')
        .trim()
        .slice(0, max)
    : '';
}
export function safeEventUrl(value) {
  try {
    const url = new URL(value);
    // Only canonical Luma pages are disclosed; arbitrary provider URLs can contain join secrets.
    if (
      url.protocol !== 'https:' ||
      !['lu.ma', 'luma.com'].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port ||
      !/^\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname) ||
      /^(?:\/)(?:ical|calendar|user|ticket|join|settings)(?:\/|$)/i.test(url.pathname)
    )
      return '';
    return `${url.origin}${url.pathname}`;
  } catch {
    return '';
  }
}
function instant(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '')
    ? value
    : Number.isFinite(Date.parse(value))
      ? new Date(value).toISOString()
      : '';
}
function match(left, right) {
  if (
    `${left.sourceId}:${left.calendarId}` === `${right.sourceId}:${right.calendarId}` ||
    Boolean(left.allDay) !== Boolean(right.allDay)
  )
    return false;
  if (left.uid && right.uid)
    return left.uid === right.uid && (left.recurrenceId || '') === (right.recurrenceId || '');
  if (left.recurrenceId || right.recurrenceId) return false;
  return (
    cleanText(left.title).toLowerCase() === cleanText(right.title).toLowerCase() &&
    instant(left.start) === instant(right.start) &&
    instant(left.end) === instant(right.end)
  );
}
export function deduplicate(events) {
  const groups = [];
  for (const event of events) {
    if (event.status === 'cancelled') continue;
    const group = groups.find(items => items.every(item => match(item, event)));
    if (group) group.push(event);
    else groups.push([event]);
  }
  return groups.map(items => ({
    ...items[0],
    provenance: items.map(item => ({ sourceId: item.sourceId, id: item.id })),
  }));
}
export async function publicSnapshot(sources) {
  const eligible = sources
    .filter(source => source.settings?.publicationEnabled !== false)
    .flatMap(source =>
      (source.snapshot?.events || [])
        .filter(
          event =>
            event.visibility === 'public' &&
            (source.provider === 'luma' ||
              source.provider === 'google' ||
              source.provider === 'apple')
        )
        .map(event => ({ ...event, sourceId: source.id, provider: source.provider }))
    );
  const events = deduplicate(eligible)
    .map(event => ({
      id: `${event.sourceId}:${event.id}`,
      title: cleanText(event.title),
      start: event.start,
      end: event.end,
      allDay: Boolean(event.allDay),
      timeZone: cleanText(event.timeZone, 100) || 'UTC',
      category: event.provider === 'luma' ? 'luma' : 'events',
      url: safeEventUrl(event.url),
      rsvp: ['accepted', 'declined', 'tentative', 'needsAction'].includes(event.rsvp)
        ? event.rsvp
        : null,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
  return Promise.all(events.map(async event => ({ ...event, id: await digest(event.id) })));
}
export function validateAppleSnapshot(payload, previous = {}) {
  const invalid = () => {
    throw Object.assign(new Error('invalid_apple_snapshot'), { status: 400 });
  };
  if (
    payload.schemaVersion !== 1 ||
    !/^[0-9a-f-]{36}$/i.test(payload.snapshotId || '') ||
    !Number.isFinite(Date.parse(payload.generatedAt)) ||
    Date.parse(payload.generatedAt) > Date.now() + 300_000
  )
    invalid();
  if (previous.snapshotId === payload.snapshotId) return null;
  if (previous.generatedAt && Date.parse(payload.generatedAt) <= Date.parse(previous.generatedAt))
    throw Object.assign(new Error('outdated_snapshot'), { status: 409 });
  if (
    !payload.window ||
    !Number.isFinite(Date.parse(payload.window.start)) ||
    !Number.isFinite(Date.parse(payload.window.end)) ||
    Date.parse(payload.window.end) <= Date.parse(payload.window.start)
  )
    invalid();
  if (
    !Array.isArray(payload.calendars) ||
    !Array.isArray(payload.events) ||
    !Array.isArray(payload.reminders) ||
    payload.events.length > 10000 ||
    payload.reminders.length > 10000 ||
    payload.calendars.length > 500
  )
    invalid();
  const calendars = payload.calendars.map(c => {
    if (!c.id || typeof c.id !== 'string' || c.id.length > 500) invalid();
    return {
      id: c.id,
      title: cleanText(c.title),
      sourceType: cleanText(String(c.sourceType ?? '')),
      sourceTitle: cleanText(c.sourceTitle),
    };
  });
  if (new Set(calendars.map(c => c.id)).size !== calendars.length) invalid();
  const ids = new Set(calendars.map(c => c.id));
  const keys = new Set();
  const events = payload.events.map(e => {
    if (
      !e.id ||
      typeof e.id !== 'string' ||
      e.id.length > 1000 ||
      !ids.has(e.calendarId) ||
      !instant(e.start) ||
      !instant(e.end) ||
      Date.parse(e.end) < Date.parse(e.start)
    )
      invalid();
    const key = `${e.calendarId}:${e.id}`;
    if (keys.has(key)) invalid();
    keys.add(key);
    return {
      id: key,
      calendarId: e.calendarId,
      uid: cleanText(e.uid, 1000),
      recurrenceId: instant(e.recurrenceId) || '',
      title: cleanText(e.title),
      start: instant(e.start),
      end: instant(e.end),
      allDay: Boolean(e.allDay),
      timeZone: cleanText(e.timeZone, 100),
      visibility: e.visibility === 'public' ? 'public' : 'private',
      url: safeEventUrl(e.url),
      status: e.status === 'cancelled' ? 'cancelled' : 'confirmed',
    };
  });
  const reminderKeys = new Set();
  const reminders = payload.reminders.map(r => {
    if (!r.id || typeof r.id !== 'string' || !ids.has(r.calendarId)) invalid();
    const key = `${r.calendarId}:${r.id}`;
    if (reminderKeys.has(key)) invalid();
    reminderKeys.add(key);
    return {
      id: key,
      calendarId: r.calendarId,
      title: cleanText(r.title),
      due: instant(r.due) || null,
      completed: Boolean(r.completed),
      completedAt: instant(r.completedAt) || null,
    };
  });
  return {
    schemaVersion: 1,
    snapshotId: payload.snapshotId,
    generatedAt: new Date(payload.generatedAt).toISOString(),
    window: payload.window,
    calendars,
    events: [
      ...events,
      ...(previous.events || []).filter(
        e =>
          !keys.has(e.id) &&
          (Date.parse(e.end) < Date.parse(payload.window.start) ||
            Date.parse(e.start) >= Date.parse(payload.window.end))
      ),
    ],
    reminders,
    passes: [],
  };
}

import ICAL from 'ical.js';
import { fetchBounded, open } from './security.js';
import { cleanText, safeEventUrl } from './normalize.js';

export function validateLumaFeed(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Object.assign(new Error('invalid_luma_feed'), { status: 400 });
  }
  if (
    url.protocol !== 'https:' ||
    !['api.luma.com', 'api.lu.ma'].includes(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/ics/get' ||
    url.searchParams.get('entity') !== 'user' ||
    !url.searchParams.get('id')
  )
    throw Object.assign(new Error('invalid_luma_feed'), { status: 400 });
  return url.href;
}
function icalTime(value) {
  if (!value) throw new Error('ical_date_missing');
  if (!value.isDate && value.zone?.tzid === 'floating') throw new Error('ical_timezone_missing');
  return value.isDate ? value.toString() : value.toJSDate().toISOString();
}
function canonicalDescriptionUrl(component) {
  const description = String(component.getFirstPropertyValue('description') || '');
  const candidates =
    description.match(/https:\/\/(?:lu\.ma|luma\.com)\/[a-zA-Z0-9_-]+(?=$|[\s)>])/g) || [];
  return candidates.map(safeEventUrl).find(Boolean) || '';
}
function revision(component) {
  return [
    Number(component.getFirstPropertyValue('sequence') || 0),
    component.getFirstPropertyValue('dtstamp')?.toUnixTime() || 0,
  ];
}
export function parseLumaFeed(text, previous = [], now = new Date()) {
  if (!/^BEGIN:VCALENDAR\s*$/m.test(text.replace(/\r/g, ''))) throw new Error('invalid_ical_feed');
  const root = new ICAL.Component(ICAL.parse(text));
  if (root.name !== 'vcalendar') throw new Error('invalid_ical_feed');
  const selected = new Map();
  for (const component of root.getAllSubcomponents('vevent')) {
    const uid = component.getFirstPropertyValue('uid');
    if (!uid) throw new Error('ical_uid_missing');
    const key = `${uid}|${component.getFirstPropertyValue('recurrence-id')?.toString() || ''}`;
    const old = selected.get(key);
    const currentRevision = revision(component);
    const oldRevision = old ? revision(old) : [-1, -1];
    if (
      !old ||
      currentRevision[0] > oldRevision[0] ||
      (currentRevision[0] === oldRevision[0] && currentRevision[1] >= oldRevision[1])
    )
      selected.set(key, component);
  }
  const components = [...selected.values()];
  const events = [];
  const deletedUids = new Set();
  const lower = new Date(now.getTime() - 366 * 86400000);
  const upper = new Date(now.getTime() + 730 * 86400000);
  const add = (master, component, start, end, recurrenceId = '') => {
    const status = String(component.getFirstPropertyValue('status') || '').toLowerCase();
    if (status === 'cancelled') return;
    const classification = String(
      component.getFirstPropertyValue('class') ||
        master.component.getFirstPropertyValue('class') ||
        ''
    ).toLowerCase();
    const url = safeEventUrl(
      component.getFirstPropertyValue('url') ||
        master.component.getFirstPropertyValue('url') ||
        canonicalDescriptionUrl(component) ||
        canonicalDescriptionUrl(master.component)
    );
    events.push({
      id: `${master.uid}:${recurrenceId}`,
      calendarId: 'personal',
      uid: master.uid,
      recurrenceId,
      title: cleanText(component.getFirstPropertyValue('summary') || master.summary),
      start: icalTime(start),
      end: icalTime(end),
      allDay: start.isDate,
      timeZone: start.isDate ? 'UTC' : start.zone?.tzid || 'UTC',
      visibility: ['private', 'confidential'].includes(classification) ? 'private' : 'public',
      url,
      status: 'confirmed',
      rsvp: null,
      lastVerifiedAt: now.toISOString(),
    });
  };
  const masters = components.filter(c => !c.hasProperty('recurrence-id'));
  for (const component of masters) {
    const master = new ICAL.Event(component, { exceptions: [] });
    if (String(component.getFirstPropertyValue('status')).toLowerCase() === 'cancelled') {
      deletedUids.add(master.uid);
      continue;
    }
    for (const exception of components.filter(
      c => c.hasProperty('recurrence-id') && c.getFirstPropertyValue('uid') === master.uid
    ))
      master.relateException(exception);
    if (!master.isRecurring()) {
      add(master, component, master.startDate, master.endDate);
      continue;
    }
    const iterator = master.iterator();
    let finished = false;
    for (let count = 0; count < 20000; count++) {
      const occurrence = iterator.next();
      if (!occurrence || occurrence.toJSDate() >= upper) {
        finished = true;
        break;
      }
      const cancelled = components.some(
        c =>
          c.getFirstPropertyValue('uid') === master.uid &&
          String(c.getFirstPropertyValue('status')).toLowerCase() === 'cancelled' &&
          c.hasProperty('recurrence-id') &&
          icalTime(c.getFirstPropertyValue('recurrence-id')) === icalTime(occurrence)
      );
      if (cancelled) continue;
      const detail = master.getOccurrenceDetails(occurrence);
      if (detail.endDate.toJSDate() >= lower)
        add(master, detail.item.component, detail.startDate, detail.endDate, icalTime(occurrence));
    }
    if (!finished) throw new Error('ical_recurrence_limit');
  }
  // Detached exceptions may be delivered without a master in an otherwise valid feed.
  const masterUids = new Set(masters.map(c => c.getFirstPropertyValue('uid')));
  for (const component of components.filter(
    c => c.hasProperty('recurrence-id') && !masterUids.has(c.getFirstPropertyValue('uid'))
  )) {
    if (String(component.getFirstPropertyValue('status')).toLowerCase() === 'cancelled') continue;
    const event = new ICAL.Event(component, { exceptions: [] });
    add(event, component, event.startDate, event.endDate, icalTime(event.recurrenceId));
  }
  if (events.length > 10000) throw new Error('ical_item_limit');
  const current = new Set(events.map(e => e.id));
  const canceledIds = new Set(
    components
      .filter(
        c =>
          String(c.getFirstPropertyValue('status')).toLowerCase() === 'cancelled' &&
          c.hasProperty('recurrence-id')
      )
      .map(
        c =>
          `${c.getFirstPropertyValue('uid')}:${icalTime(c.getFirstPropertyValue('recurrence-id'))}`
      )
  );
  // Keep verified past records if the subscription ages them out, but honor explicit cancellations.
  events.push(
    ...previous.filter(
      e =>
        Date.parse(e.end) < now.getTime() &&
        !current.has(e.id) &&
        !(
          e.historicalSnapshot &&
          events.some(
            currentEvent =>
              cleanText(currentEvent.title).toLowerCase() === cleanText(e.title).toLowerCase() &&
              Date.parse(currentEvent.start) === Date.parse(e.start)
          )
        ) &&
        !deletedUids.has(e.uid) &&
        !canceledIds.has(e.id)
    )
  );
  return {
    calendars: [{ id: 'personal', title: 'Luma personal events' }],
    events,
    reminders: [],
    passes: events.map(e => ({
      id: e.id,
      title: e.title,
      url: e.url || 'https://luma.com/home',
      kind: 'event-page',
    })),
  };
}
export async function lumaSnapshot(env, source) {
  const { feedUrl } = await open(env, `credentials:${source.id}`, source.credentials);
  const text = await fetchBounded(validateLumaFeed(feedUrl), {
    headers: { Accept: 'text/calendar' },
  });
  return {
    snapshot: parseLumaFeed(text, source.snapshot?.events || []),
    last_success: new Date().toISOString(),
    error: null,
  };
}

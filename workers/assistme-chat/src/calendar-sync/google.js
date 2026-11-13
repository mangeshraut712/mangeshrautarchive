import { fetchBounded, open, seal } from './security.js';
import { cleanText, safeEventUrl } from './normalize.js';
const EVENT_QUERY_VERSION = 2;
export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
];
export async function googleJson(url, token) {
  return JSON.parse(await fetchBounded(url, { headers: { Authorization: `Bearer ${token}` } }));
}
export async function paginate(url, token, limit = 100) {
  const items = [];
  let pageToken = '';
  let syncToken = null;
  const seen = new Set();
  for (let page = 0; page < limit; page++) {
    const next = new URL(url);
    if (pageToken) next.searchParams.set('pageToken', pageToken);
    const result = await googleJson(next, token);
    if (result.items !== undefined && !Array.isArray(result.items))
      throw new Error('invalid_provider_page');
    items.push(...(result.items || []));
    if (items.length > 50000) throw new Error('provider_item_limit');
    pageToken = result.nextPageToken || '';
    syncToken = result.nextSyncToken || null;
    if (!pageToken) return { items, syncToken };
    if (seen.has(pageToken)) throw new Error('provider_page_cycle');
    seen.add(pageToken);
  }
  throw new Error('provider_page_limit');
}
export async function refreshGoogleCredentials(env, source) {
  const credentials = await open(env, `credentials:${source.id}`, source.credentials);
  if (credentials.expiresAt > Date.now() + 60000) return credentials;
  if (!credentials.refreshToken)
    throw Object.assign(new Error('reconnect_required'), { providerStatus: 401 });
  const data = JSON.parse(
    await fetchBounded('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
        client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
    })
  );
  if (!data.access_token) throw new Error('google_token_missing');
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || credentials.refreshToken,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
}
function eventRow(event, calendar) {
  return {
    id: `${calendar.id}:${event.id}`,
    calendarId: calendar.id,
    uid: event.iCalUID || '',
    recurrenceId: event.originalStartTime?.dateTime
      ? new Date(event.originalStartTime.dateTime).toISOString()
      : event.originalStartTime?.date || '',
    title: cleanText(event.summary || '(Untitled event)'),
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    allDay: Boolean(event.start?.date),
    timeZone: event.start?.timeZone || calendar.timeZone || 'UTC',
    visibility: event.visibility === 'public' ? 'public' : 'private',
    status: event.status || 'confirmed',
    url: safeEventUrl(event.source?.url),
    rsvp: event.attendees?.find(a => a.self)?.responseStatus || null,
  };
}
export async function googleSnapshot(env, source) {
  const credentials = await refreshGoogleCredentials(env, source);
  const token = credentials.accessToken;
  const { items: rawCalendars } = await paginate(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
    token
  );
  const calendars = rawCalendars
    .filter(c => !c.deleted)
    .map(c => ({ id: c.id, title: cleanText(c.summary), timeZone: c.timeZone || 'UTC' }));
  const events = [];
  const cursors = {};
  // The full sync uses a fixed, bounded recurrence window; roll it monthly to include new future instances.
  const month = new Date().toISOString().slice(0, 7);
  const previous = source.snapshot || {};
  const window =
    previous.windowMonth === month
      ? previous.window
      : {
          start: new Date(Date.now() - 366 * 86400000).toISOString(),
          end: new Date(Date.now() + 730 * 86400000).toISOString(),
        };
  for (const calendar of calendars) {
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`;
    let cursor =
      previous.windowMonth === month && previous.eventQueryVersion === EVENT_QUERY_VERSION
        ? previous.cursors?.[calendar.id]
        : null;
    const query = () => {
      const url = new URL(base);
      url.search = new URLSearchParams({
        maxResults: '2500',
        singleEvents: 'true',
        ...(cursor ? { syncToken: cursor } : { timeMin: window.start, timeMax: window.end }),
      }).toString();
      return url;
    };
    let result;
    try {
      result = await paginate(query(), token);
    } catch (error) {
      if (error.providerStatus !== 410 || !cursor) throw error;
      cursor = null;
      result = await paginate(query(), token);
    }
    if (!result.syncToken) throw new Error('google_sync_cursor_missing');
    const merged = new Map(
      cursor
        ? (previous.events || []).filter(e => e.calendarId === calendar.id).map(e => [e.id, e])
        : []
    );
    for (const event of result.items) {
      const id = `${calendar.id}:${event.id}`;
      if (event.status === 'cancelled') {
        merged.delete(id);
        continue;
      }
      if (
        !event.id ||
        !(event.start?.date || event.start?.dateTime) ||
        !(event.end?.date || event.end?.dateTime)
      )
        throw new Error('google_event_incomplete');
      const normalized = eventRow(event, calendar);
      if (
        Date.parse(normalized.start) < Date.parse(window.end) &&
        Date.parse(normalized.end) >= Date.parse(window.start)
      )
        merged.set(id, normalized);
      else merged.delete(id);
    }
    events.push(...merged.values());
    cursors[calendar.id] = result.syncToken;
  }
  const { items: lists } = await paginate(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100',
    token
  );
  const reminders = [];
  for (const list of lists) {
    const { items } = await paginate(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?maxResults=100&showCompleted=true&showHidden=true&showAssigned=true`,
      token
    );
    reminders.push(
      ...items
        .filter(t => !t.deleted)
        .map(t => ({
          id: `${list.id}:${t.id}`,
          calendarId: list.id,
          listTitle: cleanText(list.title),
          title: cleanText(t.title),
          due: typeof t.due === 'string' ? t.due.slice(0, 10) : null,
          completed: t.status === 'completed',
          completedAt: t.completed || null,
          url: 'https://tasks.google.com/',
        }))
    );
  }
  return {
    credentials: await seal(env, `credentials:${source.id}`, credentials),
    snapshot: {
      calendars,
      events,
      reminders,
      passes: [],
      cursors,
      window,
      windowMonth: month,
      eventQueryVersion: EVENT_QUERY_VERSION,
    },
    last_success: new Date().toISOString(),
    error: null,
  };
}

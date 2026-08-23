import { getValidAccessToken, persistOAuthTokens } from './health-sync.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';
const GOOGLE_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const DEFAULT_REDIRECT_URI =
  'https://assistme-chat.mangeshraut712.workers.dev/api/calendar/callback/google';
const CALENDAR_TIME_ZONE = 'America/New_York';
const SLOT_MINUTES = 30;
const MIN_LEAD_MS = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

function json(body, status = 200, cors = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}

function calendarConfigured(env) {
  return Boolean(
    String(env.GOOGLE_CALENDAR_CLIENT_ID || '').trim() &&
    String(env.GOOGLE_CALENDAR_CLIENT_SECRET || '').trim()
  );
}

export function googleCalendarRedirectUri(env) {
  return String(env.GOOGLE_CALENDAR_REDIRECT_URI || '').trim() || DEFAULT_REDIRECT_URI;
}

function signingSecret(env) {
  return (
    String(env.INTEGRATION_ENCRYPTION_KEY || '').trim() ||
    String(env.INTEGRATION_SYNC_ADMIN_TOKEN || '').trim()
  );
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToText(value) {
  const normalized = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

async function signPayload(env, payload) {
  const secret = signingSecret(env);
  if (!secret) throw new Error('calendar_signing_secret_missing');
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${encoded}.${await hmacHex(secret, encoded)}`;
}

async function verifyPayload(env, token, kind, now = new Date()) {
  try {
    const [encoded, suppliedSignature] = String(token || '').split('.');
    if (!encoded || !suppliedSignature) return null;
    const expected = await hmacHex(signingSecret(env), encoded);
    if (!constantTimeEqual(suppliedSignature, expected)) return null;
    const payload = JSON.parse(base64UrlToText(encoded));
    if (payload.kind !== kind || Number(payload.exp) < Math.floor(now.getTime() / 1000))
      return null;
    return payload;
  } catch {
    return null;
  }
}

export async function signSlotToken(env, slot, { now = new Date(), ttlSeconds = 900 } = {}) {
  return signPayload(env, {
    kind: 'calendar-slot',
    start: slot.start,
    end: slot.end,
    exp: Math.floor(now.getTime() / 1000) + ttlSeconds,
  });
}

export function verifySlotToken(env, token, { now = new Date() } = {}) {
  return verifyPayload(env, token, 'calendar-slot', now);
}

function timeZoneParts(date, timeZone = CALENDAR_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(
    parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value])
  );
}

function timeZoneOffsetMs(date, timeZone) {
  const parts = timeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(year, month, day, hour, minute, timeZone) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  let result = new Date(guess.getTime() - timeZoneOffsetMs(guess, timeZone));
  result = new Date(guess.getTime() - timeZoneOffsetMs(result, timeZone));
  return result;
}

function overlapsBusy(start, end, busy) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return busy.some(block => {
    const busyStart = Date.parse(block?.start || '');
    const busyEnd = Date.parse(block?.end || '');
    return (
      Number.isFinite(busyStart) &&
      Number.isFinite(busyEnd) &&
      startMs < busyEnd &&
      endMs > busyStart
    );
  });
}

export function generateAvailableSlots({
  now = new Date(),
  busy = [],
  days = 14,
  maxSlots = 24,
} = {}) {
  const local = timeZoneParts(now);
  const base = new Date(
    Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day), 12)
  );
  const earliest = now.getTime() + MIN_LEAD_MS;
  const slots = [];

  for (let offset = 0; offset < Math.max(1, Math.min(days, 14)); offset += 1) {
    const date = new Date(base.getTime());
    date.setUTCDate(base.getUTCDate() + offset);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    for (let minutes = 10 * 60; minutes < 16 * 60; minutes += SLOT_MINUTES) {
      const start = zonedDateTimeToUtc(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        Math.floor(minutes / 60),
        minutes % 60,
        CALENDAR_TIME_ZONE
      );
      const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
      if (start.getTime() < earliest || overlapsBusy(start, end, busy)) continue;
      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        timeZone: CALENDAR_TIME_ZONE,
      });
      if (slots.length >= maxSlots) return slots;
    }
  }
  return slots;
}

export function buildGoogleAuthorizeUrl(env, state) {
  const params = new URLSearchParams({
    client_id: String(env.GOOGLE_CALENDAR_CLIENT_ID || '').trim(),
    redirect_uri: googleCalendarRedirectUri(env),
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export function createCalendarEventPayload({ bookingId, name, email, topic, start, end }) {
  return {
    summary: `Portfolio consultation with ${name}`,
    description: `Requested topic: ${topic}\n\nBooked from Mangesh Raut's portfolio.`,
    start: { dateTime: start, timeZone: CALENDAR_TIME_ZONE },
    end: { dateTime: end, timeZone: CALENDAR_TIME_ZONE },
    attendees: [{ email, displayName: name }],
    visibility: 'private',
    transparency: 'opaque',
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: false,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 },
        { method: 'popup', minutes: 30 },
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: `portfolio-${bookingId}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    extendedProperties: { private: { bookingId, source: 'portfolio-contact' } },
  };
}

function supabaseConfig(env) {
  return {
    base: String(env.SUPABASE_URL || '')
      .trim()
      .replace(/\/$/, ''),
    key: String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  };
}

function supabaseHeaders(env, extra = {}) {
  const { key } = supabaseConfig(env);
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function reserveBookingDefault(env, record) {
  const { base, key } = supabaseConfig(env);
  if (!base || !key) return { id: null, conflict: false, error: 'storage_unavailable' };
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const quota = new URL(`${base}/rest/v1/calendar_bookings`);
  quota.searchParams.set('select', 'id');
  quota.searchParams.set('attendee_email', `eq.${record.attendee_email}`);
  quota.searchParams.set('created_at', `gte.${since}`);
  quota.searchParams.set('status', 'in.(pending,confirmed)');
  quota.searchParams.set('limit', '2');
  const quotaResponse = await fetch(quota, { headers: supabaseHeaders(env) });
  if (!quotaResponse.ok) return { id: null, conflict: false, error: 'storage_rejected' };
  const recent = await quotaResponse.json();
  if (Array.isArray(recent) && recent.length >= 2) {
    return { id: null, conflict: false, rateLimited: true };
  }
  const response = await fetch(`${base}/rest/v1/calendar_bookings`, {
    method: 'POST',
    headers: supabaseHeaders(env, { Prefer: 'return=representation' }),
    body: JSON.stringify(record),
  });
  if (response.status === 409) return { id: null, conflict: true };
  if (!response.ok) return { id: null, conflict: false, error: 'storage_rejected' };
  const rows = await response.json();
  return { id: rows?.[0]?.id || null, conflict: false };
}

async function patchBooking(env, id, payload) {
  const { base, key } = supabaseConfig(env);
  if (!base || !key || !id) return false;
  const response = await fetch(
    `${base}/rest/v1/calendar_bookings?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: supabaseHeaders(env),
      body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
    }
  );
  return response.ok;
}

async function fetchBusyRanges(accessToken, start, end) {
  const response = await fetch(GOOGLE_FREEBUSY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: start,
      timeMax: end,
      timeZone: CALENDAR_TIME_ZONE,
      items: [{ id: 'primary' }],
    }),
  });
  if (!response.ok) throw new Error(`google_freebusy_${response.status}`);
  const body = await response.json();
  return body?.calendars?.primary?.busy || [];
}

async function isSlotBusyDefault(accessToken, start, end) {
  const busy = await fetchBusyRanges(accessToken, start, end);
  return overlapsBusy(new Date(start), new Date(end), busy);
}

async function createEventDefault(accessToken, event) {
  const url = `${GOOGLE_EVENTS_URL}?sendUpdates=all&conferenceDataVersion=1`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error(`google_event_insert_${response.status}`);
  return response.json();
}

function clean(value, maxLength) {
  return String(value || '')
    .trim()
    .slice(0, maxLength);
}

export async function handleCalendarBooking(request, env, cors = {}, overrides = {}) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400, cors);
  }
  const name = clean(payload?.name, 100);
  const email = clean(payload?.email, 200).toLowerCase();
  const topic = clean(payload?.topic, 500);
  if (
    clean(payload?.website, 100) ||
    !name ||
    !EMAIL_RE.test(email) ||
    !topic ||
    !payload?.slotToken
  ) {
    return json({ success: false, error: 'Check all booking fields.' }, 400, cors);
  }

  const deps = {
    now: () => new Date(),
    getAccessToken: getValidAccessToken,
    isSlotBusy: isSlotBusyDefault,
    reserveBooking: record => reserveBookingDefault(env, record),
    createEvent: createEventDefault,
    confirmBooking: (id, data) =>
      patchBooking(env, id, {
        status: 'confirmed',
        google_event_id: data.eventId,
        google_event_link: data.eventLink,
        failure_reason: null,
      }),
    failBooking: (id, reason) =>
      patchBooking(env, id, { status: 'failed', failure_reason: clean(reason, 200) }),
    ...overrides,
  };
  const now = deps.now();
  const slot = await verifySlotToken(env, payload.slotToken, { now });
  const startMs = Date.parse(slot?.start || '');
  const endMs = Date.parse(slot?.end || '');
  if (
    !slot ||
    !Number.isFinite(startMs) ||
    endMs - startMs !== SLOT_MINUTES * 60_000 ||
    startMs < now.getTime() + MIN_LEAD_MS
  ) {
    return json({ success: false, error: 'This booking slot is invalid or expired.' }, 400, cors);
  }

  const accessToken = await deps.getAccessToken(env, 'google_calendar');
  if (!accessToken) {
    return json(
      { success: false, error: 'Calendar connection needs owner authorization.' },
      503,
      cors
    );
  }
  if (await deps.isSlotBusy(accessToken, slot.start, slot.end)) {
    return json(
      { success: false, error: 'That time was just booked. Choose another slot.' },
      409,
      cors
    );
  }

  const reservation = await deps.reserveBooking({
    attendee_name: name,
    attendee_email: email,
    topic,
    start_at: slot.start,
    end_at: slot.end,
    time_zone: CALENDAR_TIME_ZONE,
    status: 'pending',
    source: clean(payload.source, 64) || 'github_pages_calendar',
    landing_path: clean(payload.landingPath, 512) || '/',
    referrer: clean(payload.referrer, 1024),
    user_agent: clean(request.headers.get('user-agent'), 512),
  });
  if (reservation.conflict) {
    return json(
      { success: false, error: 'That time was just booked. Choose another slot.' },
      409,
      cors
    );
  }
  if (reservation.rateLimited) {
    return json({ success: false, error: 'Booking limit reached. Try again tomorrow.' }, 429, cors);
  }
  if (!reservation.id) {
    return json({ success: false, error: 'Booking storage is unavailable.' }, 503, cors);
  }

  try {
    const event = createCalendarEventPayload({
      bookingId: reservation.id,
      name,
      email,
      topic,
      start: slot.start,
      end: slot.end,
    });
    const created = await deps.createEvent(accessToken, event);
    await deps.confirmBooking(reservation.id, {
      eventId: created.id,
      eventLink: created.htmlLink || '',
    });
    return json(
      {
        success: true,
        persisted: true,
        eventCreated: true,
        invitationSent: true,
        bookingId: reservation.id,
        start: slot.start,
        end: slot.end,
        timeZone: CALENDAR_TIME_ZONE,
        message: 'Booked. Google Calendar emailed your invitation.',
      },
      200,
      cors
    );
  } catch (error) {
    await deps.failBooking(reservation.id, error?.message || 'calendar_event_failed');
    return json(
      { success: false, error: 'Google Calendar could not create the event.' },
      502,
      cors
    );
  }
}

export async function handleCalendarAvailability(request, env, cors = {}, overrides = {}) {
  if (!calendarConfigured(env)) {
    return json({ success: true, status: 'not_configured', slots: [] }, 200, cors);
  }
  const deps = {
    now: () => new Date(),
    getAccessToken: getValidAccessToken,
    fetchBusy: fetchBusyRanges,
    ...overrides,
  };
  const accessToken = await deps.getAccessToken(env, 'google_calendar');
  if (!accessToken) {
    return json({ success: true, status: 'needs_auth', slots: [] }, 200, cors);
  }
  const now = deps.now();
  try {
    const timeMin = new Date(now.getTime() + MIN_LEAD_MS).toISOString();
    const timeMax = new Date(now.getTime() + 15 * 86_400_000).toISOString();
    const busy = await deps.fetchBusy(accessToken, timeMin, timeMax);
    const unsigned = generateAvailableSlots({ now, busy });
    const slots = await Promise.all(
      unsigned.map(async slot => ({ ...slot, token: await signSlotToken(env, slot, { now }) }))
    );
    return json(
      {
        success: true,
        status: 'live',
        source: 'google-calendar',
        timeZone: CALENDAR_TIME_ZONE,
        durationMinutes: SLOT_MINUTES,
        slots,
        privacy: 'Only free booking slots are exposed; private event details stay hidden.',
      },
      200,
      cors
    );
  } catch {
    return json({ success: true, status: 'degraded', slots: [] }, 200, cors);
  }
}

export async function handleGoogleCalendarConnect(request, env, cors = {}) {
  if (!calendarConfigured(env))
    return json({ error: 'Google Calendar OAuth is not configured.' }, 503, cors);
  const auth = new URL(request.url).searchParams.get('auth');
  const owner = await verifyPayload(env, auth, 'calendar-connect');
  if (!owner) return json({ error: 'A signed owner connection URL is required.' }, 403, cors);
  const state = await signPayload(env, {
    kind: 'calendar-oauth',
    exp: Math.floor(Date.now() / 1000) + 900,
  });
  return new Response(null, {
    status: 302,
    headers: { Location: buildGoogleAuthorizeUrl(env, state), 'Cache-Control': 'no-store' },
  });
}

export async function handleGoogleCalendarCallback(request, env, cors = {}) {
  const url = new URL(request.url);
  if (url.searchParams.get('error')) {
    return json({ error: `Google OAuth error: ${url.searchParams.get('error')}` }, 400, cors);
  }
  const code = url.searchParams.get('code');
  const state = await verifyPayload(env, url.searchParams.get('state'), 'calendar-oauth');
  if (!code || !state) return json({ error: 'Invalid Google Calendar OAuth callback.' }, 400, cors);
  const body = new URLSearchParams({
    code,
    client_id: String(env.GOOGLE_CALENDAR_CLIENT_ID || '').trim(),
    client_secret: String(env.GOOGLE_CALENDAR_CLIENT_SECRET || '').trim(),
    redirect_uri: googleCalendarRedirectUri(env),
    grant_type: 'authorization_code',
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) return json({ error: 'Google Calendar token exchange failed.' }, 502, cors);
  const token = await response.json();
  const saved = await persistOAuthTokens(env, 'google_calendar', {
    providerSubject: 'google-calendar-owner',
    scopes: GOOGLE_CALENDAR_SCOPES,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
  });
  if (!saved) return json({ error: 'Google Calendar tokens could not be stored.' }, 502, cors);
  const destination = `${String(env.PUBLIC_SITE_URL || 'https://mangeshraut712.github.io/mangeshrautarchive').replace(/\/$/, '')}/#contact`;
  return new Response(null, {
    status: 302,
    headers: { Location: destination, 'Cache-Control': 'no-store' },
  });
}

export async function createGoogleCalendarOwnerUrl(env) {
  const token = await signPayload(env, {
    kind: 'calendar-connect',
    exp: Math.floor(Date.now() / 1000) + 600,
  });
  return `/api/integrations/google-calendar/connect?auth=${token}`;
}

export async function getGoogleCalendarStatus(env) {
  if (!calendarConfigured(env))
    return { configured: false, connected: false, status: 'not_configured' };
  const { base, key } = supabaseConfig(env);
  if (!base || !key) return { configured: true, connected: false, status: 'storage_unavailable' };
  try {
    const response = await fetch(
      `${base}/rest/v1/integration_accounts?select=status&provider=eq.google_calendar&limit=1`,
      { headers: supabaseHeaders(env) }
    );
    const rows = response.ok ? await response.json() : [];
    const status = rows?.[0]?.status || 'disconnected';
    return { configured: true, connected: status === 'connected', status };
  } catch {
    return { configured: true, connected: false, status: 'degraded' };
  }
}

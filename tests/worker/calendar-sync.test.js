import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleCalendarSync,
  syncCalendars,
} from '../../workers/assistme-chat/src/calendar-sync/index.js';
import {
  SourceStore,
  sourceErrorCode,
} from '../../workers/assistme-chat/src/calendar-sync/store.js';
import {
  fetchBounded,
  seal,
  open,
  digest,
  ownerSession,
  requireCsrf,
  SESSION_COOKIE,
  OAUTH_COOKIE,
} from '../../workers/assistme-chat/src/calendar-sync/security.js';
import {
  deduplicate,
  publicSnapshot,
  safeEventUrl,
  validateAppleSnapshot,
} from '../../workers/assistme-chat/src/calendar-sync/normalize.js';
import { googleSnapshot, paginate } from '../../workers/assistme-chat/src/calendar-sync/google.js';
import {
  parseLumaFeed,
  validateLumaFeed,
} from '../../workers/assistme-chat/src/calendar-sync/luma.js';

const env = {
  SUPABASE_URL: 'https://storage.example',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service',
  INTEGRATION_ENCRYPTION_KEY: 'test-encryption-material-only',
  CALENDAR_SYNC_OWNER_EMAILS: 'owner@example.com,second@example.com',
  GOOGLE_CALENDAR_CLIENT_ID: 'client',
  GOOGLE_CALENDAR_CLIENT_SECRET: 'test-client-secret',
};
const origin = 'https://worker.example';
const event = {
  id: 'one',
  calendarId: 'calendar',
  title: 'Meeting',
  start: '2026-11-13T10:00:00.000Z',
  end: '2026-11-13T11:00:00.000Z',
  uid: 'shared-uid',
  recurrenceId: '',
  allDay: false,
  visibility: 'public',
};
const source = (id = 'google:one') => ({
  id,
  provider: 'google',
  label: 'private@email.example',
  settings: {},
  snapshot: {
    events: [event],
    calendars: [{ id: 'calendar', title: 'Private calendar label' }],
    reminders: [{ title: 'Private task' }],
    passes: [],
  },
  version: 0,
  lock_token: null,
  lock_until: null,
  last_success: '2026-11-13T11:00:00Z',
});
function memoryStore(t, initial = []) {
  const rows = new Map(initial.map(row => [row.id, structuredClone(row)]));
  t.mock.method(globalThis, 'fetch', async (input, init = {}) => {
    const url = new URL(input);
    assert.equal(url.origin, env.SUPABASE_URL);
    const id = url.searchParams.get('id')?.slice(3);
    if (!init.method || init.method === 'GET')
      return Response.json(id ? (rows.has(id) ? [rows.get(id)] : []) : [...rows.values()]);
    const body = JSON.parse(init.body);
    if (init.method === 'POST') {
      if (!rows.has(body.id))
        rows.set(body.id, { ...source(body.id), snapshot: {}, last_success: null, ...body });
      return new Response(null, { status: 201 });
    }
    const row = rows.get(id);
    const expectedVersion = Number(url.searchParams.get('version')?.slice(3));
    const expectedLock = url.searchParams.get('lock_token')?.slice(3);
    const success =
      row &&
      row.version === expectedVersion &&
      (!expectedLock || expectedLock === row.lock_token) &&
      (!url.searchParams.has('or') || !row.lock_until || Date.parse(row.lock_until) < Date.now());
    if (!success) return Response.json([]);
    const next = { ...row, ...body };
    rows.set(id, next);
    return Response.json([next]);
  });
  return rows;
}
async function sessionCookie(email = 'owner@example.com') {
  return `${SESSION_COOKIE}=${await seal(env, 'session', { email, exp: Date.now() + 60000, csrf: 'csrf-value' })}`;
}
const request = (path, options) => new Request(`${origin}/api/calendar-sync${path}`, options);
const ics = events =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Test//EN\r\n${events}\r\nEND:VCALENDAR`;
const vevent = lines => `BEGIN:VEVENT\r\n${lines.join('\r\n')}\r\nEND:VEVENT`;
const simple = extras =>
  vevent([
    'UID:a',
    'DTSTART:20261113T100000Z',
    'DTEND:20261113T110000Z',
    'SUMMARY:Meet',
    ...extras,
  ]);

test('encryption binds records to purpose and rejects ciphertext tampering', async () => {
  const value = await seal(env, 'credentials:one', { token: 'private' });
  assert.deepEqual(await open(env, 'credentials:one', value), { token: 'private' });
  await assert.rejects(open(env, 'credentials:two', value));
  await assert.rejects(open(env, 'credentials:one', `${value.slice(0, -3)}aaa`));
  assert.ok(!value.includes('private'));
});
test('owner sessions require unexpired encrypted session and configured allowlist', async () => {
  assert.ok(
    await ownerSession(request('/private', { headers: { Cookie: await sessionCookie() } }), env)
  );
  assert.equal(
    await ownerSession(
      request('/private', { headers: { Cookie: await sessionCookie('intruder@example.com') } }),
      env
    ),
    null
  );
  assert.equal(await ownerSession(request('/private'), env), null);
});
test('CSRF rejects missing tokens and foreign origins', () => {
  assert.throws(() =>
    requireCsrf(
      request('/sync', { headers: { Origin: 'https://evil.example', 'X-CSRF-Token': 'yes' } }),
      { csrf: 'yes' }
    )
  );
  assert.throws(() =>
    requireCsrf(request('/sync', { headers: { Origin: origin } }), { csrf: 'yes' })
  );
  requireCsrf(request('/sync', { headers: { Origin: origin, 'X-CSRF-Token': 'yes' } }), {
    csrf: 'yes',
  });
});
test('anonymous owner API and writes reveal no private data', async () => {
  for (const [path, method] of [
    ['/private', 'GET'],
    ['/apple/token', 'POST'],
    ['/luma', 'POST'],
  ]) {
    const result = await handleCalendarSync(request(path, { method }), env);
    assert.equal(result.status, 401);
    assert.equal((await result.json()).error, 'owner_required');
  }
});
test('public API allowlists fields and never emits provider-private data or source labels', async t => {
  const row = source();
  row.snapshot.events.push({
    ...event,
    id: 'private',
    visibility: 'private',
    title: 'Secret appointment',
  });
  row.snapshot.events[0] = {
    ...event,
    description: 'Secret description',
    location: 'Home address',
    attendees: ['private@email.example'],
    url: 'https://meet.google.com/private-token',
  };
  memoryStore(t, [row]);
  const result = await handleCalendarSync(request('/public'), env);
  const payload = await result.json();
  assert.equal(payload.configured, true);
  assert.equal(payload.events.length, 1);
  assert.deepEqual(Object.keys(payload.events[0]), [
    'id',
    'title',
    'start',
    'end',
    'allDay',
    'timeZone',
    'category',
    'url',
    'rsvp',
  ]);
  assert.doesNotMatch(
    JSON.stringify(payload),
    /Secret|Home address|private@email|Private task|Private calendar|google:one.*provider/
  );
});
test('publication opt-out and provider-private events remain hidden', async () => {
  const row = source();
  row.settings.publicationEnabled = false;
  assert.deepEqual(await publicSnapshot([row]), []);
  row.settings = {};
  row.snapshot.events[0].visibility = 'default';
  assert.deepEqual(await publicSnapshot([row]), []);
});
test('dedup joins cross-account and cross-calendar copies but preserves same-calendar items', () => {
  const first = { ...event, sourceId: 'google:one' };
  const second = { ...event, id: 'copy', sourceId: 'apple:mac' };
  const sameCalendar = { ...first, id: 'separate' };
  assert.equal(deduplicate([first, second, sameCalendar]).length, 2);
  assert.equal(deduplicate([first, { ...first, calendarId: 'other' }]).length, 1);
  assert.equal(deduplicate([first, { ...second, recurrenceId: '2026-11-14T10:00:00Z' }]).length, 2);
});
test('fallback dedup normalizes offset instants without merging recurring instances', () => {
  const first = { ...event, uid: '', sourceId: 'google:one' };
  const second = { ...first, sourceId: 'luma:personal', start: '2026-11-13T05:00:00-05:00' };
  assert.equal(deduplicate([first, second]).length, 1);
  assert.equal(deduplicate([first, { ...second, recurrenceId: 'instance' }]).length, 2);
});
test('dedup preserves conflicting UIDs even through a missing-UID intermediary', () => {
  const first = { ...event, uid: 'first-uid', sourceId: 'google:one' };
  const second = { ...event, uid: 'second-uid', sourceId: 'google:two' };
  const intermediary = { ...event, uid: '', sourceId: 'luma:personal' };
  assert.equal(deduplicate([first, second]).length, 2);
  for (const ordering of [
    [first, intermediary, second],
    [intermediary, first, second],
    [first, second, intermediary],
    [second, intermediary, first],
    [intermediary, second, first],
    [second, first, intermediary],
  ]) {
    const groups = deduplicate(ordering);
    assert.equal(groups.length, 2);
    assert.ok(groups.every(group => group.provenance.length <= 2));
  }
});
test('URLs exclude arbitrary join links and keep only canonical Luma page paths', () => {
  assert.equal(safeEventUrl('https://meet.google.com/secret'), '');
  assert.equal(safeEventUrl('https://luma.com/event?token=secret'), 'https://luma.com/event');
  assert.equal(safeEventUrl('https://luma.com/ticket'), '');
  assert.equal(safeEventUrl('https://luma.com.evil.example/event'), '');
});
test('source leases serialize writers and failed refresh preserves prior snapshot', async t => {
  const rows = memoryStore(t, [source()]);
  const store = new SourceStore(env);
  const locked = await store.lock('google:one');
  await assert.rejects(store.lock('google:one'), /source_busy/);
  await store.finish(locked, {});
  await assert.rejects(
    store.mutate('google:one', async () => {
      throw new Error('partial fetch');
    })
  );
  assert.equal(rows.get('google:one').snapshot.events[0].title, 'Meeting');
  assert.equal(rows.get('google:one').error, 'refresh_failed');
  assert.equal(rows.get('google:one').lock_token, null);
});
test('source CAS refuses old writer after a lease was superseded', async t => {
  const rows = memoryStore(t, [source()]);
  const store = new SourceStore(env);
  const locked = await store.lock('google:one');
  rows.get('google:one').lock_until = '2000-01-01T00:00:00Z';
  await store.lock('google:one');
  await assert.rejects(store.finish(locked, { snapshot: {} }), /source_lock_lost/);
});
test('minimal insert response creates a source without JSON parsing failure', async t => {
  memoryStore(t);
  const store = new SourceStore(env);
  assert.equal((await store.ensure('apple:mac', 'apple', 'Mac')).provider, 'apple');
});
test('unconfigured scheduler and missing storage are safe no-ops', async t => {
  assert.equal((await syncCalendars({})).configured, false);
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
  assert.equal((await syncCalendars(env)).error, 'calendar_storage_unavailable');
});
test('OAuth connect uses PKCE, state and HttpOnly bounded cookie', async () => {
  const result = await handleCalendarSync(request('/google/connect'), env);
  assert.equal(result.status, 302);
  const url = new URL(result.headers.get('location'));
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.match(url.searchParams.get('state'), /^cs1\./);
  assert.match(result.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
});
test('OAuth rejects nonowners and mismatched state before writing credentials', async t => {
  const pending = { state: 'cs1.state', verifier: 'verifier', exp: Date.now() + 60000 };
  const cookie = `${OAUTH_COOKIE}=${await seal(env, 'oauth', pending)}`;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async input => {
    calls++;
    if (String(input).includes('oauth2.googleapis.com/token'))
      return Response.json({
        access_token: 'token',
        scope:
          'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly',
      });
    return Response.json({ sub: 'intruder', email: 'intruder@example.com', email_verified: true });
  });
  const wrong = await handleCalendarSync(
    new Request(`${origin}/api/calendar/callback/google?state=cs1.wrong&code=abc`, {
      headers: { Cookie: cookie },
    }),
    env
  );
  assert.equal(wrong.status, 400);
  assert.equal(calls, 0);
  const denied = await handleCalendarSync(
    new Request(`${origin}/api/calendar/callback/google?state=cs1.state&code=abc`, {
      headers: { Cookie: cookie },
    }),
    env
  );
  assert.equal(denied.status, 403);
  assert.equal(calls, 2);
});
test('Google pagination rejects repeated cursors and bounded truncation', async t => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ items: [], nextPageToken: 'repeat' })
  );
  await assert.rejects(
    paginate('https://www.googleapis.com/events', 'token'),
    /provider_page_cycle/
  );
  await assert.rejects(
    paginate('https://www.googleapis.com/events', 'token', 1),
    /provider_page_limit/
  );
});
test('Google expired cursor recovers full source; cancellations and completed tasks reconcile', async t => {
  const row = source();
  row.credentials = await seal(env, `credentials:${row.id}`, {
    accessToken: 'token',
    expiresAt: Date.now() + 3600000,
  });
  row.snapshot.cursors = { calendar: 'expired' };
  row.snapshot.eventQueryVersion = 2;
  row.snapshot.windowMonth = new Date().toISOString().slice(0, 7);
  row.snapshot.window = { start: '2025-01-01T00:00:00Z', end: '2028-01-01T00:00:00Z' };
  let expired = false;
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(input);
    if (url.pathname.endsWith('/calendarList'))
      return Response.json({ items: [{ id: 'calendar', summary: 'Calendar' }] });
    if (url.pathname.endsWith('/events')) {
      if (url.searchParams.get('syncToken')) {
        expired = true;
        return new Response('', { status: 410 });
      }
      return Response.json({
        items: [
          {
            id: 'replacement',
            summary: 'Rescheduled',
            visibility: 'private',
            start: { dateTime: '2026-11-15T10:00:00Z' },
            end: { dateTime: '2026-11-15T11:00:00Z' },
          },
          { id: 'one', status: 'cancelled' },
        ],
        nextSyncToken: 'fresh',
      });
    }
    if (url.pathname.endsWith('/@me/lists'))
      return Response.json({ items: [{ id: 'tasks', title: 'Tasks' }] });
    assert.equal(url.searchParams.get('showHidden'), 'true');
    return Response.json({
      items: [
        {
          id: 'done',
          title: 'Finished',
          status: 'completed',
          completed: '2026-11-12T00:00:00Z',
          due: '2026-11-13T00:00:00Z',
        },
      ],
    });
  });
  const result = await googleSnapshot(env, row);
  assert.ok(expired);
  assert.equal(result.snapshot.events.length, 1);
  assert.equal(result.snapshot.events[0].id, 'calendar:replacement');
  assert.equal(result.snapshot.reminders[0].completed, true);
  assert.equal(result.snapshot.reminders[0].due, '2026-11-13');
  assert.equal(result.snapshot.cursors.calendar, 'fresh');
});
test('Apple snapshots reject replay regression, preserve history outside window and keep reminders private', async () => {
  const payload = {
    schemaVersion: 1,
    snapshotId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    window: { start: '2026-01-01', end: '2027-01-01' },
    calendars: [{ id: 'calendar', title: 'Apple', sourceType: 2 }],
    events: [{ ...event, visibility: 'private' }],
    reminders: [
      { id: 'reminder', calendarId: 'calendar', title: 'Private reminder', completed: true },
    ],
  };
  const old = { ...event, id: 'old', start: '2020-01-01', end: '2020-01-02' };
  const snapshot = validateAppleSnapshot(payload, { events: [old] });
  assert.equal(snapshot.events.length, 2);
  assert.equal(snapshot.calendars[0].sourceType, '2');
  assert.equal(validateAppleSnapshot(payload, snapshot), null);
  assert.throws(
    () =>
      validateAppleSnapshot(
        { ...payload, snapshotId: crypto.randomUUID(), generatedAt: '2000-01-01' },
        snapshot
      ),
    /outdated_snapshot/
  );
  assert.equal(snapshot.reminders[0].completed, true);
  assert.deepEqual(
    await publicSnapshot([
      {
        ...source('apple:mac'),
        provider: 'apple',
        snapshot: { ...snapshot, events: snapshot.events.slice(0, 1) },
      },
    ]),
    []
  );
});
test('Apple upload token is scoped and revocation rejects upload', async t => {
  const token = 'a'.repeat(43);
  const row = {
    ...source('apple:mac'),
    provider: 'apple',
    settings: { uploadTokenHash: await digest(token) },
  };
  const rows = memoryStore(t, [row]);
  assert.equal(
    (
      await handleCalendarSync(
        request('/private', { headers: { Authorization: `Bearer ${token}` } }),
        env
      )
    ).status,
    401
  );
  rows.get('apple:mac').settings.uploadTokenHash = null;
  assert.equal(
    (
      await handleCalendarSync(
        request('/apple/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
        env
      )
    ).status,
    401
  );
});
test('Luma feed validation disallows redirects, arbitrary hosts and nonpersonal endpoints', () => {
  assert.match(
    validateLumaFeed('https://api.luma.com/ics/get?entity=user&id=token'),
    /api.luma.com/
  );
  for (const url of [
    'http://api.luma.com/ics/get?entity=user&id=x',
    'https://evil.example/feed',
    'https://api.luma.com/ics/get?entity=calendar&id=x',
    'https://api.luma.com:8443/ics/get?entity=user&id=x',
  ])
    assert.throws(() => validateLumaFeed(url));
});
test('Luma parses privacy, canonical descriptions, revision and honest RSVP', () => {
  const feed = ics(
    [
      simple(['SEQUENCE:1', 'CLASS:PRIVATE']),
      simple(['SEQUENCE:2', 'CLASS:PUBLIC', 'DESCRIPTION:Event https://lu.ma/meetup']),
    ].join('\r\n')
  );
  const snapshot = parseLumaFeed(feed, [], new Date('2026-11-13T00:00:00Z'));
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.events[0].visibility, 'public');
  assert.equal(snapshot.events[0].rsvp, null);
  assert.equal(snapshot.events[0].url, 'https://lu.ma/meetup');
  assert.equal(snapshot.passes[0].kind, 'event-page');
});
test('Luma recurrence exceptions reschedule and cancellations delete exact instances', () => {
  const feed = ics(
    [
      simple(['RRULE:FREQ=DAILY;COUNT=3']),
      vevent([
        'UID:a',
        'RECURRENCE-ID:20261114T100000Z',
        'DTSTART:20261114T120000Z',
        'DTEND:20261114T130000Z',
        'SUMMARY:Moved',
      ]),
      vevent(['UID:a', 'RECURRENCE-ID:20261115T100000Z', 'STATUS:CANCELLED']),
    ].join('\r\n')
  );
  const snapshot = parseLumaFeed(feed, [], new Date('2026-11-13T00:00:00Z'));
  assert.equal(snapshot.events.length, 2);
  assert.equal(snapshot.events[1].title, 'Moved');
  assert.equal(snapshot.events[1].start, '2026-11-14T12:00:00.000Z');
  assert.equal(snapshot.events[1].recurrenceId, '2026-11-14T10:00:00.000Z');
});
test('Luma preserves verified history and honors explicit historical cancellations', () => {
  const past = { ...event, id: 'a:', uid: 'a', end: '2020-01-01T00:00:00Z' };
  assert.equal(parseLumaFeed(ics(''), [past]).events.length, 1);
  assert.equal(parseLumaFeed(ics(vevent(['UID:a', 'STATUS:CANCELLED'])), [past]).events.length, 0);
});
test('Luma VTIMEZONE resolves IANA TZID correctly without global registration', () => {
  const timezone =
    'BEGIN:VTIMEZONE\r\nTZID:America/New_York\r\nBEGIN:STANDARD\r\nDTSTART:20251102T020000\r\nTZOFFSETFROM:-0400\r\nTZOFFSETTO:-0500\r\nRRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:20250309T020000\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0400\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE';
  const item = vevent([
    'UID:tz',
    'DTSTART;TZID=America/New_York:20261113T100000',
    'DTEND;TZID=America/New_York:20261113T110000',
    'SUMMARY:Timezone',
  ]);
  const snapshot = parseLumaFeed(ics(`${timezone}\r\n${item}`));
  assert.equal(snapshot.events[0].start, '2026-11-13T15:00:00.000Z');
  assert.equal(snapshot.events[0].timeZone, 'America/New_York');
  assert.throws(() => parseLumaFeed(ics(item)), /ical_timezone_missing/);
});
test('Luma all-day events preserve date-only boundaries', () => {
  const snapshot = parseLumaFeed(
    ics(
      vevent([
        'UID:day',
        'DTSTART;VALUE=DATE:20261113',
        'DTEND;VALUE=DATE:20261115',
        'SUMMARY:Two days',
      ])
    )
  );
  assert.equal(snapshot.events[0].start, '2026-11-13');
  assert.equal(snapshot.events[0].end, '2026-11-15');
  assert.equal(snapshot.events[0].allDay, true);
});

test('source diagnostics allowlist error codes without retaining provider secrets', () => {
  const secret = 'https://api.luma.com/ics/get?entity=user&id=private-token';
  for (const name of ['OperationError', 'DataError', 'InvalidCharacterError']) {
    assert.equal(sourceErrorCode({ name, message: secret }), 'credential_decryption_failed');
  }
  assert.equal(sourceErrorCode({ providerStatus: 429, message: secret }), 'provider_http_429');
  assert.equal(sourceErrorCode({ providerStatus: 401, message: secret }), 'reconnect_required');
  assert.equal(sourceErrorCode({ providerStatus: secret, message: secret }), 'refresh_failed');
  assert.equal(sourceErrorCode({ name: 'TimeoutError', message: secret }), 'provider_timeout');
  assert.equal(sourceErrorCode(new Error('ical_timezone_missing')), 'ical_timezone_missing');
  assert.equal(sourceErrorCode(new Error('ical_timezone_missing: ' + secret)), 'refresh_failed');
  assert.equal(sourceErrorCode(new Error(secret)), 'refresh_failed');
});
test('scheduled credential failure retains snapshots and logs only safe provider diagnostics', async t => {
  const row = { ...source('luma:personal'), provider: 'luma' };
  row.credentials = await seal(
    { ...env, INTEGRATION_ENCRYPTION_KEY: 'different-key' },
    'credentials:luma:personal',
    { feedUrl: 'https://api.luma.com/ics/get?entity=user&id=private-token' }
  );
  const rows = memoryStore(t, [row]);
  const logs = [];
  t.mock.method(console, 'error', value => logs.push(value));
  const result = await syncCalendars(env);
  assert.equal(result.refreshed, 0);
  assert.equal(rows.get(row.id).error, 'credential_decryption_failed');
  assert.deepEqual(rows.get(row.id).snapshot, row.snapshot);
  assert.deepEqual(
    logs.map(value => JSON.parse(value)),
    [{ event: 'calendar_sync_failed', provider: 'luma', error: 'credential_decryption_failed' }]
  );
  assert.doesNotMatch(logs.join(''), /private-token|private@email|feedUrl|credentials|https:/);
});

test('provider fetch supports Worker redirect modes and never follows credential redirects', async t => {
  let responseStatus = 200;
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (init.redirect === 'error') throw new TypeError('Unsupported redirect mode');
    requests.push({ url, init });
    return new Response('provider response', {
      status: responseStatus,
      headers: responseStatus === 302 ? { Location: 'https://untrusted.example' } : {},
    });
  });
  assert.equal(await fetchBounded('https://provider.example'), 'provider response');
  assert.equal(requests[0].init.redirect, 'manual');
  responseStatus = 302;
  await assert.rejects(
    fetchBounded('https://provider.example', { headers: { Authorization: 'Bearer fixture' } }),
    error => error.providerStatus === 302
  );
  assert.equal(requests.length, 2);
  assert.ok(requests.every(request => request.url === 'https://provider.example'));
});

test('Google full sync skips cancelled recurrence expansion while incremental sync applies deletions', async t => {
  const row = source();
  row.snapshot = {
    cursors: { calendar: 'legacy-show-deleted-cursor' },
    windowMonth: new Date().toISOString().slice(0, 7),
    window: {
      start: new Date(Date.now() - 86400000).toISOString(),
      end: new Date(Date.now() + 730 * 86400000).toISOString(),
    },
  };
  row.credentials = await seal(env, `credentials:${row.id}`, {
    accessToken: 'token',
    expiresAt: Date.now() + 3600000,
  });
  let tombstonePages = 0;
  let incrementalRequests = 0;
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(input);
    if (url.pathname.endsWith('/calendarList')) {
      return Response.json({ items: [{ id: 'calendar', summary: 'Calendar' }] });
    }
    if (url.pathname.endsWith('/events')) {
      if (url.searchParams.get('showDeleted') === 'true') {
        tombstonePages++;
        return Response.json({
          items: Array.from({ length: 2500 }, (_, index) => ({
            id: `cancelled-${tombstonePages}-${index}`,
            status: 'cancelled',
          })),
          nextPageToken: `page-${tombstonePages}`,
        });
      }
      if (url.searchParams.has('syncToken')) {
        incrementalRequests++;
        return Response.json({
          items: [{ id: 'visible', status: 'cancelled' }],
          nextSyncToken: 'after-delete',
        });
      }
      return Response.json({
        items: [
          {
            id: 'visible',
            summary: 'Active event',
            start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
            end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
          },
        ],
        nextSyncToken: 'initial',
      });
    }
    return Response.json({ items: [] });
  });
  const initial = await googleSnapshot(env, row);
  assert.equal(initial.snapshot.events.length, 1);
  const incremental = await googleSnapshot(env, { ...row, ...initial });
  assert.deepEqual(incremental.snapshot.events, []);
  assert.equal(incrementalRequests, 1);
  assert.equal(tombstonePages, 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchPublicCalendar,
  mapPublicCalendarEvent,
  reconcilePublicCalendar,
} from '../../src/js/services/calendar-sync.js';

const event = {
  id: 'occurrence:1',
  title: 'Community meetup',
  start: '2026-11-13T23:30:00Z',
  end: '2026-11-14T00:30:00Z',
  timeZone: 'Asia/Kolkata',
  category: 'luma',
  url: 'https://lu.ma/example',
};

test('public mapping preserves source timezone and never infers RSVP or copies private fields', () => {
  const mapped = mapPublicCalendarEvent({ ...event, notes: 'private', ticket: 'secret' });
  assert.equal(mapped.dateKey, '2026-11-14');
  assert.equal(mapped.lumaStatus, '');
  assert.equal(mapped.lumaUrl, event.url);
  assert.equal(mapped.notes, undefined);
  assert.equal(mapped.ticket, undefined);
  assert.equal(mapped.isSynced, true);
  assert.equal(mapPublicCalendarEvent({ ...event, url: 'javascript:alert(1)' }).url, '');
});

test('all-day dates stay on the provider date even in negative-offset timezones', () => {
  const mapped = mapPublicCalendarEvent({
    ...event,
    start: '2026-11-13',
    allDay: true,
    timeZone: 'America/Los_Angeles',
  });
  assert.equal(mapped.dateKey, '2026-11-13');
  assert.equal(mapped.time, 'All Day');
});

test('successful reconciliation replaces snapshots and live records while keeping local work', () => {
  const local = { id: 'local', isCustomUserReminder: true };
  const changelog = { id: 'release', isChangelog: true };
  const current = [{ id: 'old', isSynced: true }, local, changelog];
  const first = reconcilePublicCalendar(current, { configured: true, events: [event] });
  assert.equal(first.length, 3);
  assert.ok(!first.some(item => item.id === 'old'));
  const moved = reconcilePublicCalendar(first, {
    configured: true,
    events: [{ ...event, start: '2026-11-20T23:30:00Z' }],
  });
  assert.equal(moved.filter(item => item.isSynced).length, 1);
  assert.equal(moved.find(item => item.isSynced).dateKey, '2026-11-21');
  assert.deepEqual(reconcilePublicCalendar(moved, { configured: true, events: [] }), [
    local,
    changelog,
  ]);
});

test('unconfigured or malformed snapshots do not destroy the previous data', () => {
  const previous = [{ id: 'saved', isSynced: true }];
  assert.equal(reconcilePublicCalendar(previous, { configured: false }), previous);
  assert.throws(() => reconcilePublicCalendar(previous, { configured: true }));
  assert.throws(() => reconcilePublicCalendar(previous, { configured: true, events: [event, {}] }));
  assert.deepEqual(previous, [{ id: 'saved', isSynced: true }]);
});

test('public requests omit owner credentials and surface failed refreshes', async () => {
  let options;
  const snapshot = { configured: true, events: [] };
  assert.equal(
    await fetchPublicCalendar(async (_url, init) => {
      options = init;
      return { ok: true, json: async () => snapshot };
    }),
    snapshot
  );
  assert.equal(options.credentials, 'omit');
  assert.equal(options.cache, 'no-store');
  await assert.rejects(fetchPublicCalendar(async () => ({ ok: false })));
});

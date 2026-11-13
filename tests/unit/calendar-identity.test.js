import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarOccurrenceKey } from '../../src/js/utils/calendar-identity.js';
import { CalendarWidget } from '../../src/js/modules/calendar.js';

test('verified Luma reschedules replace calendar copies without losing separate editions', () => {
  const originalDocument = globalThis.document;
  globalThis.document = { getElementById: () => null };
  try {
    const widget = new CalendarWidget('calendar-widget');
    const builders = widget.reminders.filter(r => r.text === 'Touch Grass Builders - Pune Edition');
    assert.equal(builders.length, 1);
    assert.equal(builders[0].dateKey, '2026-11-21');
    assert.equal(builders[0].lumaStatus, 'going');
    assert.equal(
      widget.reminders.filter(r => r.text === 'Build Faster with AI and APIs (Session 4)').length,
      1
    );
    assert.equal(widget.reminders.filter(r => /NEO4J/.test(r.text)).length, 1);
    assert.equal(
      widget.reminders.filter(r => r.dateKey === '2026-09-12' && /AAIF Agentic AI Day/.test(r.text))
        .length,
      1
    );
    assert.equal(
      widget.reminders.filter(r => r.text === 'Touch The Real Grass: Sinhagad Fort Trek 🚩').length,
      1
    );
    const devDays = widget.reminders.filter(r => r.text === 'Dev Days | Pune, India');
    assert.deepEqual(
      devDays.map(r => r.dateKey),
      ['2026-09-19', '2026-10-16']
    );
    assert.equal(
      widget.reminders.find(r => r.text === 'JS Pune: Women in Tech × AI').completed,
      false
    );
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('calendar copies match across Google offsets and Apple UTC timestamps', () => {
  const apple = {
    title: 'Sinhagad Trek 🚩',
    start: '2026-11-15T00:30:00.000Z',
    end: '2026-11-15T05:30:00.000Z',
  };
  const google = {
    title: '  SINHAGAD Trek 🚩 ',
    start: '2026-11-15T06:00:00+05:30',
    end: '2026-11-15T11:00:00+05:30',
  };
  assert.equal(calendarOccurrenceKey(apple), calendarOccurrenceKey(google));
  assert.notEqual(
    calendarOccurrenceKey(apple),
    calendarOccurrenceKey({ ...apple, start: '2026-11-16T00:30:00Z' })
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { peekFreeMessageState, consumeFreeMessage } from '../../src/js/chatbot/rate-limit.js';
import { CLIENT_CHAT_RATE_KEY } from '../../src/js/chatbot/constants.js';

function mockLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); },
  };
  return store;
}

function withLocalMorningAfterUtcYesterday(fn) {
  // 02:00 on 10 Nov 2026 in a UTC+5:30 zone is still 9 Nov 20:30 UTC.
  const OriginalDate = Date;
  const instant = new OriginalDate('2026-11-09T20:30:00.000Z');
  class FakeDate extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) super(instant.getTime());
      else super(...args);
    }
    getFullYear() { return 2026; }
    getMonth() { return 10; } // November
    getDate() { return 10; }
    static now() { return instant.getTime(); }
  }
  globalThis.Date = FakeDate;
  try {
    return fn();
  } finally {
    globalThis.Date = OriginalDate;
  }
}

test('the daily free-message key uses the local calendar date, not UTC', () => {
  mockLocalStorage();
  withLocalMorningAfterUtcYesterday(() => {
    assert.equal(new Date().toISOString().slice(0, 10), '2026-11-09');
    const state = peekFreeMessageState(5);
    assert.equal(state.date, '2026-11-10');
    assert.equal(state.count, 0);
    assert.equal(state.remaining, 5);
  });
});

test('a count stored on the local date is not reset just because UTC has not rolled over', () => {
  const store = mockLocalStorage();
  store.set(CLIENT_CHAT_RATE_KEY, JSON.stringify({ date: '2026-11-10', count: 3 }));
  withLocalMorningAfterUtcYesterday(() => {
    const state = consumeFreeMessage(5);
    assert.equal(state.date, '2026-11-10');
    assert.equal(state.count, 4);
    assert.equal(state.remaining, 1);
  });
});

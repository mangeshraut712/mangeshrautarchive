import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLIENT_CHAT_RATE_KEY, CLIENT_DAILY_CHAT_LIMIT } from '../../src/js/chatbot/constants.js';
import {
  consumeFreeMessage,
  getRemainingFreeMessages,
  peekFreeMessageState,
} from '../../src/js/chatbot/rate-limit.js';

function installMemoryLocalStorage() {
  const store = new Map();
  const api = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: api,
  });
  return api;
}

describe('AssistMe chatbot rate-limit', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    globalThis.localStorage?.clear?.();
  });

  it('starts at full daily allowance', () => {
    expect(getRemainingFreeMessages()).toBe(CLIENT_DAILY_CHAT_LIMIT);
    expect(peekFreeMessageState().count).toBe(0);
  });

  it('consumes messages and persists legacy date/count shape', () => {
    const first = consumeFreeMessage();
    expect(first.remaining).toBe(CLIENT_DAILY_CHAT_LIMIT - 1);
    const raw = JSON.parse(localStorage.getItem(CLIENT_CHAT_RATE_KEY));
    expect(raw.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(raw.count).toBe(1);
    expect(getRemainingFreeMessages()).toBe(CLIENT_DAILY_CHAT_LIMIT - 1);
  });

  it('resets when stored date is not today', () => {
    localStorage.setItem(CLIENT_CHAT_RATE_KEY, JSON.stringify({ date: '2000-01-01', count: 99 }));
    expect(getRemainingFreeMessages()).toBe(CLIENT_DAILY_CHAT_LIMIT);
  });
});

/**
 * Client-side daily free-message estimate for AssistMe badge UI.
 * Not a security boundary — FastAPI / edge enforce real limits.
 * Storage shape: { date: 'YYYY-MM-DD', count: number } (legacy-compatible).
 */

import { CLIENT_CHAT_RATE_KEY, CLIENT_DAILY_CHAT_LIMIT } from './constants.js';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readState() {
  try {
    const raw = localStorage.getItem(CLIENT_CHAT_RATE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw);
    const date = parsed?.date || parsed?.day;
    if (!date || date !== todayKey()) return { date: todayKey(), count: 0 };
    return { date, count: Math.max(0, Number(parsed.count) || 0) };
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function writeState(state) {
  try {
    localStorage.setItem(
      CLIENT_CHAT_RATE_KEY,
      JSON.stringify({ date: state.date, count: state.count })
    );
  } catch {
    // ignore quota / private mode
  }
}

export function peekFreeMessageState(limit = CLIENT_DAILY_CHAT_LIMIT) {
  const state = readState();
  const remaining = Math.max(0, limit - state.count);
  return { ...state, remaining, limit };
}

export function getRemainingFreeMessages(limit = CLIENT_DAILY_CHAT_LIMIT) {
  return peekFreeMessageState(limit).remaining;
}

export function consumeFreeMessage(limit = CLIENT_DAILY_CHAT_LIMIT) {
  const state = readState();
  state.count += 1;
  writeState(state);
  return peekFreeMessageState(limit);
}

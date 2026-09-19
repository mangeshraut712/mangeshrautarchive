/**
 * Durable AssistMe session memory (browser-local, free).
 * Aligns with privacy: cleared on Clear chat / privacy wipe.
 */

import { MAX_CHAT_HISTORY } from './constants.js';

export const SESSION_MEMORY_KEY = 'assistme-chat-session-v1';
export const SESSION_ID_KEY = 'assistme-chat-session-id-v1';

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function secureSessionToken() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = new Uint32Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, value => value.toString(36)).join('');
}

export function getOrCreateSessionId() {
  const freshId = `sess_${Date.now().toString(36)}_${secureSessionToken()}`;
  try {
    const id = localStorage.getItem(SESSION_ID_KEY);
    if (id && id.length >= 8) return id;
    localStorage.setItem(SESSION_ID_KEY, freshId);
  } catch {
    // Private mode / quota: keep the cryptographic identifier in memory only.
  }
  return freshId;
}

export function loadConversation(limit = MAX_CHAT_HISTORY) {
  try {
    const parsed = safeParse(localStorage.getItem(SESSION_MEMORY_KEY) || 'null');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
      .slice(-Math.max(2, limit * 2));
  } catch {
    return [];
  }
}

export function saveConversation(messages, limit = MAX_CHAT_HISTORY) {
  try {
    const trimmed = (Array.isArray(messages) ? messages : [])
      .filter(
        m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
      .slice(-Math.max(2, limit * 2));
    localStorage.setItem(SESSION_MEMORY_KEY, JSON.stringify(trimmed));
  } catch {
    // private mode / quota
  }
}

export function clearSessionMemory() {
  try {
    localStorage.removeItem(SESSION_MEMORY_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
  } catch {
    // ignore
  }
}

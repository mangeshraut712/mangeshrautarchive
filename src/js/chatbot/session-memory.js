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

export function getOrCreateSessionId() {
  try {
    let id = localStorage.getItem(SESSION_ID_KEY);
    if (id && id.length >= 8) return id;
    id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return `sess_ephemeral_${Date.now().toString(36)}`;
  }
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

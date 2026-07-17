/** Shared AssistMe client constants (single source of truth). */

export const CLIENT_CHAT_RATE_KEY = 'assistme-chat-rate-v1';
/**
 * Soft client estimate for free OpenRouter models (Nemotron/Gemma).
 * Server FastAPI still enforces IP rate limits.
 */
export const CLIENT_DAILY_CHAT_LIMIT = 40;
/** Align with FastAPI ChatRequest max (2000) with headroom for UI chrome. */
export const MAX_CHAT_INPUT_LENGTH = 1800;
export const MAX_CHAT_HISTORY = 12;

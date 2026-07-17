/**
 * AssistMe chatbot package — shared FE modules (vanilla ESM).
 *
 * Layout:
 *   api-base.js     — API host selection (Pages → CF edge, local → FastAPI)
 *   rate-limit.js   — client daily free-message estimate
 *   stream.js       — NDJSON streaming (canonical StreamingService)
 *   scroll-engine.js — re-export ChatScrollEngine
 *   constants.js    — shared limits / keys
 *
 * UI entry remains `src/js/modules/chatbot.js` (bootstrap lazy path).
 * Host/ask client remains `src/js/core/chat.js`.
 */

export {
  EDGE_API_BASE,
  pagesApiCandidates,
  probeApiBase,
  markApiHostDead,
  isBlockedVercelHost,
  isApiHostMarkedDead,
} from './api-base.js';
export { ChatScrollEngine } from './scroll-engine.js';
export { streamingService, StreamingService } from './stream.js';
export {
  CLIENT_CHAT_RATE_KEY,
  CLIENT_DAILY_CHAT_LIMIT,
  MAX_CHAT_INPUT_LENGTH,
  MAX_CHAT_HISTORY,
} from './constants.js';
export {
  getRemainingFreeMessages,
  consumeFreeMessage,
  peekFreeMessageState,
} from './rate-limit.js';

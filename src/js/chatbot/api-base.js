/**
 * AssistMe API base helpers — re-export shared host selection.
 * Prefer importing from `../chatbot/index.js` or this module in new code.
 */
export {
  EDGE_API_BASE,
  pagesApiCandidates,
  probeApiBase,
  markApiHostDead,
  isBlockedVercelHost,
  isApiHostMarkedDead,
} from '../utils/api-host.js';

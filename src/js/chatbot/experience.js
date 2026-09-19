/**
 * AssistMe ChatGPT / Siri experience helpers (pure, testable).
 * Keep UI strings and streaming policy here — not in the 3k-line widget module.
 */

export const SITE_SEARCH_PROMPT =
  'Act as a site search engine for this portfolio. Give me a concise map of what I can ask about (projects, skills, experience, education, contact) and one suggested starter question for each.';

export const WELCOME_ACTION_CHIPS = [
  ['fas fa-briefcase', 'Experience', "Walk me through Mangesh's work experience"],
  ['fas fa-rocket', 'Top projects', "What are Mangesh's most impressive projects?"],
  ['fas fa-envelope', 'Contact', 'How can I contact Mangesh?'],
  ['fas fa-magnifying-glass', 'Search this site', SITE_SEARCH_PROMPT],
];

const THINKING_STAGE_LABELS = {
  thinking: 'Thinking',
  generating: 'Generating',
  streaming: 'Streaming',
};

/**
 * Time-of-day greeting for the empty state (Siri / ChatGPT pattern).
 * @param {Date} [now]
 * @returns {string}
 */
export function timeOfDayGreeting(now = new Date()) {
  const hour = now instanceof Date && !Number.isNaN(now.getTime()) ? now.getHours() : 12;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Edge + FastAPI should stream whenever the client asked for a stream.
 * Buffering free-model JSON before the first NDJSON byte is what makes
 * production AssistMe sit on "Generating…" for tens of seconds.
 * @param {boolean} wantStream
 * @returns {boolean}
 */
export function shouldStreamOpenRouter(wantStream) {
  return Boolean(wantStream);
}

/**
 * Thinking / generating label with elapsed seconds after a short delay.
 * @param {string} stage
 * @param {number} [elapsedSec]
 * @returns {string}
 */
export function thinkingStageLabel(stage, elapsedSec = 0) {
  const base = THINKING_STAGE_LABELS[stage] || THINKING_STAGE_LABELS.thinking;
  const sec = Math.max(0, Math.floor(Number(elapsedSec) || 0));
  if (sec < 2) return base;
  return `${base} · ${sec}s`;
}

/**
 * Empty-state copy. Returning visitors get a warmer Siri-style line.
 * @param {{ returning?: boolean, now?: Date }} [options]
 */
export function welcomeCopy(options = {}) {
  const greeting = timeOfDayGreeting(options.now);
  if (options.returning) {
    return {
      title: `${greeting} — welcome back`,
      subtitle: 'Pick up where you left off, or ask about projects, skills, and contact.',
    };
  }
  return {
    title: `${greeting}. I'm AssistMe`,
    subtitle: 'Ask anything about Mangesh — experience, projects, skills — or use + for tools.',
  };
}

/**
 * History rows that are safe to paint into the transcript.
 * @param {unknown} history
 * @returns {{ role: 'user' | 'assistant', content: string }[]}
 */
export function usableTranscriptTurns(history) {
  if (!Array.isArray(history)) return [];
  return history.filter(
    m =>
      m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim()
  );
}

/**
 * iMessage / ChatGPT turn spacing: stacked same-sender vs a new speaker.
 * @param {string | null | undefined} previousRole
 * @param {string | null | undefined} nextRole
 * @returns {'start' | 'same' | 'switch'}
 */
export function transcriptTurnGap(previousRole, nextRole) {
  if (!previousRole || !nextRole) return 'start';
  return previousRole === nextRole ? 'same' : 'switch';
}

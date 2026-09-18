/**
 * Tight WebMCP intent gates so AssistMe does not steal general questions.
 * Execution still lives in agentic-actions.js; this module only answers
 * "should this phrase run a site tool?"
 */

function normalizeIntentText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Site search overlay — not "binary search trees" or "search engine".
 * @param {string} text
 * @returns {boolean}
 */
export function isSiteSearchIntent(text) {
  const input = normalizeIntentText(text);
  if (!input) return false;
  if (/\bdo not search\b/i.test(input)) return false;
  if (/\bbinary search\b/i.test(input)) return false;
  if (/\bsearch\s+(engine|tree|trees|algorithm|space|box|bar)\b/i.test(input)) return false;
  if (/\b(site search engine|act as a (site )?search)\b/i.test(input)) return false;

  if (/\b(search|find|look\s+up)\b.{0,48}\b(this|the)\s+(site|portfolio)\b/i.test(input)) {
    return true;
  }
  if (/\b(search|find)\s+(this|the)\s+(site|portfolio)\b/i.test(input)) {
    return true;
  }
  if (/^(?:please\s+)?(?:search|find|look\s+up)\s+(?:for\s+)?.{1,80}$/i.test(input)) {
    return !/\b(explain|compare|when|why|how does|vs\.?|versus)\b/i.test(input);
  }
  return false;
}

/**
 * Resume/CV download — not "a file download" in a networking question.
 * @param {string} text
 * @returns {boolean}
 */
export function isResumeDownloadIntent(text) {
  const input = normalizeIntentText(text);
  if (!input) return false;
  if (!/\b(resume|cv|curriculum\s+vitae)\b/i.test(input)) return false;
  if (/\bresume\s+(the|my|our|work|session|playback|download|transfer)\b/i.test(input)) {
    return false;
  }
  return true;
}

/**
 * Open the contact form — not "how can I contact Mangesh?" (that is Q&A).
 * @param {string} text
 * @returns {boolean}
 */
export function isOpenContactFormIntent(text) {
  const input = normalizeIntentText(text);
  if (!input) return false;
  if (/\b(how can i|how do i|what(?:'s| is)|which|list|share)\b/i.test(input)) {
    return false;
  }
  if (/\b(open|show|bring up|fill(?:\s+out)?)\s+(?:the\s+)?contact\s+form\b/i.test(input)) {
    return true;
  }
  if (/\b(send|write)\s+(?:a\s+)?(?:message|email)\b/i.test(input)) return true;
  return false;
}

/**
 * Extra gate used by AgenticActionHandler.detectAndExecute.
 * Unknown actions stay on their existing regexes.
 * @param {string} actionName
 * @param {string} text
 * @returns {boolean}
 */
export function isAllowedAgenticMatch(actionName, text) {
  if (actionName === 'search') return isSiteSearchIntent(text);
  if (actionName === 'download_resume') return isResumeDownloadIntent(text);
  if (actionName === 'send_message') return isOpenContactFormIntent(text);
  return true;
}

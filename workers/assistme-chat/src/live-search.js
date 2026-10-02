/**
 * Real-time web and news grounding for AssistMe.
 * Fetches fresh headlines and factual context via Google News RSS and Wikipedia REST API
 * to ensure answers reflect verified current events rather than outdated pre-training knowledge.
 */

const NEWS_TIMEOUT_MS = 2000;
const WIKI_TIMEOUT_MS = 1400;

// Keywords indicating temporal, contemporary, or breaking news intent
const TEMPORAL_NEWS_RE =
  /\b(latest|news|update|updates|today|recent|recently|current|breaking|trending|announced|announcements|released?|what happened|who is|who won|election|stock|price|ceo|founder|winner)\b/i;

// Prominent entities often queried for contemporary status
const CONTEMPORARY_ENTITIES_RE =
  /\b(apple|google|alphabet|microsoft|openai|anthropic|meta|tesla|nvidia|amazon|spacex|twitter|x\.ai|claude|chatgpt|gemini|iphone|macbook)\b/i;

// Purely portfolio-specific topics that should bypass live search to avoid latency
const PORTFOLIO_QUERY_RE =
  /\b(mangesh|raut|drexel|ioasiz|aramark|resume|portfolio|systems\.html|travel atlas|uses\.html|panchang|hindai|agent-console|stanford-cs336|gravity-saas|contact|email|phone|github\.com\/mangeshraut)\b/i;

/**
 * Determines whether a message benefits from real-time live grounding.
 * @param {string} message
 * @returns {boolean}
 */
export function shouldFetchLiveGrounding(message) {
  if (!message || typeof message !== 'string') return false;
  const trimmed = message.trim();
  if (trimmed.length < 4) return false;

  // If asking specifically about Mangesh or portfolio internals, don't query live news
  if (PORTFOLIO_QUERY_RE.test(trimmed) && !TEMPORAL_NEWS_RE.test(trimmed)) {
    return false;
  }

  return TEMPORAL_NEWS_RE.test(trimmed) || CONTEMPORARY_ENTITIES_RE.test(trimmed);
}

/**
 * Extracts a targeted search topic from a conversational query.
 * @param {string} query
 * @returns {string}
 */
export function extractSearchTopic(query) {
  const cleaned = query
    .replace(/[^\w\s-]/g, ' ')
    .replace(
      /\b(who is the|who is|what is the|what is|tell me about|can you tell me|please|latest|news|updates?|today|recent|recently|current|about)\b/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length >= 3 ? cleaned : query.slice(0, 100).trim();
}

/**
 * Clean XML / HTML entity encoding
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetches recent news stories via Google News RSS.
 * @param {string} topic
 * @returns {Promise<Array<{ title: string, pubDate: string, snippet: string }>>}
 */
export async function fetchGoogleNews(topic) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await globalThis.fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/rss+xml, text/xml; q=0.9, */*; q=0.8',
      },
      signal: AbortSignal.timeout(NEWS_TIMEOUT_MS),
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const regex =
      /<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<pubDate>([^<]+)<\/pubDate>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/g;

    let match;
    while ((match = regex.exec(xml)) !== null && items.length < 4) {
      const rawTitle = match[1];
      const rawPubDate = match[2];
      const rawDesc = match[3];

      const title = cleanText(rawTitle);
      const pubDate = rawPubDate.trim();
      const snippet = cleanText(rawDesc).slice(0, 220);

      // Filter out redundant feed title matches
      if (title && !title.startsWith('Google News') && !items.some(i => i.title === title)) {
        items.push({ title, pubDate, snippet });
      }
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Fetches an encyclopedic summary from Wikipedia REST API for entity queries.
 * @param {string} topic
 * @returns {Promise<{ title: string, extract: string, description: string } | null>}
 */
export async function fetchWikipediaSummary(topic) {
  try {
    const formatted = topic.trim().replace(/\s+/g, '_');
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formatted)}`;
    const res = await globalThis.fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AssistMe/1.0 (https://mangeshraut712.github.io/mangeshrautarchive)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === 'disambiguation' || !data.extract) return null;

    return {
      title: data.title || topic,
      extract: data.extract.slice(0, 400),
      description: data.description || '',
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves real-time ground truth context for a user query.
 * Runs non-blocking parallel fetches with graceful timeouts.
 * @param {string} message
 * @returns {Promise<{ groundingPrompt: string, sourcesCount: number, isGrounded: boolean }>}
 */
export async function fetchLiveGrounding(message) {
  if (!shouldFetchLiveGrounding(message)) {
    return { groundingPrompt: '', sourcesCount: 0, isGrounded: false };
  }

  const topic = extractSearchTopic(message);
  const nowUtc = new Date().toUTCString();

  try {
    // Run parallel fetch for news and Wikipedia
    const [newsItems, wikiSummary] = await Promise.all([
      fetchGoogleNews(topic),
      /\b(who is|what is|ceo|founder)\b/i.test(message) ? fetchWikipediaSummary(topic) : null,
    ]);

    const lines = [];

    if (wikiSummary && wikiSummary.extract) {
      lines.push(
        `• [Wikipedia: ${wikiSummary.title}${wikiSummary.description ? ` (${wikiSummary.description})` : ''}]: ${wikiSummary.extract}`
      );
    }

    if (Array.isArray(newsItems) && newsItems.length > 0) {
      for (const item of newsItems) {
        lines.push(`• [News: ${item.pubDate}] ${item.title}`);
      }
    }

    if (lines.length === 0) {
      return { groundingPrompt: '', sourcesCount: 0, isGrounded: false };
    }

    const groundingPrompt = `\n\n## Verified Real-Time Live Ground Truth (Retrieved Live at ${nowUtc}):\nThe following verified real-time news headlines and encyclopedic records were retrieved directly from live sources for this turn. Always incorporate these verified facts to ensure your answer reflects current events rather than outdated pre-training cutoff data:\n${lines.join('\n')}\n`;

    return {
      groundingPrompt,
      sourcesCount: lines.length,
      isGrounded: true,
    };
  } catch {
    return { groundingPrompt: '', sourcesCount: 0, isGrounded: false };
  }
}

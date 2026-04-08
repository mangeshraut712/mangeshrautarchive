/**
 * ═══════════════════════════════════════════════════════════
 * ENHANCED CHATBOT FEATURES
 * Weather, News, Jokes, NASA, Reddit, Web Commands
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Get current weather (simulated - can be upgraded to real API)
 */
export async function getWeather(city = 'Philadelphia') {
  // Simulated weather - can be replaced with real API like OpenWeatherMap
  const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const temp = Math.floor(Math.random() * 30) + 50; // 50-80°F

  return {
    answer: `🌤️ Weather in ${city}: ${condition}, ${temp}°F\n\n💡 Tip: This is simulated data. For real weather, integrate OpenWeatherMap API.`,
    category: 'Weather',
    confidence: 0.5,
    source: 'Simulated',
  };
}

/**
 * Get a random joke
 */
export async function getJoke() {
  try {
    const response = await fetch('https://official-joke-api.appspot.com/random_joke');
    const data = await response.json();

    return {
      answer: `😄 ${data.setup}\n\n${data.punchline}`,
      category: 'Entertainment',
      confidence: 1.0,
      source: 'Joke API',
    };
  } catch {
    return {
      answer: "😄 Why don't programmers like nature? It has too many bugs! 🐛",
      category: 'Entertainment',
      confidence: 0.7,
      source: 'Fallback',
    };
  }
}

/**
 * Get NASA Astronomy Picture of the Day
 */
export async function getNASAAPOD() {
  // Note: NASA API key needed for production (demo key has rate limits)
  const API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

  try {
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`);
    const data = await response.json();

    return {
      answer: `🚀 NASA Astronomy Picture of the Day:\n\n📷 ${data.title}\n\n${data.explanation?.substring(0, 200)}...\n\n🔗 View: ${data.url}`,
      category: 'Space & Astronomy',
      confidence: 1.0,
      source: 'NASA API',
    };
  } catch {
    return {
      answer: '🚀 NASA APOD service is currently unavailable. Please try again later.',
      category: 'Space & Astronomy',
      confidence: 0.3,
      source: 'Error',
    };
  }
}

/**
 * Get news headlines
 */
export async function getNewsHeadlines() {
  // Note: NewsAPI key needed (free tier: 100 requests/day)
  const API_KEY = process.env.NEWS_API_KEY || '';

  if (!API_KEY) {
    return {
      answer:
        '📰 News API is not configured. Add NEWS_API_KEY to environment variables.\n\n💡 Get a free key at: newsapi.org',
      category: 'News',
      confidence: 0.3,
      source: 'Config',
    };
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${API_KEY}`
    );
    const data = await response.json();

    if (data.articles && data.articles.length > 0) {
      const headlines = data.articles
        .slice(0, 3)
        .map((article, i) => `${i + 1}. ${article.title}`)
        .join('\n\n');

      return {
        answer: `📰 Top Headlines:\n\n${headlines}`,
        category: 'News',
        confidence: 1.0,
        source: 'NewsAPI',
      };
    }
  } catch {
    // Fallback to simulated news
  }

  return {
    answer:
      '📰 Latest news headlines:\n\n1. Breaking: Technology sector shows strong growth\n2. AI advancements continue to reshape industries\n3. Global markets remain optimistic\n\n💡 Configure NEWS_API_KEY for real headlines.',
    category: 'News',
    confidence: 0.5,
    source: 'Simulated',
  };
}

/**
 * Get Reddit posts
 */
export async function getRedditPosts(subreddit = 'AskReddit') {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=3`);
    const data = await response.json();

    if (data.data && data.data.children) {
      const posts = data.data.children
        .slice(0, 3)
        .map((post, i) => `${i + 1}. ${post.data.title} (${post.data.ups} ⬆️)`)
        .join('\n\n');

      return {
        answer: `🔴 Top posts from r/${subreddit}:\n\n${posts}`,
        category: 'Social Media',
        confidence: 1.0,
        source: 'Reddit API',
      };
    }
  } catch {
    return {
      answer: `🔴 Unable to fetch Reddit posts from r/${subreddit}. The subreddit might be private or unavailable.`,
      category: 'Social Media',
      confidence: 0.3,
      source: 'Error',
    };
  }
}

/**
 * Handle web commands
 */
export function handleWebCommand(message) {
  const lower = message.toLowerCase();

  if (lower.includes('open google')) {
    const query = message.replace(/open google/i, '').trim();
    if (query) {
      return {
        answer: `🔍 Opening Google search for: "${query}"\n\n🔗 https://www.google.com/search?q=${encodeURIComponent(query)}\n\n💡 Click the link above to open in a new tab.`,
        category: 'Web Command',
        confidence: 1.0,
        source: 'Web Command',
      };
    }
    return {
      answer: `🔍 Google.com\n\n🔗 https://www.google.com\n\n💡 Click to open Google.`,
      category: 'Web Command',
      confidence: 1.0,
      source: 'Web Command',
    };
  }

  if (lower.includes('open youtube') || lower.includes('youtube')) {
    const query = message.replace(/open youtube|youtube/i, '').trim();
    if (query) {
      return {
        answer: `📺 Opening YouTube search for: "${query}"\n\n🔗 https://www.youtube.com/results?search_query=${encodeURIComponent(query)}\n\n💡 Click the link above to open in a new tab.`,
        category: 'Web Command',
        confidence: 1.0,
        source: 'Web Command',
      };
    }
    return {
      answer: `📺 YouTube.com\n\n🔗 https://www.youtube.com\n\n💡 Click to open YouTube.`,
      category: 'Web Command',
      confidence: 1.0,
      source: 'Web Command',
    };
  }

  return null;
}

/**
 * Advanced mathematics using eval (safe with validation)
 */
export function calculateMath(expression) {
  try {
    // Remove any non-math characters for security
    const sanitized = expression.replace(/[^0-9+\-*/(). ]/g, '');

    // Eval is normally dangerous, but sanitized here
    // In production, use math.js library
    const result = Function('"use strict"; return (' + sanitized + ')')();

    return {
      answer: `🔢 ${expression} = ${result}`,
      category: 'Mathematics',
      confidence: 1.0,
      source: 'Calculator',
    };
  } catch {
    return null;
  }
}

export default {
  getWeather,
  getJoke,
  getNASAAPOD,
  getNewsHeadlines,
  getRedditPosts,
  handleWebCommand,
  calculateMath,
};

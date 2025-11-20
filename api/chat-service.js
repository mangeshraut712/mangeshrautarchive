/**
 * ═══════════════════════════════════════════════════════════
 * CHAT SERVICE - OpenRouter with Gemini 2.0 Flash ONLY
 * Clean implementation with proper response format
 * ═══════════════════════════════════════════════════════════
 */

// API Configuration - OPTIMIZED FOR PERFORMANCE
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || '';

// Optimized Model Prioritization - Fastest first
const MODELS = [
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', priority: 1 }, // Primary fast model
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp', priority: 2 },
  { id: 'mistralai/mistral-nemo:free', name: 'Mistral Nemo', priority: 3 },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder', priority: 4 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3', priority: 5 },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1', priority: 6 }
];

const DEFAULT_MODEL = MODELS[0].id;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Response Cache - Prevents repeated API calls
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(message, type) {
  return `${type}:${message.trim().toLowerCase()}`;
}

function getCachedResponse(cacheKey) {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    responseCache.delete(cacheKey);
    return null;
  }

  console.log('🚀 Using cached response for:', cacheKey);
  return cached.response;
}

function setCachedResponse(cacheKey, response) {
  // Don't cache error responses or very short responses
  if (!response?.answer || response.answer.length < 10) return;

  responseCache.set(cacheKey, {
    response: { ...response, cached: true },
    timestamp: Date.now()
  });

  // Clean up old entries if cache gets too large
  if (responseCache.size > 50) {
    const sorted = Array.from(responseCache.entries()).sort((a, b) => b[1].timestamp - a[1].timestamp);
    responseCache.clear();
    sorted.slice(0, 30).forEach(([key, value]) => responseCache.set(key, value));
  }
}

// Condensed Portfolio Data - OPTIMIZED FOR SPEED
const PORTFOLIO_SUMMARY = {
  name: "Mangesh Raut",
  title: "Software Engineer | Full-Stack Developer | AI/ML Engineer",
  location: "Philadelphia, PA",
  email: "mbr63drexel@gmail.com",
  phone: "+1 (609) 505 3500",
  linkedin: "in/mangeshraut71298",
  github: "mangeshraut712",

  summary: "Software Engineer with expertise in Java Spring Boot, Python, AngularJS, AWS, and machine learning. Currently optimizing energy analytics at Customized Energy Solutions with 40% efficiency gains. Previously improved network latency by 35% and codebase performance by 20% at IoasiZ.",

  experience: {
    current: {
      title: "Software Engineer",
      company: "Customized Energy Solutions",
      period: "Aug 2024 - Present",
      achievements: ["Reduced dashboard latency by 40%", "Accelerated deployments by 35%", "Improved ML model accuracy by 25%"]
    },
    previous: {
      title: "Software Engineer",
      company: "IoasiZ",
      period: "Jul 2023 - Jul 2024",
      achievements: ["Refactored legacy systems with 20% reduction in code", "Resolved 50+ microservices bugs", "Integrated Redis caching"]
    }
  },

  skills: {
    languages: ["Java", "Python", "SQL", "JavaScript"],
    frameworks: ["Spring Boot", "AngularJS", "TensorFlow", "scikit-learn"],
    cloud: ["AWS", "Docker", "Jenkins", "Terraform"],
    databases: ["PostgreSQL", "MongoDB", "MySQL"],
    tools: ["Git", "Jira", "Tableau", "Wireshark"]
  },

  education: "Master of Science in Computer Science (Drexel University) - Currently pursuing | Bachelor of Engineering in Computer Engineering (Pune University) - GPA 3.6",

  projects: {
    portfolio: {
      name: "Starlight Blogging Website",
      tech: ["Angular", "Flask", "SQLite"],
      achievements: "100+ users, authentication, content management"
    },
    ml: {
      name: "Face Emotion Recognition",
      tech: ["Python", "OpenCV", "ML"],
      achievements: "95% accuracy, real-time processing"
    },
    security: {
      name: "PC Crime Detector",
      tech: ["Java", "Database", "Automation"],
      achievements: "80% breach reduction"
    }
  }
};

// System prompt for AI with enhanced capabilities
// System prompt for AI with enhanced capabilities
const SYSTEM_PROMPT = `You are AssistMe, an intelligent AI assistant powered by OpenRouter using advanced models like Google's Gemini 2.0 Flash, Llama 3.3, and DeepSeek.

Your Core Instructions:
1. **Portfolio Expert**: You have full access to Mangesh Raut's professional background (provided below). Answer questions about his experience, skills, and projects with high accuracy.
2. **General Knowledge**: You are a capable AI assistant. You CAN answer general questions about the world, technology, science, history, and current events (up to your knowledge cutoff).
   - Example: If asked "Who is the CEO of Meta?", answer "Mark Zuckerberg".
   - Example: If asked "Explain quantum computing", provide a clear explanation.
3. **Coding Assistant**: You can write, debug, and explain code in various languages (Python, Java, JavaScript, etc.).

Guidelines:
- Be professional, concise, and friendly.
- If a question is about Mangesh, prioritize the provided LinkedIn/Portfolio data.
- If a question is NOT about Mangesh, answer it directly using your general knowledge.
- Do NOT say "I don't have access to real-time info" for static facts (like CEOs of major companies).
- Keep responses under 200 words unless detailed explanation is requested.

CRITICAL EDUCATION INFO:
- Mangesh's HIGHEST COMPLETED qualification is: Bachelor of Engineering in Computer Engineering (2014-2017, graduated 2017)
- He is CURRENTLY PURSUING: Master of Science in Computer Science at Drexel University (2023-2025, expected 2025)
- When asked about "highest qualification", say: "Bachelor's degree in Computer Engineering (completed 2017). He is currently pursuing a Master's at Drexel University."`;

/**
 * Detect if query is about LinkedIn/Portfolio
 */
function isLinkedInQuery(message) {
  const keywords = [
    'experience', 'work', 'job', 'career', 'skills', 'education',
    'university', 'degree', 'project', 'portfolio', 'background',
    'about you', 'tell me about', 'who are you', 'mangesh', 'resume'
  ];
  const lower = message.toLowerCase();
  return keywords.some(keyword => lower.includes(keyword));
}

/**
 * Build LinkedIn context prompt
 */
/**
 * Build Contextual Prompt
 */
function buildContextPrompt(message, context = {}) {
  let prompt = `User Question: ${message}\n\n`;

  // Add dynamic screen context if available
  if (context.currentSection) {
    prompt += `[User is currently viewing the "${context.currentSection}" section]\n`;
  }

  if (context.visibleProjects && context.visibleProjects.length > 0) {
    prompt += `[Projects currently visible on screen: ${context.visibleProjects.map(p => p.title).join(', ')}]\n`;
  }

  if (context.latestBlog) {
    prompt += `[Latest Blog Post: "${context.latestBlog.title}"]\n`;
  }

  prompt += `\nPortfolio Summary:\n${JSON.stringify(PORTFOLIO_SUMMARY, null, 2)}\n`;

  prompt += `\nPlease answer the user's question using the provided information. If the user refers to "this" or "visible" items, use the screen context. Be professional and concise.`;

  return prompt;
}

/**
 * Classify query type for category
 */
function classifyType(message) {
  const lower = message.toLowerCase();

  // Math queries
  if (/\d+\s*[\+\-\*\/\%]\s*\d+/.test(message) ||
    lower.includes('calculate') ||
    lower.includes('math') ||
    lower.includes('sum') ||
    lower.includes('multiply')) {
    return 'math';
  }

  // Portfolio queries
  if (isLinkedInQuery(message)) {
    return 'portfolio';
  }

  // Coding queries
  if (lower.includes('code') ||
    lower.includes('programming') ||
    lower.includes('function') ||
    lower.includes('algorithm')) {
    return 'coding';
  }

  return 'general';
}

/**
 * Map type to category
 */
function getCategory(type) {
  const categoryMap = {
    'math': 'Mathematics',
    'portfolio': 'Portfolio',
    'coding': 'Programming',
    'general': 'General Knowledge'
  };
  return categoryMap[type] || 'General';
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter({ model, messages }) {
  const startTime = Date.now();

  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  // Try models in sequence if the primary one fails
  const modelsToTry = model ? [model] : MODELS.map(m => m.id);
  let lastError = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`🔄 Trying model: ${currentModel}`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mangeshraut712.github.io/mangeshrautarchive/',
          'X-Title': 'Mangesh Raut Portfolio'
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.warn(`⚠️ Model ${currentModel} failed: ${response.status} - ${error}`);
        lastError = new Error(`OpenRouter API error: ${response.status} - ${error}`);
        continue; // Try next model
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.warn(`⚠️ Invalid format from ${currentModel}`);
        lastError = new Error('Invalid response format from OpenRouter');
        continue;
      }

      return {
        answer: data.choices[0].message.content.trim(),
        processingTime,
        usage: data.usage || null,
        model: currentModel // Return which model actually worked
      };

    } catch (error) {
      console.error(`❌ Error with model ${currentModel}:`, error);
      lastError = error;
    }
  }

  // If all models failed
  throw lastError || new Error('All OpenRouter models failed');
}

/**
 * Handle direct commands (instant responses)
 */
function handleDirectCommand(message) {
  const lower = message.toLowerCase();
  const now = new Date();

  // Time commands (uses system timezone)
  if (lower.includes('time') && !lower.includes('timezone')) {
    const time = now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      answer: `⏰ Current time is ${time} (${timezone})`,
      source: 'Direct Command',
      model: 'Built-in',
      category: 'Time & Date',
      confidence: 1.0,
      runtime: '0ms',
      type: 'time',
      processingTime: 0,
      providers: ['Built-in']
    };
  }

  // Date commands (uses system timezone)
  if (lower.includes('date') || lower.includes('today')) {
    const date = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return {
      answer: `📅 Today is ${date}`,
      source: 'Direct Command',
      model: 'Built-in',
      category: 'Time & Date',
      confidence: 1.0,
      runtime: '0ms',
      type: 'time',
      processingTime: 0,
      providers: ['Built-in']
    };
  }

  // Day command
  if (lower.includes('which day') || lower.includes('what day')) {
    const day = now.toLocaleDateString(undefined, { weekday: 'long' });
    return {
      answer: `📆 Today is ${day}`,
      source: 'Direct Command',
      model: 'Built-in',
      category: 'Time & Date',
      confidence: 1.0,
      runtime: '0ms',
      type: 'time',
      processingTime: 0,
      providers: ['Built-in']
    };
  }

  // Basic math (simple calculations)
  const mathMatch = message.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (mathMatch) {
    const [, num1, operator, num2] = mathMatch;
    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);
    let result;

    switch (operator) {
      case '+': result = n1 + n2; break;
      case '-': result = n1 - n2; break;
      case '*': result = n1 * n2; break;
      case '/': result = n2 !== 0 ? n1 / n2 : 'Cannot divide by zero'; break;
    }

    if (typeof result === 'number') {
      return {
        answer: `🔢 ${num1} ${operator} ${num2} = ${result}`,
        category: 'Mathematics',
        confidence: 1.0,
        runtime: '0ms',
        type: 'math',
        isDirect: true
      };
    }
  }

  return null; // No direct command matched
}

/**
 * Offline fallback response
 */
function offlineFallback(message = '') {
  const type = classifyType(message);

  // Check if API key is missing
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
    return {
      answer: `⚠️ **AI Chatbot Configuration Required**\n\nThe OpenRouter API key is not configured. To enable AI responses:\n\n1. Get a free API key from [OpenRouter](https://openrouter.ai/keys)\n2. Add it to your environment variables:\n   - **Local**: Create a \`.env\` file with \`OPENROUTER_API_KEY=your-key\`\n   - **Vercel**: Add to Settings → Environment Variables\n3. Restart the server\n\n📖 See \`CHATBOT_SETUP.md\` for detailed instructions.`,
      source: 'Configuration Error',
      model: 'System',
      category: 'Error',
      confidence: 1.0,
      runtime: '0ms',
      type: 'error',
      processingTime: 0,
      providers: ['System']
    };
  }

  if (type === 'portfolio') {
    return {
      answer: `I'm currently offline, but I can share that Mangesh Raut is a Software Engineer and AI/ML Specialist based in Philadelphia, PA. He specializes in full-stack development, machine learning, and cloud technologies. For more details, please try again when the AI service is available.`,
      source: 'Offline',
      model: 'Static Data',
      category: 'Portfolio',
      confidence: 0.60,
      runtime: '0ms'
    };
  }

  return {
    answer: '⚠️ AI service is temporarily unavailable. Please try again in a moment.',
    source: 'Offline',
    model: 'None',
    category: getCategory(type),
    confidence: 0.30,
    runtime: '0ms'
  };
}

/**
 * Main query processing function with enhanced features
 */
async function processQuery({ message = '', messages = [], context = {} } = {}) {
  const startTime = Date.now();

  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message format');
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new Error('Empty message');
  }

  // Check for direct commands (instant response)
  const directResponse = handleDirectCommand(trimmedMessage);
  if (directResponse) {
    const response = {
      answer: directResponse.answer,
      source: 'Direct Command',
      model: 'Built-in',
      category: directResponse.category,
      confidence: directResponse.confidence,
      runtime: directResponse.runtime,
      type: directResponse.type,
      processingTime: 0,
      providers: ['Built-in'],
      usage: null
    };

    // Cache successful direct responses
    setCachedResponse(getCacheKey(trimmedMessage, 'built-in'), response);
    return response;
  }

  // Detect query type
  const type = classifyType(trimmedMessage);
  const category = getCategory(type);
  const wantsLinkedIn = isLinkedInQuery(trimmedMessage);

  // Check cache for similar queries (EXACT MATCH ONLY)
  const cacheKey = getCacheKey(trimmedMessage, type);
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    cachedResponse.cached = true; // Mark as from cache
    return cachedResponse;
  }

  // Handle special command types with enhanced features
  const lower = trimmedMessage.toLowerCase();

  // Joke command
  if (lower.includes('joke') || lower.includes('funny')) {
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await response.json();
      const runtime = Date.now() - startTime;

      const result = {
        answer: `😄 ${data.setup}\n\n${data.punchline}`,
        source: 'Joke API',
        model: 'Entertainment',
        category: 'Entertainment',
        confidence: 1.0,
        runtime: `${runtime}ms`,
        type: 'entertainment',
        processingTime: runtime,
        providers: ['Joke API'],
        usage: null
      };
      setCachedResponse(cacheKey, result);
      return result;
    } catch (error) {
      // Continue to AI if joke API fails
    }
  }

  // Weather command (simulated)
  if (lower.includes('weather')) {
    const cityMatch = trimmedMessage.match(/weather in (\w+)/i);
    const city = cityMatch ? cityMatch[1] : 'Philadelphia';
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Clear'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = Math.floor(Math.random() * 30) + 50;
    const runtime = Date.now() - startTime;

    const result = {
      answer: `🌤️ Weather in ${city}: ${condition}, ${temp}°F\n\n💡 This is simulated. For real weather, configure OpenWeatherMap API key.`,
      source: 'Simulated',
      model: 'Weather Sim',
      category: 'Weather',
      confidence: 0.5,
      runtime: `${runtime}ms`,
      type: 'weather',
      processingTime: runtime,
      providers: ['Simulated'],
      usage: null
    };
    setCachedResponse(cacheKey, result);
    return result;
  }

  // Web commands
  if (lower.includes('open google') || lower.includes('open youtube')) {
    let answer = '';
    const runtime = Date.now() - startTime;

    if (lower.includes('open google')) {
      const query = trimmedMessage.replace(/open google/i, '').trim();
      if (query) {
        answer = `🔍 Google Search: "${query}"\n\n🔗 https://www.google.com/search?q=${encodeURIComponent(query)}\n\n💡 Copy the link above to open in browser.`;
      } else {
        answer = `🔍 Google.com\n\n🔗 https://www.google.com`;
      }
    } else if (lower.includes('open youtube')) {
      const query = trimmedMessage.replace(/open youtube|youtube/i, '').trim();
      if (query) {
        answer = `📺 YouTube Search: "${query}"\n\n🔗 https://www.youtube.com/results?search_query=${encodeURIComponent(query)}\n\n💡 Copy the link above to open in browser.`;
      } else {
        answer = `📺 YouTube.com\n\n🔗 https://www.youtube.com`;
      }
    }

    const result = {
      answer,
      source: 'Web Command',
      model: 'Built-in',
      category: 'Web Command',
      confidence: 1.0,
      runtime: `${runtime}ms`,
      type: 'web',
      processingTime: runtime,
      providers: ['Built-in'],
      usage: null
    };
    setCachedResponse(cacheKey, result);
    return result;
  }

  // Build message array
  const systemMessage = { role: 'system', content: SYSTEM_PROMPT };
  let userMessage;

  if (wantsLinkedIn || Object.keys(context).length > 0) {
    userMessage = { role: 'user', content: buildContextPrompt(trimmedMessage, context) };
  } else {
    userMessage = { role: 'user', content: trimmedMessage };
  }

  const conversationMessages = [systemMessage, ...messages, userMessage];

  // Try OpenRouter
  try {
    const response = await callOpenRouter({
      model: DEFAULT_MODEL,
      messages: conversationMessages
    });

    const runtime = Date.now() - startTime;
    const result = {
      answer: response.answer,
      source: 'OpenRouter',
      model: response.model || 'Gemini 2.0 Flash',
      category: wantsLinkedIn ? 'Portfolio' : category,
      confidence: wantsLinkedIn ? 0.95 : 0.90,
      answerLength: response.answer.length,
      runtime: `${runtime}ms`,
      // Legacy fields for compatibility
      type,
      processingTime: response.processingTime,
      providers: ['OpenRouter'],
      usage: response.usage
    };

    // Cache API responses for repeated queries
    setCachedResponse(cacheKey, result);
    return result;

  } catch (error) {
    console.error('API Error:', error.message);
    const fallback = offlineFallback(trimmedMessage);
    return fallback;
  }
}

// Cache API responses for repeated queries

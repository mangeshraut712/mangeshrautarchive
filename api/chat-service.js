/**
 * ═══════════════════════════════════════════════════════════
 * CHAT SERVICE - OpenRouter with Gemini 2.0 Flash ONLY
 * Clean implementation with proper response format
 * ═══════════════════════════════════════════════════════════
 */

// API Configuration - ONLY OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || '';
const MODEL = 'google/gemini-2.0-flash-001'; // Gemini 2.0 Flash via OpenRouter
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// LinkedIn Profile Data - UPDATED WITH CORRECT EDUCATION
const LINKEDIN_PROFILE = {
  name: "Mangesh Raut",
  title: "Software Engineer | AI/ML Specialist",
  location: "Philadelphia, PA",
  email: "mbr63@drexel.edu",
  linkedin: "linkedin.com/in/mangeshraut71298",
  
  summary: "Software Engineer with expertise in AI/ML, full-stack development, and cloud technologies. Passionate about building intelligent systems and scalable applications.",
  
  experience: [
    {
      title: "Software Engineer",
      company: "Drexel University",
      period: "2023 - Present",
      description: "Developing AI-powered applications and research tools"
    }
  ],
  
  skills: {
    languages: ["Python", "JavaScript", "TypeScript", "Java", "C++"],
    frameworks: ["React", "Node.js", "Django", "TensorFlow", "PyTorch"],
    cloud: ["AWS", "Azure", "Google Cloud"],
    ai_ml: ["Machine Learning", "Deep Learning", "NLP", "Computer Vision"]
  },
  
  education: [
    {
      degree: "Bachelor's in Computer Engineering",
      school: "University",
      location: "India",
      year: "Graduated 2023",
      status: "Completed"
    },
    {
      degree: "Master's in Computer Science (AI/ML focus)",
      school: "Drexel University",
      location: "Philadelphia, PA",
      year: "Expected 2025",
      status: "Currently pursuing"
    }
  ]
};

// System prompt for AI
const SYSTEM_PROMPT = `You are AssistMe, an intelligent AI assistant for Mangesh Raut's portfolio website.

Your role:
- Answer questions about Mangesh's experience, skills, education, and projects
- Provide helpful technical information when asked
- Be professional, concise, and friendly
- For portfolio questions, use the provided LinkedIn data
- For general questions, provide accurate and helpful responses

Keep responses clear and under 150 words unless more detail is specifically requested.`;

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
function buildLinkedInPrompt(message) {
  return `User Question: ${message}

LinkedIn Profile Context:
${JSON.stringify(LINKEDIN_PROFILE, null, 2)}

Please answer the user's question using the LinkedIn profile information. Be specific and professional.`;
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

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mangeshraut712.github.io/mangeshrautarchive/',
        'X-Title': 'Mangesh Raut Portfolio'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }

    return {
      answer: data.choices[0].message.content.trim(),
      processingTime,
      usage: data.usage || null
    };

  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}

/**
 * Offline fallback response
 */
function offlineFallback(message = '') {
  const type = classifyType(message);
  
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
 * Main query processing function
 */
async function processQuery({ message = '', messages = [] } = {}) {
  const startTime = Date.now();
  
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message format');
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new Error('Empty message');
  }

  // Detect query type
  const type = classifyType(trimmedMessage);
  const category = getCategory(type);
  const wantsLinkedIn = isLinkedInQuery(trimmedMessage);

  // Build message array
  const systemMessage = { role: 'system', content: SYSTEM_PROMPT };
  let userMessage;

  if (wantsLinkedIn) {
    userMessage = { role: 'user', content: buildLinkedInPrompt(trimmedMessage) };
  } else {
    userMessage = { role: 'user', content: trimmedMessage };
  }

  const conversationMessages = [systemMessage, ...messages, userMessage];

  // Try OpenRouter
  try {
    const response = await callOpenRouter({
      model: MODEL,
      messages: conversationMessages
    });

    const runtime = Date.now() - startTime;

    return {
      answer: response.answer,
      source: 'OpenRouter',
      model: 'Gemini 2.0 Flash',
      category: wantsLinkedIn ? 'Portfolio' : category,
      confidence: wantsLinkedIn ? 0.95 : 0.90,
      runtime: `${runtime}ms`,
      // Legacy fields for compatibility
      type,
      processingTime: response.processingTime,
      providers: ['OpenRouter'],
      usage: response.usage
    };

  } catch (error) {
    console.error('API Error:', error.message);
    return offlineFallback(trimmedMessage);
  }
}

export default { processQuery };

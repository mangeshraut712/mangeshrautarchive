// Server-side chat service for Vercel functions
// Simplified version that doesn't rely on browser APIs

// Multi-Model AI Service - Combines multiple AI providers for best responses
class MultiModelAIService {
  constructor() {
    // Initialize providers lazily to avoid issues during import
    this.providers = null;
    this._initialized = false;
  }

  _initializeProviders() {
    if (this._initialized) return;

    this.providers = {
      grok: {
        apiKey: process.env.GROK_API_KEY,
        enabled: !!process.env.GROK_API_KEY,
        baseURL: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-4-latest'
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        enabled: !!process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-haiku-20240307'
      },
      perplexity: {
        apiKey: process.env.PERPLEXITY_API_KEY,
        enabled: !!process.env.PERPLEXITY_API_KEY,
        baseURL: 'https://api.perplexity.ai/chat/completions',
        model: 'llama-3.1-sonar-small-128k-online'
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        enabled: !!process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: 'gemini-pro'
      },
      gemini_firebase: {
        apiKey: process.env.GEMINI_FIREBASE_API_KEY,
        enabled: !!process.env.GEMINI_FIREBASE_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: 'gemini-pro'
      },
      huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY,
        enabled: !!process.env.HUGGINGFACE_API_KEY,
        baseURL: 'https://api-inference.huggingface.co/models/microsoft/UserLM-8b',
        model: 'microsoft/UserLM-8b'
      }
    };

    this._initialized = true;
  }

  async generateResponse(message, options = {}) {
    // Initialize providers if not already done
    this._initializeProviders();

    console.log('🤖 Trying all available AI models for best response...');

    const responses = [];

    // Try each provider
    for (const [providerName, config] of Object.entries(this.providers)) {
      if (!config.enabled) continue;

      try {
        const response = await this.callProvider(providerName, config, message, options);
        if (response) {
          responses.push({
            provider: providerName,
            content: response,
            confidence: this.calculateConfidence(response, message)
          });
        }
      } catch (error) {
        console.error(`❌ ${providerName} API error:`, error.message);
      }
    }

    if (responses.length === 0) {
      console.log('❌ No AI providers available');
      return null;
    }

    // Return the best response
    const bestResponse = this.selectBestResponse(responses, message);
    console.log(`✅ Selected best response from ${bestResponse.provider} (confidence: ${bestResponse.confidence})`);

    return `${bestResponse.content} (Powered by ${this.getProviderDisplayName(bestResponse.provider)})`;
  }

  async callProvider(providerName, config, message, options) {
    switch (providerName) {
      case 'grok':
        return await this.callGrokAPI(config, message, options);
      case 'anthropic':
        return await this.callAnthropicAPI(config, message, options);
      case 'perplexity':
        return await this.callPerplexityAPI(config, message, options);
      case 'gemini':
      case 'gemini_firebase':
        return await this.callGeminiAPI(config, message, options);
      case 'huggingface':
        return await this.callHuggingFaceAPI(config, message, options);
      default:
        return null;
    }
  }

  async callGrokAPI(config, message, options) {
    const response = await fetch(config.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are AssistMe, an intelligent AI assistant for Mangesh Raut\'s portfolio website. Provide concise, accurate answers about his background, skills, projects, and general knowledge. Keep responses professional and helpful.'
          },
          { role: 'user', content: message }
        ],
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  }

  async callAnthropicAPI(config, message, options) {
    const response = await fetch(config.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: options.maxTokens || 512,
        system: 'You are AssistMe, an intelligent AI assistant for Mangesh Raut\'s portfolio website. Provide concise, accurate answers about his background, skills, projects, and general knowledge. Keep responses professional and helpful.',
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const textBlock = data.content?.find(block => block.type === 'text');
    return textBlock?.text;
  }

  async callPerplexityAPI(config, message, options) {
    const response = await fetch(config.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are AssistMe, an intelligent AI assistant for Mangesh Raut\'s portfolio website. Provide concise, accurate answers about his background, skills, projects, and general knowledge. Keep responses professional and helpful.'
          },
          { role: 'user', content: message }
        ],
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  }

  async callHuggingFaceAPI(config, message, options) {
    const response = await fetch(config.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `You are AssistMe, an intelligent AI assistant for Mangesh Raut's portfolio website. Provide concise, accurate answers about his background, skills, projects, and general knowledge. Keep responses professional and helpful.

User query: ${message}`,
        parameters: {
          max_new_tokens: options.maxTokens || 512,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9,
          do_sample: true,
          return_full_text: false
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && Array.isArray(data) && data.length > 0) {
      return data[0]?.generated_text || data[0]?.text;
    }

    return null;
  }

  async callGeminiAPI(config, message, options) {
    const response = await fetch(`${config.baseURL}?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are AssistMe, an intelligent AI assistant for Mangesh Raut's portfolio website. Provide concise, accurate answers about his background, skills, projects, and general knowledge. Keep responses professional and helpful.

User query: ${message}`
          }]
        }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: 40,
          topP: options.topP || 0.9,
          maxOutputTokens: options.maxTokens || 512,
        }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  calculateConfidence(response, originalQuery) {
    if (!response) return 0;

    let score = 0.5; // Base score

    // Length appropriateness (not too short, not too long)
    if (response.length > 50) score += 0.2;
    if (response.length > 200) score += 0.1;
    if (response.length < 10) score -= 0.3;

    // Relevance to query
    const queryWords = originalQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const responseWords = response.toLowerCase().split(/\s+/);
    const relevanceMatches = queryWords.filter(word =>
      responseWords.some(rWord => rWord.includes(word) || word.includes(rWord))
    ).length;
    score += Math.min(relevanceMatches * 0.1, 0.3);

    // Professional tone indicators
    if (response.includes('Mangesh') || response.includes('portfolio') || response.includes('experience')) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  selectBestResponse(responses, originalQuery) {
    // Score each response
    const scored = responses.map(response => ({
      ...response,
      score: this.calculateConfidence(response.content, originalQuery)
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    console.log(`📊 Response scores: ${scored.map(r => `${r.provider}: ${r.score.toFixed(2)}`).join(', ')}`);

    return scored[0];
  }

  getProviderDisplayName(provider) {
    const names = {
      grok: 'Grok xAI',
      anthropic: 'Claude',
      perplexity: 'Perplexity',
      gemini: 'Gemini',
      gemini_firebase: 'Gemini',
      huggingface: 'UserLM-8b'
    };
    return names[provider] || provider;
  }

  getEnabledProviders() {
    // Initialize providers if not already done
    this._initializeProviders();

    return Object.entries(this.providers)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
  }
}

class SimpleCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
    return value;
  }

  clear() {
    this.cache.clear();
  }
}

const responseCache = new SimpleCache(50);

// Knowledge base for portfolio information
class KnowledgeBase {
  constructor() {
    this.profile = {
      name: "Mangesh Raut",
      headline: "Software Engineer | Cloud & AI | MSCS Drexel",
      summary: "Software Engineer at Customized Energy Solutions (Philadelphia) focused on Spring Boot, AngularJS, AWS, and TensorFlow to accelerate energy analytics. MS in Computer Science (AI/ML focus) from Drexel University.",
      location: "Philadelphia, PA, USA • Pune, MH, India",
      contact: {
        email: "mbr63@drexel.edu",
        linkedin: "https://www.linkedin.com/in/mangeshraut71298/",
        github: "https://github.com/mangeshraut712",
        portfolio: "https://mangeshraut71298.wixsite.com/mangeshrautarchive"
      },
      experience: [
        {
          title: "Software Engineer",
          company: "Customized Energy Solutions",
          location: "Philadelphia, PA",
          period: "Aug 2024 – Present",
          highlights: [
            "Built Spring Boot + Angular energy dashboards (~40% faster data renders)",
            "Automated AWS Terraform pipelines with Dockerized Jenkins (35% quicker releases)",
            "Improved demand forecasting accuracy by 25% using TensorFlow LSTM models"
          ]
        }
      ],
      skills: {
        languages: ["JavaScript", "TypeScript", "Python", "Java", "C++"],
        frameworks: ["Spring Boot", "AngularJS", "React", "TensorFlow", "OpenCV"],
        cloud: ["AWS Lambda", "EC2", "Terraform", "Jenkins CI/CD"],
        data: ["PostgreSQL", "MongoDB", "MySQL", "LSTM forecasting", "Pandas"]
      }
    };
  }

  getPortfolioInfo(query) {
    const lower = query.toLowerCase();

    if (lower.includes('linkedin') || lower.includes('profile')) {
      return `${this.profile.headline}. LinkedIn: ${this.profile.contact.linkedin}`;
    }

    if (lower.includes('github')) {
      return `GitHub: ${this.profile.contact.github}. Recent work includes LeetCodeByMangesh and ML-driven forecasting tools.`;
    }

    if (lower.includes('contact') || lower.includes('email')) {
      return `Reach me at ${this.profile.contact.email}. LinkedIn: ${this.profile.contact.linkedin}.`;
    }

    if (lower.includes('experience') || lower.includes('work')) {
      const role = this.profile.experience[0];
      return `${role.title} @ ${role.company} (${role.period}, ${role.location}). Focus: ${role.highlights.slice(0, 2).join('; ')}.`;
    }

    if (lower.includes('skill') || lower.includes('tech')) {
      return `Core stack: ${this.profile.skills.languages.slice(0, 4).join(', ')}. Cloud & DevOps: ${this.profile.skills.cloud.slice(0, 4).join(', ')}.`;
    }

    if (lower.includes('who are you') || lower.includes('about')) {
      return `${this.profile.summary} LinkedIn: ${this.profile.contact.linkedin}`;
    }

    return `${this.profile.summary} Connect on LinkedIn: ${this.profile.contact.linkedin}`;
  }

  getGeneralInfo(query) {
    const lower = query.toLowerCase().trim();

    if (['hello', 'hi', 'hey'].includes(lower)) {
      return { answer: "Hello! I'm AssistMe, Mangesh Raut's AI assistant. How can I help?", type: 'greeting' };
    }

    if (lower.includes('who are you') || lower.includes('your name')) {
      return { answer: "I'm AssistMe, the AI assistant for Mangesh Raut's portfolio. Ask me about his work, experience, or anything tech!", type: 'identity' };
    }

    if (lower.includes('help')) {
      return { answer: "Sure! You can ask about Mangesh's roles, skills, or projects—or try general knowledge, math, or time/date questions.", type: 'help' };
    }

    if (lower.includes('thank')) {
      return { answer: "Happy to help! Let me know if you need anything else.", type: 'thanks' };
    }

    return null;
  }
}

// Math utilities for server-side calculations
class MathUtils {
  evaluate(expression) {
    if (!expression) return null;

    try {
      // Basic arithmetic evaluation (simplified)
      const sanitized = expression
        .replace(/\s/g, '')
        .replace(/[^0-9+\-*/.()]/g, '');

      if (!sanitized) return null;

      // Use Function constructor for evaluation (safer than eval in some contexts)
      const result = new Function('return ' + sanitized)();

      if (typeof result === 'number' && isFinite(result)) {
        return result;
      }

      return null;
    } catch (error) {
      console.error('Math evaluation error:', error);
      return null;
    }
  }

  convertUnits(value, fromUnit, toUnit) {
    const conversions = {
      // Length
      'meters': { 'feet': value * 3.28084, 'inches': value * 39.3701, 'kilometers': value / 1000, 'miles': value * 0.000621371 },
      'feet': { 'meters': value / 3.28084, 'inches': value * 12, 'kilometers': value / 3280.84, 'miles': value / 5280 },
      'inches': { 'meters': value / 39.3701, 'feet': value / 12, 'kilometers': value / 39370.1, 'miles': value / 63360 },
      'kilometers': { 'meters': value * 1000, 'feet': value * 3280.84, 'inches': value * 39370.1, 'miles': value * 0.621371 },
      'miles': { 'meters': value / 0.000621371, 'feet': value * 5280, 'inches': value * 63360, 'kilometers': value / 0.621371 },

      // Temperature
      'celsius': { 'fahrenheit': (value * 9/5) + 32, 'kelvin': value + 273.15 },
      'fahrenheit': { 'celsius': (value - 32) * 5/9, 'kelvin': (value - 32) * 5/9 + 273.15 },
      'kelvin': { 'celsius': value - 273.15, 'fahrenheit': (value - 273.15) * 9/5 + 32 },

      // Weight
      'kilograms': { 'pounds': value * 2.20462, 'grams': value * 1000, 'ounces': value * 35.274 },
      'pounds': { 'kilograms': value / 2.20462, 'grams': value * 453.592, 'ounces': value * 16 },
      'grams': { 'kilograms': value / 1000, 'pounds': value / 453.592, 'ounces': value / 28.3495 },
      'ounces': { 'kilograms': value / 35.274, 'pounds': value / 16, 'grams': value * 28.3495 }
    };

    if (conversions[fromUnit] && conversions[fromUnit][toUnit] !== undefined) {
      return conversions[fromUnit][toUnit];
    }

    return null;
  }
}

// Main chat service for Vercel
class ChatService {
  constructor() {
    this.knowledgeBase = new KnowledgeBase();
    this.mathUtils = new MathUtils();
    this.multiModelService = new MultiModelAIService();
  }

  async processQuery(query) {
    const startTime = Date.now();
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        answer: "Please provide a question or message.",
        type: 'general',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }

    const cacheKey = `answer:${normalizedQuery.toLowerCase()}`;

    // Check cache first
    const cached = responseCache.get(cacheKey);
    if (cached) {
      return { ...cached, processingTime: Date.now() - startTime };
    }

    let response = null;

    try {
      // Handle utility queries
      response = this.handleUtilityQuery(normalizedQuery);
      if (response) {
        responseCache.set(cacheKey, response);
        return { ...response, processingTime: Date.now() - startTime };
      }

      // Handle portfolio queries
      if (this.isPortfolioQuery(normalizedQuery)) {
        response = await this.handlePortfolioQuery(normalizedQuery);
      }
      // Handle math queries
      else if (this.isMathQuery(normalizedQuery)) {
        response = await this.handleMathQuery(normalizedQuery);
      }
      // Handle general queries
      else {
        response = await this.handleGeneralQuery(normalizedQuery);
      }

      if (!response) {
        response = this.generateFallback(normalizedQuery);
      }

    } catch (error) {
      console.error('Query processing error:', error);
      response = { answer: "I hit a snag processing that question. Try rephrasing it.", type: 'error' };
    }

    responseCache.set(cacheKey, response);
    return { ...response, processingTime: Date.now() - startTime };
  }

  handleUtilityQuery(query) {
    const lower = query.toLowerCase().trim();

    if (/\b(time|current time|what time is it)\b/.test(lower)) {
      return { answer: `Current server time: ${new Date().toLocaleTimeString()}`, type: 'utility' };
    }

    if (/\b(date|today|what day is it)\b/.test(lower)) {
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return { answer: `Today is ${date}`, type: 'utility' };
    }

    return null;
  }

  isPortfolioQuery(query) {
    const lower = query.toLowerCase();
    const portfolioTerms = [
      'mangesh', 'raut', 'portfolio', 'experience', 'skill', 'project',
      'education', 'contact', 'linkedin', 'github', 'who are you', 'about'
    ];
    return portfolioTerms.some(term => lower.includes(term));
  }

  isMathQuery(query) {
    return /\d+\s*[+\-*/=]\s*\d+/.test(query) ||
           /\b(convert|calculate|compute|solve)\b/.test(query.toLowerCase());
  }

  async handlePortfolioQuery(query) {
    const answer = this.knowledgeBase.getPortfolioInfo(query);
    return {
      answer,
      type: 'portfolio',
      confidence: 0.9
    };
  }

  async handleMathQuery(query) {
    const lower = query.toLowerCase();

    // Handle unit conversions
    const conversionMatch = lower.match(/convert\s+(\d+(?:\.\d+)?)\s*(\w+)\s+to\s+(\w+)/);
    if (conversionMatch) {
      const [, value, fromUnit, toUnit] = conversionMatch;
      const result = this.mathUtils.convertUnits(parseFloat(value), fromUnit, toUnit);

      if (result !== null) {
        return {
          answer: `Converted: ${result.toFixed(2)} ${toUnit}`,
          type: 'math',
          confidence: 0.9
        };
      }
    }

    // Handle basic calculations
    const calcMatch = query.match(/(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)/);
    if (calcMatch) {
      const [, num1, operator, num2] = calcMatch;
      const result = this.mathUtils.evaluate(`${num1}${operator}${num2}`);

      if (result !== null) {
        return {
          answer: `Result: ${result}`,
          type: 'math',
          confidence: 0.9
        };
      }
    }

    return {
      answer: "I can handle basic calculations and unit conversions. Try: 'convert 10 km to miles' or 'calculate 15 + 27'",
      type: 'math',
      confidence: 0.3
    };
  }

  async handleGeneralQuery(query) {
    const greeting = this.knowledgeBase.getGeneralInfo(query);
    if (greeting) {
      return greeting;
    }

    // Try all available AI models and pick the best response
    const enabledProviders = this.multiModelService.getEnabledProviders();
    if (enabledProviders.length > 0) {
      console.log(`🤖 Trying ${enabledProviders.length} AI models: ${enabledProviders.join(', ')}`);

      const aiResponse = await this.multiModelService.generateResponse(
        `You are AssistMe, an intelligent AI assistant for Mangesh Raut's portfolio website. Provide concise, accurate answers about his background, skills, projects, and general knowledge. Keep responses professional and helpful. If the query is about Mangesh's portfolio, focus on his background. For general questions, use your real-time knowledge to provide the most current information available.

User query: ${query}`,
        {
          maxTokens: 512,
          temperature: 0.7,
          topP: 0.9
        }
      );

      if (aiResponse) {
        return {
          answer: aiResponse,
          type: 'ai',
          confidence: 0.9
        };
      }
    }

    return {
      answer: "I can help with information about Mangesh Raut's portfolio, basic math calculations, and unit conversions. What would you like to know?",
      type: 'general',
      confidence: 0.5
    };
  }

  generateFallback(query) {
    return {
      answer: "I'm still learning! For now, I can help with Mangesh's portfolio information, basic math, and unit conversions.",
      type: 'general',
      confidence: 0.3
    };
  }
}

const chatService = new ChatService();

export { ChatService };
export { chatService };
export default chatService;

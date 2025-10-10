// Server-side chat service for Vercel functions
// Simplified version that doesn't rely on browser APIs

// Hugging Face AI integration for microsoft/UserLM-8b
class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.enabled = !!this.apiKey;
    this.model = 'microsoft/UserLM-8b';
    this.baseURL = `https://api-inference.huggingface.co/models/${this.model}`;
  }

  async generateResponse(message, options = {}) {
    if (!this.enabled) {
      console.log('Hugging Face API key not configured');
      return null;
    }

    try {
      console.log('🧠 Calling Hugging Face UserLM-8b API...');

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: message,
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

      if (!response.ok) {
        console.error(`Hugging Face API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        const generatedText = data[0]?.generated_text || data[0]?.text;
        if (generatedText) {
          console.log('✅ Hugging Face API response received');
          return `[AI Response] ${generatedText} (Powered by UserLM-8b)`;
        }
      }

      console.log('❌ Hugging Face API returned incomplete response');
      return null;

    } catch (error) {
      console.error('❌ Hugging Face API error:', error);
      return null;
    }
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
    this.huggingFaceService = new HuggingFaceService();
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

    // Try Hugging Face UserLM-8b for general knowledge queries
    if (this.huggingFaceService.enabled) {
      console.log('🧠 Trying Hugging Face UserLM-8b for general query...');
      const aiResponse = await this.huggingFaceService.generateResponse(
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
          confidence: 0.8
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

export { ChatService, chatService };
export default chatService;

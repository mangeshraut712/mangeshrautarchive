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

// LinkedIn Profile Data - UPDATED FROM RESUME
const LINKEDIN_PROFILE = {
  name: "Mangesh Raut",
  title: "Software Engineer | Full-Stack Developer | AI/ML Engineer",
  location: "Philadelphia, PA, USA",
  email: "mbr63drexel@gmail.com",
  phone: "+1 (609) 505 3500",
  linkedin: "linkedin.com/in/mangeshraut71298",
  github: "mangeshraut71298",

  summary: `Software Engineer skilled in full-stack development (Java, Python, AngularJS) and cloud solutions (AWS, Docker), currently enhancing energy analytics tools at Customized Energy Solutions (40% efficiency gain). Previously honed expertise in network engineering (35% latency reduction at Harshwardhan Enterprises) and Java development (20% code optimization at IoasiZ), alongside part-time roles managing databases at Aramark and Drexel University. Eager to leverage hands-on experience with scalable systems, CI/CD pipelines, and machine learning to drive innovation in fast-paced teams. Actively pursuing roles focused on emerging technologies to accelerate career growth.`,

  experience: [
    {
      title: "Software Engineer",
      company: "Customized Energy Solutions",
      location: "Philadelphia, PA",
      period: "Aug 2024 - Present",
      description: `Full-Stack Development: Built energy analytics dashboards using Java Spring Boot (backend) and AngularJS (frontend), reducing data rendering latency by 40% via RESTful API optimization
Cloud DevOps: Orchestrated AWS Lambda/EC2 workflows with Terraform IaC, accelerating deployment by 35% through Dockerized Jenkins CI/CD pipelines
Machine Learning: Enhanced demand forecasting accuracy by 25% using Python-based LSTM models (TensorFlow) with feature engineering`
    },
    {
      title: "Software Engineer",
      company: "IoasiZ",
      location: "Piscataway, NJ",
      period: "Jul 2023 - Jul 2024",
      description: `System Modernization: Refactored legacy Java monoliths into modular services using Spring Framework, cutting code redundancy by 20% (SOLID principles)
Distributed Systems: Resolved 50+ bugs in microservices architecture, boosting sprint efficiency by 15% via JUnit/Mockito test suites
Performance Optimization: Integrated Redis caching for inventory APIs, achieving 30% faster response times through query tuning`
    },
    {
      title: "Database Administrator (Part-Time & Internship)",
      company: "Aramark",
      location: "Philadelphia, PA",
      period: "Jun 2022 - Jun 2023",
      description: `AWS Automation: Developed Python scripts to manage event inventory systems on AWS, reducing manual errors by 25% for 200+ events
Data Migration: Transitioned 3+ legacy databases to AWS RDS, improving scalability for high-traffic event analytics`
    },
    {
      title: "Database Administrator (Part-Time)",
      company: "Drexel University",
      location: "Philadelphia, PA",
      period: "Sep 2021 - May 2022",
      description: `SQL & Compliance: Maintained HIPAA-compliant MySQL databases for 5K+ student records, ensuring 99.9% accuracy with constraint-driven validation
Reporting Tools: Streamlined data workflows using Tableau and Excel, cutting report generation time by 20% for administrative teams`
    },
    {
      title: "Network Engineer",
      company: "Harshwardhan Enterprises",
      location: "Pune, India",
      period: "Jun 2020 - Jun 2021",
      description: `Network Optimization: Deployed Cisco ASR 9000 routers with OSPF/BGP protocols, slashing latency by 35% in enterprise WANs
Troubleshooting: Resolved 500+ connectivity issues via Wireshark analysis, achieving 90% SLA compliance for client networks
Scripting: Created Python-based monitoring tools, reducing manual diagnostics by 50%`
    }
  ],

  skills: {
    languages: ["Java", "Python", "SQL", "JavaScript"],
    frameworks: ["Spring Boot", "AngularJS", "TensorFlow", "scikit-learn"],
    cloud: ["AWS", "Docker", "Jenkins", "Terraform"],
    databases: ["PostgreSQL", "MongoDB", "MySQL"],
    tools: ["Git", "Jira", "Tableau", "Wireshark"],
    networking: ["Cisco", "OSPF/BGP"]
  },

  education: [
    {
      degree: "Master of Science in Computer Science, GPA: 3.3",
      school: "Drexel University",
      location: "Philadelphia, PA",
      period: "Sep 2021 - Jun 2023",
      status: "Completed"
    },
    {
      degree: "Bachelor of Engineering in Computer Engineering, GPA: 3.6",
      school: "Pune University",
      location: "Pune, India",
      period: "Jun 2017 - Jun 2020",
      status: "Completed"
    }
  ],
  
  projects: [
    {
      name: "Starlight Blogging Website",
      tech: ["Angular", "Flask", "SQLite"],
      period: "Jan 2023 - Apr 2023",
      description: "Built a blogging website with user authentication and post-management features. Attracted 100+ users within three months and enabled interactive community features"
    },
    {
      name: "Real-Time Face Emotion Recognition System",
      tech: ["Python", "OpenCV", "Machine Learning"],
      period: "Jun 2019 - Jun 2020",
      description: "Planned a real-time emotion recognition model with 95% accuracy. Arranged in retail stores and institutions, reducing incidents by 50%"
    },
    {
      name: "PC Crime Detector",
      tech: ["Java", "Database Integration", "Automation"],
      period: "Jun 2016 - Jun 2017",
      description: "Implemented security automation, reducing breaches by 80%. Deployed in institutions, decreasing security incidents by 50%"
    }
  ],

  publications: [
    {
      title: "Real-Time Face Emotion Recognition System",
      journal: "International Journal of Future Generation Communication and Networking",
      period: "May 2020 - Jun 2020",
      description: "Published research on facial recognition algorithms and image processing. Explored elastic bunch map graphing, PCA, and cascading techniques"
    }
  ],

  certifications: [
    "Google - Prompt Design in Vertex AI Skill Badge",
    "Digital Marketing, Online Marketing Fundamentals",
    "IBM - Cybersecurity Fundamentals",
    "Data Fundamentals (SQL/NoSQL)",
    "Explore Emerging Tech (AI)",
    "Fundamentals of Sustainability and Technology",
    "Cisco - Networking Basics (OSPF/BGP)",
    "CCNP (Routing & Switching)",
    "Microsoft - JavaScript Programming"
  ]
};

// System prompt for AI with enhanced capabilities
const SYSTEM_PROMPT = `You are AssistMe, an intelligent AI assistant powered by OpenRouter using Google's Gemini 2.0 Flash model.

Your capabilities:
- Answer questions about Mangesh Raut's portfolio (experience, skills, education, projects)
- Provide technical information and explanations
- Help with programming and coding questions
- Answer general knowledge questions
- Be professional, concise, and friendly
- When asked about yourself: "I'm AssistMe, powered by OpenRouter using Google's Gemini 2.0 Flash model"

For portfolio questions, use the provided LinkedIn profile data.
For general questions, provide accurate, helpful responses.

IMPORTANT: Keep responses clear and under 150 words unless more detail is requested.`;

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
 * Main query processing function with enhanced features
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

  // Check for direct commands (instant response)
  const directResponse = handleDirectCommand(trimmedMessage);
  if (directResponse) {
    return {
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
  }

  // Detect query type
  const type = classifyType(trimmedMessage);
  const category = getCategory(type);
  const wantsLinkedIn = isLinkedInQuery(trimmedMessage);
  
  // Handle special command types with enhanced features
  const lower = trimmedMessage.toLowerCase();
  
  // Joke command
  if (lower.includes('joke') || lower.includes('funny')) {
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await response.json();
      const runtime = Date.now() - startTime;
      
      return {
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
    
    return {
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
    
    return {
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
  }

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

import axios from 'axios';

// --- Multiple AI Providers with Fallback Support ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Free tier models (ordered by quality and availability)
// Rotate through models for better variety and reliability
const FREE_MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'deepseek/deepseek-chat',
    'microsoft/phi-3-medium-4k-instruct:free',
    'mistralai/mistral-7b-instruct:free'
];

// Randomly select starting model to distribute load
let currentModelIndex = Math.floor(Math.random() * FREE_MODELS.length);
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || FREE_MODELS[currentModelIndex];

// Enhanced system prompt with deep reasoning and accuracy
const SYSTEM_PROMPT = `You are an advanced AI assistant with deep reasoning capabilities.

**CRITICAL: Accuracy First**
- If you don't know something with certainty, admit it
- Never fabricate dates, events, or facts
- For current events beyond your training, say "I don't have real-time information"
- For political questions, be cautious and factual

**Deep Thinking Process:**
1. Analyze the question thoroughly before responding
2. Break down complex problems into logical steps
3. Consider multiple perspectives and edge cases
4. Provide well-reasoned, accurate answers

**Core Capabilities:**
- Expert-level knowledge in technology, science, mathematics, AI/ML
- Step-by-step problem solving with clear explanations
- Honest about knowledge limitations
- Concise yet comprehensive responses (2-4 sentences ideal)
- Natural conversation flow

**Response Guidelines:**
- For factual questions: Provide direct, accurate answers OR admit uncertainty
- For current events: State training cutoff limitations
- For complex queries: Show your reasoning process
- For technical topics: Include relevant details and examples
- Use markdown formatting for clarity when helpful

You were created by Mangesh Raut. Answer questions directly and helpfully.`;

// LinkedIn profile data
const LINKEDIN_PROFILE = {
  headline: 'Software Engineer | Full-Stack Developer | AI/ML Engineer',
  location: 'Philadelphia, PA (open to relocation)',
  summary: [
    'Software Engineer at Customized Energy Solutions (2024–Present)',
    'Experience building AI-driven analytics with Spring Boot, AngularJS, AWS, TensorFlow, Python',
    'Masters in Computer Science (AI/ML focus) from Drexel University',
    'Bachelor’s in Computer Engineering from Savitribai Phule Pune University'
  ],
  experience: [
    {
      role: 'Software Engineer',
      company: 'Customized Energy Solutions',
      period: '2024 – Present',
      highlights: [
        'Build AI-powered analytics for energy data using Spring Boot, AngularJS, AWS, TensorFlow',
        'Led cross-functional collaboration on ML systems implementation',
        'Developed automated processing pipelines reducing manual work by 60%'
      ]
    },
    {
      role: 'Software Engineer (Previous Roles)',
      company: 'Various Companies',
      highlights: [
        'Developed full-stack applications with Java, Python, JavaScript, SQL, Docker',
        'Delivered AI/ML prototypes and production ML service solutions',
        'Focused on scalable web applications and data processing systems'
      ]
    }
  ],
  education: [
    {
      degree: "Master of Science in Computer Science (AI/ML focus)",
      school: 'Drexel University',
      graduation: 'Expected 2025',
      coursework: 'Neural Networks, Deep Learning, Machine Learning, Big Data Processing'
    },
    {
      degree: 'Bachelor of Engineering in Computer Engineering',
      school: 'Savitribai Phule Pune University',
      period: '2019 – 2023',
      coursework: 'Software Development, Database Systems, Computer Networks, System Design'
    }
  ],
  skills: [
    'Spring Boot', 'AngularJS', 'Python', 'AWS', 'TensorFlow',
    'Machine Learning', 'Java', 'JavaScript', 'SQL', 'Docker'
  ],
  projects: [
    'S2R Voice Chatbot System (Advanced AI)',
    'AI-powered geospatial analytics platform',
    'Machine Learning research & implementations',
    'Full-stack web applications with modern frameworks'
  ],
  contact: {
    email: 'mbr63@drexel.edu',
    linkedin: 'https://www.linkedin.com/in/mangeshraut71298/',
    location: 'Philadelphia, Pennsylvania'
  }
};

// Enhanced prompt for LinkedIn/personal questions
const LINKEDIN_SYSTEM_PROMPT = `You are a professional career counselor analyzing Mangesh Raut's LinkedIn profile. You have access to their complete professional profile and provide accurate, contextual information about their background, experience, skills, and career trajectory.

Profile Summary:
${JSON.stringify(LINKEDIN_PROFILE, null, 2)}

Instructions:
- Use information verbatim when possible from the profile data
- If information isn't in the profile, use general knowledge but be truthful
- Provide concise, professional responses that directly answer the question
- Focus on facts, achievements, and professional development
- Use current timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' })}`;

// Check if question is about Mangesh/personal information
function isPersonalQuestion(query) {
  const terms = ['mangesh', 'raut', 'qualification', 'experience', 'skills',
                'drexel', 'linkedin', 'portfolio', 'projects', 'education',
                'contact', 'background', 'career', 'technical skills'];
  const lower = query.toLowerCase();
  return terms.some(term => lower.includes(term));
}

/**
 * Enhanced AI Processing with Multiple Model Fallback
 * Uses free tier models with automatic fallback on failure
 */
async function processQueryWithAI(query, useLinkedInContext = false) {
    const startTime = Date.now();
    const isPersonalQuery = isPersonalQuestion(query);

    // Check if API key is configured
    if (!OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY not set in environment variables');
        return {
            answer: "I'm an AI assistant that can help with technology, science, mathematics, and general knowledge. I can also provide information about software development and AI/ML topics. What would you like to know?",
            source: 'offline-knowledge',
            type: 'general',
            confidence: 0.3,
            processingTime: Date.now() - startTime,
            providers: [],
        };
    }

    console.log(`🔑 OpenRouter API Key: ${OPENROUTER_API_KEY ? 'Found (length: ' + OPENROUTER_API_KEY.length + ')' : 'NOT FOUND'}`);
    
    // Simple in-memory cache to reduce API calls
    const cacheKey = query.toLowerCase().trim();
    if (responseCache.has(cacheKey)) {
        const cached = responseCache.get(cacheKey);
        console.log('💾 Using cached response');
        return {
            ...cached,
            processingTime: Date.now() - startTime,
            cached: true
        };
    }

    const systemPrompt = isPersonalQuery ? LINKEDIN_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const source = isPersonalQuery ? 'linkedin + openrouter' : 'openrouter';

    // Try multiple models with rotation and fallback
    const maxAttempts = Math.min(5, FREE_MODELS.length); // Try up to 5 models
    
    // Select random model each time for better distribution
    const startIndex = Math.floor(Math.random() * FREE_MODELS.length);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Try different models each attempt
        const modelIndex = (startIndex + attempt) % FREE_MODELS.length;
        const model = FREE_MODELS[modelIndex];
        console.log(`🤖 Attempting model ${attempt + 1}/${maxAttempts}: ${model}`);
        
        // Add exponential backoff between attempts
        if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://mangeshrautarchive.vercel.app',
                    'X-Title': process.env.OPENROUTER_APP_TITLE || 'S2R Enhanced AI Assistant'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: query },
                    ],
                    temperature: 0.4,
                    max_tokens: 1000,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.warn(`⚠️ Model ${model} failed (${response.status}): ${errorBody.substring(0, 100)}`);
                // Try next model
                continue;
            }

            const data = await response.json();
            const answer = data?.choices?.[0]?.message?.content;

            if (answer && answer.trim().length > 10) {
                console.log(`✅ Success with ${model} (${Date.now() - startTime}ms): ${answer.substring(0, 100)}...`);

                const result = {
                    answer: answer.trim(),
                    source: `${source} (${model})`,
                    confidence: isPersonalQuery ? 0.95 : 0.88,
                    processingTime: Date.now() - startTime,
                    providers: ['OpenRouter'],
                    winner: model,
                    type: isPersonalQuery ? 'portfolio' : 'general'
                };
                
                // Cache successful responses
                if (!isPersonalQuery) {
                    responseCache.set(cacheKey, result);
                }
                
                return result;
            } else {
                console.warn(`⚠️ Model ${model} returned empty response`);
                continue;
            }
        } catch (error) {
            console.error(`❌ Model ${model} error:`, error.message);
            // Try next model
            continue;
        }
    }

    // All models failed - return offline fallback
    console.error('❌ All OpenRouter models failed, using offline fallback');
    return {
        answer: "I'm an AI assistant that can help with technology, science, mathematics, and general knowledge questions. What would you like to explore?",
        source: 'offline-knowledge',
        type: 'general',
        confidence: 0.3,
        processingTime: Date.now() - startTime,
        providers: [],
        note: 'All AI models unavailable'
    };
}

function applyCors(res, origin) {
    const allowedOrigins = [
        'https://mangeshraut712.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ];
    
    // Check if origin matches any allowed origin or is a subdomain
    const isAllowed = allowedOrigins.some(allowed => {
        if (origin === allowed) return true;
        // Allow subpaths of GitHub Pages
        if (allowed === 'https://mangeshraut712.github.io' && origin && origin.startsWith('https://mangeshraut712.github.io')) {
            return true;
        }
        return false;
    });
    
    if (origin && isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Default to GitHub Pages origin if no origin header or not allowed
        res.setHeader('Access-Control-Allow-Origin', 'https://mangeshraut712.github.io');
    }
    
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
}

export default async function handler(req, res) {
    // Apply CORS headers to ALL responses (including OPTIONS, errors, etc.)
    applyCors(res, req.headers.origin);

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        console.log('✅ CORS preflight request handled');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        console.log('❌ Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('📨 Received chat request from origin:', req.headers.origin);

    try {
        const { message, messages } = req.body ?? {};

        if (!message || typeof message !== 'string') {
            console.log('❌ Invalid request: missing or invalid message');
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            console.log('❌ Invalid request: empty message');
            return res.status(400).json({
                error: 'Message cannot be empty'
            });
        }

        console.log('💬 Processing message:', trimmedMessage.substring(0, 100));

        const result = await processQueryWithAI(trimmedMessage, isPersonalQuestion(trimmedMessage));

        res.setHeader('Content-Type', 'application/json');

        console.log('✅ Sending response:', {
            source: result.source,
            confidence: result.confidence,
            answerLength: result.answer?.length || 0
        });

        return res.status(200).json({
            answer: result.answer,
            type: result.type || 'general',
            confidence: result.confidence,
            processingTime: result.processingTime,
            source: result.source,
            providers: result.providers || [],
            winner: result.winner || 'OpenRouter'
        });
    } catch (error) {
        console.error('Chat API error:', error);

        res.setHeader('Content-Type', 'application/json');

        return res.status(500).json({
            error: 'Internal server error',
            message: 'I\'m experiencing technical difficulties. Please try again in a moment.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

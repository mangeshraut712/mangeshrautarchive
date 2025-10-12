import axios from 'axios';

// Simple in-memory cache for responses
const responseCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL = 3600000; // 1 hour

// --- Multiple AI Providers with Fallback Support ---
// Priority: Grok (xAI) → Gemini → OpenRouter → Offline
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Track API status for user feedback
let apiStatus = {
    grok: { available: false, lastCheck: 0 },
    gemini: { available: false, lastCheck: 0 },
    openrouter: { available: false, lastCheck: 0 },
    rateLimit: false
};

// Grok models (xAI - PRIMARY - latest free tier)
const GROK_MODELS = [
    'grok-beta',
    'grok-2-latest'
];

// OpenRouter models (BACKUP)
const OPENROUTER_MODELS = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'openai/gpt-4o-mini:free',
    'google/gemini-2.0-flash-exp:free',
    'qwen/qwen-2.5-7b-instruct:free'
];

// Default models
const DEFAULT_GROK_MODEL = 'grok-2-1212';
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini:free';

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

    console.log('=== API KEYS STATUS ===');
    console.log(`🔑 Grok (xAI): ${GROK_API_KEY ? 'Found ✓' : 'Missing ✗'}`);
    console.log(`🔑 Gemini: ${GEMINI_API_KEY ? 'Found ✓' : 'Missing ✗'}`);
    console.log(`🔑 OpenRouter: ${OPENROUTER_API_KEY ? 'Found ✓' : 'Missing ✗'}`);
    console.log('======================');

    const systemPrompt = isPersonalQuery ? LINKEDIN_SYSTEM_PROMPT : SYSTEM_PROMPT;
    
    // TRY ALL PROVIDERS - USE FIRST ONE THAT WORKS
    console.log('🔍 Starting provider tests...');
    
    // Test Grok (xAI) - YOUR PREFERRED CHOICE
    if (GROK_API_KEY) {
        console.log('🚀 Testing Grok (xAI)... Key length:', GROK_API_KEY.length);
        try {
            const grokResult = await tryGrok(query, systemPrompt, startTime, isPersonalQuery);
            if (grokResult) {
                console.log('✅ GROK SUCCESS! Returning response');
                return grokResult;
            } else {
                console.log('⚠️ Grok returned null');
            }
        } catch (error) {
            console.error('❌ Grok exception:', error.message, error.stack);
        }
    } else {
        console.log('⚠️ Grok: No key found');
    }
    
    // Test Gemini
    if (GEMINI_API_KEY) {
        console.log('🔷 Testing Gemini... Key length:', GEMINI_API_KEY.length);
        try {
            const geminiResult = await tryGemini(query, systemPrompt, startTime, isPersonalQuery);
            if (geminiResult) {
                console.log('✅ GEMINI SUCCESS! Returning response');
                return geminiResult;
            } else {
                console.log('⚠️ Gemini returned null');
            }
        } catch (error) {
            console.error('❌ Gemini exception:', error.message, error.stack);
        }
    } else {
        console.log('⚠️ Gemini: No key found');
    }
    
    // Test OpenRouter (multiple models)
    if (OPENROUTER_API_KEY) {
        console.log('🔄 Testing OpenRouter...');
        const source = isPersonalQuery ? 'linkedin + openrouter' : 'openrouter';
        const maxAttempts = Math.min(3, OPENROUTER_MODELS.length);
        const startIndex = Math.floor(Math.random() * OPENROUTER_MODELS.length);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const modelIndex = (startIndex + attempt) % OPENROUTER_MODELS.length;
            const model = OPENROUTER_MODELS[modelIndex];
            console.log(`🤖 Testing OpenRouter model: ${model}`);

            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://mangeshrautarchive.vercel.app',
                        'X-Title': 'AssistMe AI'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: query }
                        ],
                        temperature: 0.4,
                        max_tokens: 1000
                    })
                });

                if (!response.ok) {
                    console.warn(`⚠️ OpenRouter ${model} HTTP ${response.status}`);
                    continue;
                }

                const data = await response.json();
                const answer = data?.choices?.[0]?.message?.content;

                if (answer && answer.trim().length > 10) {
                    console.log(`✅ OPENROUTER SUCCESS with ${model}!`);
                    return {
                        answer: answer.trim(),
                        source: `${source} (${model})`,
                        confidence: isPersonalQuery ? 0.95 : 0.88,
                        processingTime: Date.now() - startTime,
                        providers: ['OpenRouter'],
                        winner: model,
                        type: isPersonalQuery ? 'portfolio' : 'general',
                        rateLimit: false,
                        statusMessage: '🟢 AI Online (OpenRouter)'
                    };
                }
            } catch (error) {
                console.error(`❌ OpenRouter ${model} error:`, error.message);
                continue;
            }
        }
    }
    
    // All providers failed
    console.error('❌ ALL PROVIDERS FAILED');
    apiStatus.grok = { available: false, lastCheck: Date.now() };
    apiStatus.gemini = { available: false, lastCheck: Date.now() };
    apiStatus.openrouter = { available: false, lastCheck: Date.now() };
    apiStatus.rateLimit = true;
    
    return {
        answer: "⚠️ AI models are currently unavailable. Please try again in a moment.",
        source: 'offline-knowledge',
        type: 'general',
        confidence: 0.3,
        processingTime: Date.now() - startTime,
        providers: [],
        rateLimit: true,
        statusMessage: '🔴 All providers unavailable'
    };
}

// Grok (xAI) API integration (PRIMARY - most powerful)
async function tryGrok(query, systemPrompt, startTime, isPersonalQuery) {
    if (!GROK_API_KEY) {
        console.log('❌ Grok: No API key found');
        return null;
    }
    
    console.log(`🔑 Grok: Testing with key (length: ${GROK_API_KEY.length})`);
    
    // Try Grok models
    for (const model of GROK_MODELS) {
        try {
            console.log(`🚀 Grok: Calling API with model: ${model}`);
            
            const requestBody = {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                stream: false,
                temperature: 0.7,
                max_tokens: 1000
            };
            
            console.log(`📤 Grok request to: https://api.x.ai/v1/chat/completions`);
            
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log(`📥 Grok response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Grok ${model} HTTP ${response.status}:`, errorText.substring(0, 500));
                continue;
            }
            
            const data = await response.json();
            console.log(`📦 Grok response received:`, JSON.stringify(data).substring(0, 200));
            const answer = data?.choices?.[0]?.message?.content;
            
            if (answer && answer.trim().length > 10) {
                const elapsed = Date.now() - startTime;
                console.log(`✅ Grok ${model} success (${elapsed}ms)`);
                
                const source = isPersonalQuery ? 'linkedin + grok' : 'grok';
                
                return {
                    answer: answer.trim(),
                    source: `${source} (${model})`,
                    confidence: isPersonalQuery ? 0.95 : 0.92,
                    processingTime: elapsed,
                    providers: ['Grok'],
                    winner: model,
                    type: isPersonalQuery ? 'portfolio' : 'general',
                    rateLimit: false,
                    statusMessage: '🟢 AI Online (Grok)'
                };
            }
        } catch (error) {
            console.error(`❌ Grok ${model} error:`, error.message);
            continue;
        }
    }
    
    return null;
}

// Groq removed per user request - not needed

// Gemini API integration (backup)
async function tryGemini(query, systemPrompt, startTime, isPersonalQuery) {
    if (!GEMINI_API_KEY) return null;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\nUser: ${query}\n\nAssistant:` }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Gemini API error: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (answer && answer.trim().length > 10) {
            const elapsed = Date.now() - startTime;
            console.log(`✅ Gemini success (${elapsed}ms)`);
            
            const source = isPersonalQuery ? 'linkedin + gemini' : 'gemini';
            
            return {
                answer: answer.trim(),
                source: `${source} (gemini-1.5-flash)`,
                confidence: isPersonalQuery ? 0.95 : 0.90,
                processingTime: elapsed,
                providers: ['Gemini'],
                winner: 'gemini-1.5-flash',
                type: isPersonalQuery ? 'portfolio' : 'general',
                rateLimit: false,
                statusMessage: '🟢 AI Online (Gemini)'
            };
        }
        
        return null;
    } catch (error) {
        console.error('❌ Gemini error:', error.message);
        return null;
    }
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

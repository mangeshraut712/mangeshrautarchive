import axios from 'axios';

// --- Primary AI Provider OpenRouter (Free Working Keys) ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct:free';

// System prompt for advanced LLM behavior
// System prompt for general questions
const SYSTEM_PROMPT = `You are an advanced AI assistant created by Mangesh Raut. You provide intelligent, helpful, and accurate responses across all topics including technology, science, mathematics, and general knowledge.

Key capabilities:
- Deep thinking and reasoning for complex questions
- Technical expertise in AI/ML, software development, and data science
- Natural conversation flow with appropriate level of detail
- Helpful clarification when questions need more context

If the question is general or technical, prioritize giving a complete, accurate answer first. Only mention Mangesh Raut if specifically asked or if it's relevant to technical implementation details.`;

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
 * OpenRouter Single Provider: Use only OpenRouter since it has working keys
 */
async function processQueryWithAI(query, useLinkedInContext = false) {
    const startTime = Date.now();
    const isPersonalQuery = isPersonalQuestion(query);

    // Use only OpenRouter (has working keys)
    if (!OPENROUTER_API_KEY) {
        console.log('🌐 OpenRouter not configured, using offline knowledge');
        return {
            answer: "I'm an AI assistant that can help with technology, science, mathematics, and general knowledge. I can also provide information about software development and AI/ML topics. What would you like to know?",
            source: 'offline-knowledge',
            type: 'general',
            confidence: 0.3,
            processingTime: Date.now() - startTime,
            providers: [],
        };
    }

    console.log(`🤖 Calling OpenRouter with working key (${isPersonalQuery ? 'LinkedIn context' : 'regular'} )...`);

    const systemPrompt = isPersonalQuery ? LINKEDIN_SYSTEM_PROMPT : SYSTEM_PROMPT;
    const source = isPersonalQuery ? 'linkedin + openrouter modification' : 'openrouter';

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
                'X-Title': process.env.OPENROUTER_APP_TITLE || 'S2R Enhanced AI Assistant'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query },
                ],
                temperature: 0.3, // Lower temperature for factual LinkedIn responses
                max_tokens: 800, // Slightly higher for detailed LinkedIn info
                top_p: isPersonalQuery ? 0.7 : 0.9 // More conservative for professional info
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenRouter error ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;

        if (answer && answer.trim().length > 10) {
            console.log(`✅ OpenRouter responded (${Date.now() - startTime}ms): ${answer.substring(0, 100)}...`);

            const winner = isPersonalQuery ? 'LinkedIn + OpenRouter AI' : 'OpenRouter';

            return {
                answer: answer.trim(),
                source: source,
                confidence: isPersonalQuery ? 0.95 : 0.82, // Higher confidence for LinkedIn data
                processingTime: Date.now() - startTime,
                providers: ['OpenRouter'],
                winner: winner
            };
        } else {
            throw new Error('OpenRouter returned empty response');
        }
    } catch (error) {
        console.error('❌ OpenRouter failed:', error.message);

        // Fallback to offline knowledge
        console.log('💥 OpenRouter failed, using offline knowledge');
        return {
            answer: "I'm an AI assistant that can help with technology, science, mathematics, and general knowledge questions. What would you like to explore?",
            source: 'offline-knowledge',
            type: 'general',
            confidence: 0.3,
            processingTime: Date.now() - startTime,
            providers: ['OpenRouter'],
            note: 'OpenRouter was unavailable'
        };
    }
}

export default async function handler(req, res) {
    // CORS headers for development and production
    const allowedOrigins = [
        'https://mangeshraut712.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || origin === 'https://mangeshraut712.github.io') {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin && allowedOrigins.includes('https://mangeshraut712.github.io')) {
        res.setHeader('Access-Control-Allow-Origin', 'https://mangeshraut712.github.io');
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body ?? {};

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            return res.status(400).json({
                error: 'Message cannot be empty'
            });
        }

        const result = await processQueryWithAI(trimmedMessage);

        res.setHeader('Content-Type', 'application/json');

        return res.status(200).json({
            answer: result.answer,
            type: result.type || 'general',
            confidence: result.confidence,
            processingTime: result.processingTime,
            source: result.source,
            providers: result.providers,
            winner: result.winner
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

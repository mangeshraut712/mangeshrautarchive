// NEW ENDPOINT - Fresh deployment without caching issues
// Using ONLY OpenRouter with google/gemini-2.0-flash-001

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const MODEL = 'google/gemini-2.0-flash-001';

const SYSTEM_PROMPT = `You are AssistMe, an AI assistant for Mangesh Raut's portfolio.

Answer questions accurately and concisely. If asked about Mangesh, use the portfolio context provided.

Portfolio:
Mangesh Raut is a Software Engineer at Customized Energy Solutions.
Technologies: Spring Boot, AngularJS, AWS, TensorFlow, Python
Education: MS in Computer Science (AI/ML) from Drexel University
Contact: mbr63@drexel.edu • linkedin.com/in/mangeshraut71298`;

const LINKEDIN_PROFILE = `Mangesh Raut
Software Engineer | Full-Stack Developer | AI/ML Engineer
Philadelphia, Pennsylvania

EXPERIENCE:
• Software Engineer — Customized Energy Solutions (2024 – Present)
  Technologies: Spring Boot, AngularJS, AWS, TensorFlow, Python
  Focus: AI-powered energy analytics, ML systems

EDUCATION:
• Drexel University — MS Computer Science (AI/ML focus), expected 2025
• Bachelor's in Computer Engineering — Savitribai Phule Pune University

SKILLS: Spring Boot, AngularJS, Python, AWS, TensorFlow, Machine Learning, Java, JavaScript, SQL, Docker

CONTACT: mbr63@drexel.edu • linkedin.com/in/mangeshraut71298`;

function isLinkedInQuery(text = '') {
    if (!text) return false;
    const lower = text.toLowerCase();
    const keywords = ['mangesh', 'raut', 'linkedin', 'experience', 'education', 'skills', 'drexel', 'portfolio', 'contact'];
    return keywords.some(kw => lower.includes(kw));
}

async function callOpenRouter(messages) {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    const start = Date.now();
    console.log(`🤖 Calling OpenRouter with ${MODEL}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://mangeshrautarchive.vercel.app',
            'X-Title': 'AssistMe AI'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenRouter error ${response.status}:`, errorText.substring(0, 300));
        throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    
    if (!answer) {
        throw new Error('No answer received');
    }

    const elapsed = Date.now() - start;
    console.log(`✅ Success (${elapsed}ms) - ${answer.length} chars`);

    return {
        answer,
        processingTime: elapsed
    };
}

function applyCors(res, origin) {
    const allowedOrigins = [
        'https://mangeshraut712.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
        return origin === allowed || (allowed === 'https://mangeshraut712.github.io' && origin?.startsWith('https://mangeshraut712.github.io'));
    });
    
    res.setHeader('Access-Control-Allow-Origin', isAllowed && origin ? origin : 'https://mangeshraut712.github.io');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
    applyCors(res, req.headers.origin);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('📨 Chat request (v2)');

    try {
        const { message } = req.body ?? {};

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Invalid message' });
        }

        const trimmedMessage = message.trim();
        const isLinkedIn = isLinkedInQuery(trimmedMessage);

        console.log(`💬 Message: ${trimmedMessage.substring(0, 80)} | LinkedIn: ${isLinkedIn}`);

        let messages;
        
        if (isLinkedIn) {
            messages = [
                {
                    role: 'system',
                    content: 'You are a professional career assistant answering questions based on LinkedIn profile data.'
                },
                {
                    role: 'user',
                    content: `LinkedIn profile:\n${LINKEDIN_PROFILE}\n\nQuestion: ${trimmedMessage}`
                }
            ];
        } else {
            messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: trimmedMessage }
            ];
        }

        const result = await callOpenRouter(messages);

        const categoryMap = {
            portfolio: 'Portfolio',
            general: 'General',
            math: 'Mathematics',
            technical: 'Technical',
            coding: 'Coding'
        };
        
        const questionType = isLinkedIn ? 'portfolio' : 'general';

        return res.status(200).json({
            answer: result.answer,
            source: 'OpenRouter',
            model: 'Gemini 2.0 Flash',
            category: categoryMap[questionType] || 'General',
            confidence: isLinkedIn ? 0.95 : 0.90,
            runtime: result.processingTime + 'ms',
            // Legacy fields for compatibility
            type: questionType,
            processingTime: result.processingTime,
            providers: ['OpenRouter'],
            version: 'v2'
        });

    } catch (error) {
        console.error('❌ Error:', error.message);

        const isPortfolio = isLinkedInQuery(req.body?.message);
        const fallbackAnswer = isPortfolio
            ? "Mangesh Raut is a Software Engineer with an MS in Computer Science (AI/ML) from Drexel University. Contact: mbr63@drexel.edu"
            : "⚠️ AI is temporarily unavailable. Please try again.";

        return res.status(200).json({
            answer: fallbackAnswer,
            source: 'Offline',
            model: 'Static Data',
            category: isPortfolio ? 'Portfolio' : 'General',
            confidence: 0.3,
            runtime: '0ms',
            type: 'offline',
            processingTime: 0,
            error: error.message
        });
    }
}

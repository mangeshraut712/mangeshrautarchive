const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || '';
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || 'https://mangeshrautarchive.vercel.app';
const OPENROUTER_APP_TITLE = process.env.OPENROUTER_APP_TITLE || 'AssistMe Portfolio Assistant';

// WORKING MODEL - User tested and confirmed with Google AI Studio
const MODEL = 'google/gemini-2.0-flash-001';

const SYSTEM_PROMPT = `You are AssistMe, the AI assistant for Mangesh Raut's portfolio.

Goals:
- Answer questions accurately and concisely.
- If the user asks about Mangesh, use the portfolio context provided.
- Show your working for maths or reasoning problems when helpful.
- If unsure, say so and suggest how the user could clarify.

Portfolio reference:
Mangesh Raut is a Software Engineer focused on Spring Boot, AngularJS, AWS, TensorFlow, and data analytics.
He holds an MS in Computer Science (AI/ML) from Drexel University and has built solutions across energy analytics, cloud automation, and AI.
Contact: mbr63@drexel.edu • linkedin.com/in/mangeshraut71298.`;

const LINKEDIN_PROFILE = `
PROFILE: Mangesh Raut
TITLE: Software Engineer | Full-Stack Developer | AI/ML Engineer
LOCATION: Philadelphia, Pennsylvania (open to relocation)

EXPERIENCE:
• Software Engineer — Customized Energy Solutions (2024 – Present)
  • Technologies: Spring Boot, AngularJS, AWS, TensorFlow, Python
  • Focus: AI-powered energy analytics, cloud automation, ML systems

• Previous Software Engineering Roles (2019 – 2024)
  • Technologies: Java, Python, JavaScript, SQL, Docker, CI/CD
  • Focus: Full-stack development, AI/ML prototypes, production systems

EDUCATION:
• Drexel University — MS Computer Science (AI/ML focus), expected 2025
• Bachelor's in Computer Engineering — Savitribai Phule Pune University

SKILLS:
Spring Boot, AngularJS, Python, AWS, TensorFlow, Machine Learning, Java, JavaScript, SQL, Docker, PyTorch, Scikit-learn, Pandas, NumPy

PROJECT HIGHLIGHTS:
• S2R Voice Chatbot System
• AI-powered geospatial analytics
• Full-stack web applications
• Machine learning research & implementations

CONTACT:
• Email: mbr63@drexel.edu
• LinkedIn: https://www.linkedin.com/in/mangeshraut71298/
`;

function normalizeHistory(history = []) {
    return Array.isArray(history)
        ? history
            .filter((entry) => entry && typeof entry.content === 'string')
            .slice(-12)
            .map((entry) => ({
                role: entry.role === 'assistant' ? 'assistant' : 'user',
                content: entry.content.trim()
            }))
            .filter((entry) => entry.content.length > 0)
        : [];
}

function buildGeneralMessages(history = [], latest = '') {
    const finalMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
    const normalizedHistory = normalizeHistory(history);

    if (normalizedHistory.length) {
        finalMessages.push(...normalizedHistory);
    }

    if (typeof latest === 'string' && latest.trim().length) {
        finalMessages.push({ role: 'user', content: latest.trim() });
    }

    return finalMessages;
}

function isLinkedInQuery(text = '') {
    if (!text) return false;
    const lower = text.toLowerCase();
    const keywords = [
        'mangesh', 'raut', 'linkedin', 'experience', 'education',
        'qualification', 'skills', 'drexel', 'customized energy solutions',
        'portfolio', 'projects', 'technologies', 'work history', 'contact'
    ];
    return keywords.some((kw) => lower.includes(kw));
}

function buildLinkedInPrompt(question) {
    return `
You are analysing a LinkedIn profile and answering the user's question.

LinkedIn profile data:
${LINKEDIN_PROFILE}

Instructions:
- Use the profile details above verbatim when relevant.
- Do not invent facts that are not in the profile.
- If the profile does not contain the information, say so or provide cautious general insight.
- Answer concisely, professionally, and in the context of Mangesh's career.

Question: ${question}
`;
}

async function callOpenRouter(payload) {
    if (!OPENROUTER_API_KEY) {
        throw new Error('Missing OPENROUTER_API_KEY');
    }

    const start = Date.now();
    console.log(`🤖 Calling OpenRouter with model: ${payload.model}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': OPENROUTER_SITE_URL,
            'X-Title': OPENROUTER_APP_TITLE
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`❌ OpenRouter error ${response.status}:`, text);
        throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
        throw new Error('OpenRouter returned an empty response.');
    }

    const elapsed = Date.now() - start;
    console.log(`✅ OpenRouter success (${elapsed}ms) - Answer length: ${answer.length}`);

    return {
        answer,
        model: payload.model,
        usage: data?.usage || null,
        processingTime: elapsed
    };
}

function classifyType(message = '') {
    const lower = message.toLowerCase();
    if (/^what is|^who is|^where is|^when|^why|^how/.test(lower)) return 'factual';
    if (/calculate|convert|\d+\s*[+\-*/]/.test(lower)) return 'math';
    if (['mangesh', 'portfolio', 'experience', 'skills', 'project', 'contact', 'qualification'].some((kw) => lower.includes(kw))) {
        return 'portfolio';
    }
    return 'general';
}

function offlineFallback(message = '') {
    const type = classifyType(message);
    const categoryMap = {
        'math': 'Mathematics',
        'factual': 'General Knowledge',
        'general': 'General',
        'portfolio': 'Portfolio'
    };

    if (type === 'portfolio') {
        return {
            answer: "Mangesh Raut is a Software Engineer with an MS in Computer Science (AI/ML) from Drexel University. He specialises in Spring Boot, AngularJS, AWS, TensorFlow, and data analytics. Reach him at mbr63@drexel.edu or linkedin.com/in/mangeshraut71298.",
            source: 'Offline',
            model: 'Static Data',
            category: 'Portfolio',
            confidence: 0.55,
            runtime: '0ms',
            type,
            providers: [],
            processingTime: 0,
            usage: null
        };
    }

    return {
        answer: "⚠️ AI is temporarily unavailable. Please try again.",
        source: 'Offline',
        model: 'None',
        category: categoryMap[type] || 'General',
        confidence: 0.3,
        runtime: '0ms',
        type,
        providers: [],
        processingTime: 0,
        usage: null
    };
}

async function processQuery({ message = '', messages = [] } = {}) {
    const latest = typeof message === 'string' ? message.trim() : '';
    const typeHint = classifyType(latest || messages?.slice(-1)?.[0]?.content || '');
    const wantsLinkedIn = isLinkedInQuery(latest);

    if (wantsLinkedIn) {
        try {
            const linkedInResponse = await callOpenRouter({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional career assistant answering questions based on LinkedIn profile data.'
                    },
                    {
                        role: 'user',
                        content: buildLinkedInPrompt(latest)
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

        return {
            answer: linkedInResponse.answer,
            source: 'OpenRouter',
            model: 'Gemini 2.0 Flash',
            category: 'Portfolio',
            confidence: 0.95,
            runtime: linkedInResponse.processingTime + 'ms',
            type: 'portfolio',
            providers: ['OpenRouter'],
            processingTime: linkedInResponse.processingTime,
            usage: linkedInResponse.usage
        };
        } catch (error) {
            console.error('LinkedIn-enhanced OpenRouter call failed:', error.message);
            return offlineFallback(latest);
        }
    }

    try {
        const generalResponse = await callOpenRouter({
            model: MODEL,
            messages: buildGeneralMessages(messages, latest),
            temperature: 0.7,
            max_tokens: 1000
        });

        const categoryMap = {
            'math': 'Mathematics',
            'factual': 'General Knowledge',
            'general': 'General',
            'portfolio': 'Portfolio'
        };

        return {
            answer: generalResponse.answer,
            source: 'OpenRouter',
            model: 'Gemini 2.0 Flash',
            category: categoryMap[typeHint] || 'General',
            confidence: 0.90,
            runtime: generalResponse.processingTime + 'ms',
            type: typeHint,
            providers: ['OpenRouter'],
            processingTime: generalResponse.processingTime,
            usage: generalResponse.usage
        };
    } catch (error) {
        console.error('OpenRouter call failed:', error.message);
        return offlineFallback(latest);
    }
}

export default {
    processQuery
};

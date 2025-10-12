const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1:free';
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || 'http://localhost:3000';
const OPENROUTER_APP_TITLE = process.env.OPENROUTER_APP_TITLE || 'AssistMe Portfolio Assistant';

// Top 3 recommended OpenRouter models for random selection
const OPENROUTER_MODELS = [
    'deepseek/deepseek-chat-v3-0324:free',
    'google/gemma-3-3n-e2b-it',
    'tng-tech/deepseek-tng-r1t2-chimera'
];

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
• Bachelor’s in Computer Engineering — Savitribai Phule Pune University

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

const CURATED_FACTS = [
    {
        pattern: /(?:who\s+won|winner).*?(?:2024).*?(?:indian premier league|ipl)/i,
        answer: `The 2024 Indian Premier League (IPL) was won by the Kolkata Knight Riders (KKR). They defeated Sunrisers Hyderabad by 8 wickets in the final played on 26 May 2024 at the M. A. Chidambaram Stadium in Chennai.`,
        source: 'curated-fact (Google verified)',
        type: 'factual'
    },
    {
        pattern: /which.*model|what.*model|current.*model/i,
        answer: process.env.OPENROUTER_MODEL
            ? `I am currently running on OpenRouter using the model: ${process.env.OPENROUTER_MODEL} (configured via environment variable).`
            : `I am currently running on OpenRouter using random model selection from our top 3 models: DeepSeek-V3, Google's Gemma 3n E2B IT, and TNG Tech's DeepSeek-TNG-R1T2-Chimera.`,
        source: 'curated-fact (system status)',
        type: 'general'
    }
];

function checkCuratedFact(message = '') {
    if (!message) return null;
    return CURATED_FACTS.find((entry) => entry.pattern.test(message));
}

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

// Random model selection from the top 3 OpenRouter models
// Respects OPENROUTER_MODEL environment override for deterministic selection
function getRandomOpenRouterModel() {
    const envModel = process.env.OPENROUTER_MODEL;
    if (envModel && envModel.trim() !== '') {
        return envModel.trim();
    }
    return OPENROUTER_MODELS[Math.floor(Math.random() * OPENROUTER_MODELS.length)];
}

async function callOpenRouter(payload) {
    if (!OPENROUTER_API_KEY) {
        throw new Error('Missing OPENROUTER_API_KEY');
    }

    const start = Date.now();
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
        throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
        throw new Error('OpenRouter returned an empty response.');
    }

    return {
        answer,
        usage: data?.usage || null,
        processingTime: Date.now() - start
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
    if (type === 'portfolio') {
        return {
            answer: "Mangesh Raut is a Software Engineer with an MS in Computer Science (AI/ML) from Drexel University. He specialises in Spring Boot, AngularJS, AWS, TensorFlow, and data analytics. Reach him at mbr63@drexel.edu or linkedin.com/in/mangeshraut71298.",
            source: 'assistme-portfolio',
            type,
            confidence: 0.55,
            providers: [],
            processingTime: null,
            usage: null
        };
    }

    return {
        answer: "I'm AssistMe, Mangesh Raut's AI assistant. Ask about his experience, skills, projects, or fire away with a technical / general question and I'll do my best to help!",
        source: 'assistme-general',
        type,
        confidence: 0.4,
        providers: [],
        processingTime: null,
        usage: null
    };
}

async function processQuery({ message = '', messages = [] } = {}) {
    const latest = typeof message === 'string' ? message.trim() : '';
    const typeHint = classifyType(latest || messages?.slice(-1)?.[0]?.content || '');
    const wantsLinkedIn = isLinkedInQuery(latest);

    const curatedFact = checkCuratedFact(latest);
    if (curatedFact) {
        return {
            answer: curatedFact.answer,
            source: curatedFact.source,
            type: curatedFact.type,
            confidence: 0.98,
            providers: ['curated'],
            processingTime: null,
            usage: null
        };
    }

    if (wantsLinkedIn) {
        try {
            const linkedInResponse = await callOpenRouter({
                model: getRandomOpenRouterModel(),
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
                temperature: 0.25,
                max_tokens: 700
            });

            return {
                answer: linkedInResponse.answer,
                source: 'linkedin + openrouter modification',
                type: 'portfolio',
                confidence: 0.9,
                providers: ['openrouter'],
                processingTime: linkedInResponse.processingTime,
                usage: linkedInResponse.usage
            };
        } catch (error) {
            console.error('LinkedIn-enhanced OpenRouter call failed:', error.message);
        }
    }

    try {
        const generalResponse = await callOpenRouter({
            model: getRandomOpenRouterModel(),
            messages: buildGeneralMessages(messages, latest),
            temperature: 0.4,
            max_tokens: 700
        });

        return {
            answer: generalResponse.answer,
            source: 'openrouter',
            type: typeHint,
            confidence: 0.82,
            providers: ['openrouter'],
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

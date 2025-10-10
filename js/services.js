// Intelligent chatbot services using browser-native APIs
// Compatible with GitHub Pages (client-side only)
// Remove the import of config.local.js - it contains Node.js specific code
import { MathUtilities } from './math.js';
import { localConfig } from './config.js';

// Configuration for browser environment - defaults only
const config = {
    // AI Service configs (enabled by default for chat functionality)
    grokApiKey: '',
    grokEnabled: true,
    anthropicApiKey: '',
    anthropicEnabled: true,

    // External service configs
    duckduckgoEnabled: true,
    wikipediaEnabled: true,
    stackoverflowEnabled: true,
    mcpEnabled: true,
    perplexityEnabled: true,
    githubEnabled: true
};

// Simple browser-based cache using Map
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

// Rate limiting (simple implementation)
class SimpleRateLimiter {
    constructor(requestsPerMinute = 60) {
        this.requests = [];
        this.limit = requestsPerMinute;
    }

    async waitForSlot() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < 60000);

        if (this.requests.length >= this.limit) {
            const oldest = this.requests[0];
            const waitTime = 60000 - (now - oldest);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.requests.push(now);
    }
}

const apiLimiter = new SimpleRateLimiter(30); // 30 requests per minute across all APIs

// ========================
// INTELLIGENT QUERY PROCESSOR
// ========================

class QueryProcessor {
    constructor() {
        this.stopWords = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'were', 'will', 'with', 'what', 'where', 'when',
            'why', 'how', 'who', 'can', 'could', 'should', 'would', 'do',
            'does', 'did', 'have', 'had', 'get', 'got', 'tell', 'me', 'about'
        ]);
    }

    classifyQuery(query) {
        const q = query.toLowerCase().trim();
        const keywords = this.extractKeywords(q);

        return {
            type: this.determineQueryType(q, keywords),
            intent: this.determineIntent(q),
            keywords,
            confidence: this.calculateConfidence(q, keywords),
            entities: this.extractEntities(q)
        };
    }

    determineQueryType(query, keywords) {
        // Math queries
        if (this.isMathQuery(query)) return 'math';

        // Portfolio queries
        if (this.isPortfolioQuery(query)) return 'portfolio';

        // Factual questions (who, what, when, where, why, how)
        if (this.isWhQuestion(query) || this.isFactualQuery(keywords)) return 'factual';

        // Definition requests
        if (this.isDefinitionQuery(query)) return 'definition';

        // General knowledge
        if (this.isGeneralKnowledge(query)) return 'general';

        return 'unknown';
    }

    determineIntent(query) {
        const q = query.toLowerCase();

        if (q.includes('calculate') || q.includes('compute') || q.includes('solve')) return 'calculate';
        if (q.includes('define') || q.includes('meaning') || q.includes('what is')) return 'define';
        if (q.includes('how to') || q.includes('how do')) return 'tutorial';
        if (q.includes('why') || q.includes('because')) return 'explanation';
        if (q.includes('when') || q.includes('date') || q.includes('year')) return 'temporal';
        if (q.includes('where') || q.includes('location') || q.includes('place')) return 'spatial';

        return 'informational';
    }

    extractKeywords(query) {
        return query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.stopWords.has(word))
            .slice(0, 10); // Limit keywords
    }

    extractEntities(query) {
        const q = query.toLowerCase();

        // Numbers and units
        const numbers = q.match(/\d+(?:\.\d+)?/g) || [];

        // Units of measurement
        const units = [];
        if (q.includes('meter') || q.includes('meters')) units.push('meters');
        if (q.includes('feet') || q.includes('foot')) units.push('feet');
        // Add more unit patterns as needed

        return { numbers, units };
    }

    isMathQuery(query) {
        const mathPatterns = [
            /^[\d+\-*/().\s%]+$/,
            /\b\d+\s*[+\-*/]\s*\d+/,
            /\bsqrt\s*\(/,
            /\bsin\s*\(|cos\s*\(|tan\s*\(/,
            /\bconvert\s+/,
            /\bcalculate\b|\bcompute\b|\bsolve\b/
        ];

        return mathPatterns.some(pattern => pattern.test(query.toLowerCase()));
    }

    isPortfolioQuery(query) {
        const lower = query.toLowerCase();

        if (/\bwho\s+are\s+you\b/.test(lower) ||
            /\bwhat\s+is\s+your\s+name\b/.test(lower) ||
            lower.includes('your name') ||
            lower.includes('assistme')) {
            return true;
        }

        const portfolioTerms = [
            'mangesh',
            'raut',
            'portfolio',
            'education',
            'experience',
            'skills',
            'projects',
            'resume',
            'cv',
            'background'
        ];

        return portfolioTerms.some(term => lower.includes(term));
    }

    isWhQuestion(query) {
        const whWords = ['who', 'what', 'when', 'where', 'why', 'how', 'which', 'whose'];
        return whWords.some(word =>
            query.toLowerCase().startsWith(word + ' ') ||
            query.toLowerCase().includes(' ' + word + ' ')
        );
    }

    isFactualQuery(keywords) {
        const factualIndicators = ['definition', 'meaning', 'difference', 'similarity',
                                  'comparison', 'facts', 'information', 'data'];
        return keywords.some(kw => factualIndicators.includes(kw));
    }

    isDefinitionQuery(query) {
        return /\bdefinition\b|\bmean(s|ing)\b|\bwhat\s+is\b/i.test(query);
    }

    isGeneralKnowledge(query) {
        return query.length > 20 && !this.isWhQuestion(query) && !this.isMathQuery(query);
    }

    calculateConfidence(query, keywords) {
        let score = 0;

        // Length confidence
        if (query.length > 10) score += 0.2;
        if (query.length > 50) score += 0.2;

        // Keyword confidence
        if (keywords.length > 2) score += 0.3;
        if (keywords.length > 5) score += 0.2;

        // Question markers
        if (query.includes('?')) score += 0.1;

        return Math.min(score, 1.0);
    }
}

// ========================
// KNOWLEDGE BASE SERVICE
// ========================

class KnowledgeBase {
    constructor() {
        this.profile = {
            name: "Mangesh Raut",
            headline: "Software Engineer | Cloud & AI | MSCS Drexel",
            summary: "Software Engineer at Customized Energy Solutions (Philadelphia) focused on Spring Boot, AngularJS, AWS, and TensorFlow to accelerate energy analytics. MS in Computer Science (AI/ML focus) from Drexel University.",
            location: "Philadelphia, PA, USA • Pune, MH, India",
            sources: {
                linkedin: "https://www.linkedin.com/in/mangeshraut71298/",
                portfolio: "https://mangeshraut712.github.io/mangeshrautarchive/"
            },
            contact: {
                email: "mbr63@drexel.edu",
                secondaryEmail: "mbr63drexel@gmail.com",
                phoneUS: "+1 (609) 505-3500",
                phoneIN: "+91 72768 19090",
                linkedin: "https://www.linkedin.com/in/mangeshraut71298/",
                github: "https://github.com/mangeshraut712",
                portfolio: "https://mangeshraut71298.wixsite.com/mangeshrautarchive",
                leetcode: "https://leetcode.com/u/mangeshraut712/"
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
                },
                {
                    title: "Software Engineer",
                    company: "IoasiZ",
                    location: "Piscataway, NJ",
                    period: "Jul 2023 – Jul 2024",
                    highlights: [
                        "Modernized legacy Java monoliths into modular Spring services (20% less redundancy)",
                        "Resolved 50+ production issues via JUnit/Mockito automation across microservices"
                    ]
                },
                {
                    title: "Software Engineer - Cloud Infrastructure",
                    company: "Oracle",
                    location: "Redwood City, CA",
                    period: "Sep 2021 – Jul 2022",
                    highlights: [
                        "Delivered automation tooling for Oracle Cloud with Spring Boot microservices",
                        "Raised reliability with proactive monitoring and defensive testing practices"
                    ]
                },
                {
                    title: "Software Development Engineer",
                    company: "Capgemini",
                    location: "Mumbai, India",
                    period: "Jun 2020 – Sep 2021",
                    highlights: [
                        "Built enterprise Java/Spring solutions alongside cross-functional teams",
                        "Implemented CI/CD pipelines and mentored junior engineers"
                    ]
                },
                {
                    title: "Associate Software Engineer",
                    company: "IBM",
                    location: "Bangalore, India",
                    period: "Jan 2019 – Jun 2020",
                    highlights: [
                        "Developed RESTful Java/Spring applications and third-party integrations",
                        "Optimized SQL databases and maintained documentation"
                    ]
                }
            ],
            education: [
                {
                    degree: "M.S. Computer Science",
                    school: "Drexel University",
                    location: "Philadelphia, PA",
                    period: "Sep 2021 – Jun 2023",
                    focus: "Artificial Intelligence & Machine Learning"
                },
                {
                    degree: "B.E. Computer Engineering",
                    school: "JSPM's Rajarshi Shahu College of Engineering",
                    location: "Pune, India",
                    period: "Jun 2017 – Jun 2020"
                },
                {
                    degree: "Diploma in Computer Engineering",
                    school: "Dr. D. Y. Patil Pratishthan's Y. B. Patil Polytechnic",
                    location: "Akurdi, Pune",
                    period: "Jun 2014 – Jun 2017"
                }
            ],
            skills: {
                languages: ["JavaScript", "TypeScript", "Python", "Java", "C++"],
                frameworks: ["Spring Boot", "AngularJS", "React", "TensorFlow", "OpenCV"],
                cloud: ["AWS Lambda", "EC2", "Terraform", "Jenkins CI/CD"],
                data: ["PostgreSQL", "MongoDB", "MySQL", "LSTM forecasting", "Pandas"],
                tools: ["Git", "GitHub", "Docker", "Jira", "Linux"]
            },
            achievements: [
                "Cut energy analytics latency by 40% with optimized Spring Boot APIs",
                "Delivered 35% faster deployments through AWS + Terraform automation",
                "Boosted forecasting accuracy by 25% using TensorFlow LSTM models"
            ],
            projects: [
                {
                    name: "LeetCodeByMangesh",
                    summary: "Interview-ready algorithm solutions with clean patterns",
                    stack: "Python • C++ • Java"
                },
                {
                    name: "AssistMe AI Assistant",
                    summary: "Portfolio chatbot blending AI APIs with polished web UX",
                    stack: "JavaScript • AI APIs"
                },
                {
                    name: "Real-Time Face Emotion Recognition",
                    summary: "Webcam-based emotion detection with confidence scores",
                    stack: "Python • TensorFlow • OpenCV"
                }
            ]
        };

        this.defaultSummary = `${this.profile.summary} Connect on LinkedIn: ${this.profile.contact.linkedin}`;
    }

    getPortfolioInfo(query) {
        const lower = query.toLowerCase();

        if (this._matches(lower, ['linkedin', 'profile link'])) {
            return this._withSource(`${this.profile.headline}. LinkedIn: ${this.profile.contact.linkedin}`, 'linkedin');
        }

        if (this._matches(lower, ['github'])) {
            return this._withSource(`GitHub: ${this.profile.contact.github}. Recent work includes LeetCodeByMangesh and ML-driven forecasting tools.`, 'portfolio');
        }

        if (this._matches(lower, ['portfolio site', 'website'])) {
            return this._withSource(`Portfolio: ${this.profile.contact.portfolio}. It highlights projects across AI, web, and cloud engineering.`, 'portfolio');
        }

        if (this._matches(lower, ['leetcode'])) {
            return this._withSource(`LeetCode practice profile: ${this.profile.contact.leetcode}. Features curated solutions for coding interviews.`, 'portfolio');
        }

        if (this._matches(lower, ['contact', 'email', 'phone'])) {
            return this._quickContact();
        }

        if (this._matches(lower, ['location', 'where based'])) {
            return `Based in ${this.profile.location}.`;
        }

        if (this._matches(lower, ['current role', 'current job', 'work now'])) {
            return this._withSource(this._formatRole(this.profile.experience[0]), 'linkedin');
        }

        if (this._matches(lower, ['experience', 'work history', 'career'])) {
            return this._withSource(this._summarizeExperience(), 'linkedin');
        }

        if (this._matches(lower, ['education', 'degree', 'university', 'school'])) {
            return this._withSource(this._summarizeEducation(), 'linkedin');
        }

        if (this._matches(lower, ['skill', 'tech stack', 'technology'])) {
            return this._withSource(this._summarizeSkills(), 'linkedin');
        }

        if (this._matches(lower, ['project'])) {
            return this._withSource(this._summarizeProjects(), 'portfolio');
        }

        if (this._matches(lower, ['achievement', 'impact', 'accomplishment', 'results'])) {
            return this._withSource(this._summarizeAchievements(), 'linkedin');
        }

        if (this._matches(lower, ['who are you', 'introduce', 'summary', 'about'])) {
            return this._withSource(`${this.profile.summary} LinkedIn: ${this.profile.contact.linkedin}`, 'linkedin');
        }

        return this._withSource(this.defaultSummary, 'linkedin');
    }

    getGeneralInfo(query) {
        const lower = query.toLowerCase().trim();

        if (!lower) return null;

        if (['hello', 'hi', 'hey', 'hola'].includes(lower)) {
            return { answer: "Hello! I'm AssistMe, Mangesh Raut's AI assistant. How can I help?", type: 'greeting' };
        }

        if (lower.includes('who are you') || lower.includes('your name') || lower.includes('what are you')) {
            return { answer: "I'm AssistMe, the AI assistant for Mangesh Raut's portfolio. Ask me about his work, experience, or anything tech!", type: 'identity' };
        }

        if (lower.includes('help')) {
            return { answer: "Sure! You can ask about Mangesh's roles, skills, or projects—or try general knowledge, math, or time/date questions.", type: 'help' };
        }

        if (lower.includes('how are you')) {
            return { answer: "I'm doing great and ready to help! Ask me about Mangesh's work, or try a general knowledge or math question.", type: 'status' };
        }

        if (lower.includes('thank')) {
            return { answer: "Happy to help! Let me know if you need anything else.", type: 'thanks' };
        }

        if (lower.includes('goodbye') || lower === 'bye') {
            return { answer: "Goodbye! I'm here whenever you need portfolio or tech info.", type: 'farewell' };
        }

        return null;
    }

    _matches(query, keywords) {
        return keywords.some(keyword => query.includes(keyword));
    }

    _withSource(answer, sourceKey = 'linkedin') {
        const normalized = sourceKey.toLowerCase();
        const link = this.profile.sources[normalized] || this.profile.sources.linkedin;
        const label = normalized === 'portfolio' ? 'Portfolio' : 'LinkedIn';
        return `${answer} (Source: ${label} • ${link})`;
    }

    _formatRole(role) {
        if (!role) return null;
        const highlights = role.highlights.slice(0, 2).join('; ');
        return `${role.title} @ ${role.company} (${role.period}, ${role.location}). Focus: ${highlights}.`;
    }

    _summarizeExperience() {
        const roles = this.profile.experience.slice(0, 3).map(role =>
            `${role.title} @ ${role.company} (${role.period})`
        );
        return `Experience highlights: ${roles.join(' • ')}.`;
    }

    _summarizeEducation() {
        const schools = this.profile.education.slice(0, 2).map(item =>
            `${item.degree} – ${item.school} (${item.period})`
        );
        return `Education: ${schools.join(' • ')}.`;
    }

    _summarizeSkills() {
        const skills = this.profile.skills;
        return `Core stack: ${skills.languages.slice(0, 4).join(', ')}. Cloud & DevOps: ${skills.cloud.slice(0, 4).join(', ')}. AI/ML: ${skills.frameworks.slice(3, 5).join(', ')}.`;
    }

    _summarizeProjects() {
        const projects = this.profile.projects.slice(0, 3).map(project =>
            `${project.name} – ${project.summary}`
        );
        return `Recent projects: ${projects.join(' • ')}.`;
    }

    _summarizeAchievements() {
        return `Impact: ${this.profile.achievements.slice(0, 3).join(' • ')}.`;
    }

    _quickContact() {
        const contact = this.profile.contact;
        return `Reach me at ${contact.email} or ${contact.phoneUS}. LinkedIn: ${contact.linkedin}.`;
    }
}

// ========================
// AI SERVICE INTEGRATION
// ========================

class AIService {
    constructor() {
        // Use dynamically loaded API configuration
        this.updateConfigs();
    }

    updateConfigs() {
        // Primary AI: Grok (xAI) - Most up-to-date and reliable
        this.grokConfig = {
            apiKey: localConfig.grokApiKey || '',
            enabled: localConfig.grokEnabled !== false,
            baseUrl: 'https://api.x.ai/v1/chat/completions',
            model: 'grok-4-latest'
        };

        // Fallback AI: Claude (Anthropic)
        this.claudeConfig = {
            apiKey: localConfig.anthropicApiKey || '',
            enabled: localConfig.anthropicEnabled !== false
        };
    }

    async getEnhancedResponse(query, context = {}) {
        try {
            // Try Grok first - it's the most up-to-date AI model
            const grokResponse = await this._callGrokAPI(query, context);
            if (grokResponse) {
                return grokResponse;
            }

            // Fallback to Claude
            console.log('Grok unavailable, trying Claude...');
            const claudeResponse = await this._callClaudeAPI(query, context);
            if (claudeResponse) {
                return claudeResponse;
            }

            console.log('No AI services available');
            return null;

        } catch (error) {
            console.error('AI Service error:', error);
            return null;
        }
    }

    async _callGrokAPI(query, context = {}) {
        if (!this.grokConfig.enabled || !this.grokConfig.apiKey || this.grokConfig.apiKey.includes('your-grok-api-key')) {
            console.log('Grok not configured or disabled');
            return null;
        }

        try {
            await apiLimiter.waitForSlot();

            console.log('🔥 Calling Grok API (xAI) - Latest AI model...');

            const systemPrompt = `You are AssistMe, an intelligent AI assistant for Mangesh Raut's portfolio website.

Background: Mangesh is a Software Engineer at Customized Energy Solutions in Philadelphia, with expertise in Java Spring Boot, AngularJS, AWS, Docker, and machine learning. He holds a Master's in Computer Science from Drexel University with AI/ML focus.

Your expertise covers the latest technology, current events, and up-to-date information. Provide accurate, helpful, and engaging responses. Always stay professional and helpful.

For portfolio questions, focus on Mangesh's background. For general questions, use your real-time knowledge to provide the most current information available.`;

            const response = await fetch(`${this.grokConfig.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.grokConfig.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.grokConfig.model,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: query
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                console.error(`Grok API error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (data && data.choices && data.choices.length > 0) {
                const answer = data.choices[0].message?.content;
                if (answer) {
                    console.log('✅ Grok API response received');
                    return `[Latest AI Response] ${answer} (Powered by Grok xAI)`;
                }
            }

            console.log('❌ Grok API returned incomplete response');
            return null;

        } catch (error) {
            console.error('❌ Grok API error:', error);
            return null;
        }
    }

    async _callClaudeAPI(query, context = {}) {
        if (!this.claudeConfig.enabled || !this.claudeConfig.apiKey || this.claudeConfig.apiKey.includes('your-anthropic-key-here')) {
            console.log('Claude not configured or disabled');
            return null;
        }

        try {
            await apiLimiter.waitForSlot();

            console.log('🤖 Calling Claude API (fallback)...');

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.claudeConfig.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1024,
                    system: "You are AssistMe, an intelligent AI assistant for Mangesh Raut's portfolio. Provide concise, accurate answers about his background, skills, projects, and general knowledge. Keep responses professional and helpful.",
                    messages: [
                        {
                            role: "user",
                            content: query
                        }
                    ]
                })
            });

            if (!response.ok) {
                console.error(`Claude API error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (data && data.content && data.content.length > 0) {
                const textBlock = data.content.find(block => block.type === 'text');
                if (textBlock) {
                    console.log('✅ Claude API response received');
                    return `[AI Response] ${textBlock.text} (Powered by Claude)`;
                }
            }

            console.log('❌ Claude API returned incomplete response');
            return null;

        } catch (error) {
            console.error('❌ Claude API error:', error);
            return null;
        }
    }
}

// ========================
// EXTERNAL API SERVICES
// ========================

class ExternalServices {
    async searchDuckDuckGo(query) {
        if (!config.duckduckgoEnabled) return null;

        try {
            await apiLimiter.waitForSlot();
            const params = new URLSearchParams({
                q: query,
                format: 'json',
                no_html: '1',
                no_redirect: '1',
                skip_disambig: '1'
            });

            const response = await fetch(`https://api.duckduckgo.com/?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                console.error(`DuckDuckGo API error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (data.AnswerType && data.Answer && data.Answer.length) {
                return {
                    answer: data.Answer,
                    source: `duckduckgo (${data.AnswerType})`,
                    url: data.AbstractURL || data.Redirect || null
                };
            }

            if (data.AbstractText && data.AbstractText.length > 40) {
                const sourceLabel = data.AbstractSource ? `duckduckgo • ${data.AbstractSource}` : 'duckduckgo';
                return {
                    answer: data.AbstractText,
                    source: sourceLabel,
                    url: data.AbstractURL || data.Redirect || null
                };
            }

            if (data.RelatedTopics && data.RelatedTopics.length) {
                const topic = data.RelatedTopics.find(item => item.Text && item.FirstURL && !item.Text.startsWith('Category:'));
                if (topic) {
                    return {
                        answer: topic.Text,
                        source: 'duckduckgo related',
                        url: topic.FirstURL
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('DuckDuckGo API error:', error);
            return null;
        }
    }

    async searchWikipedia(query) {
        if (!config.wikipediaEnabled) return null;

        try {
            await apiLimiter.waitForSlot();

            // First, search for the article
            const params = new URLSearchParams({
                action: 'query',
                list: 'search',
                srsearch: query,
                format: 'json',
                origin: '*'
            });

            const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!searchResponse.ok) {
                console.error(`Wikipedia search API error: ${searchResponse.status}`);
                return null;
            }

            const searchData = await searchResponse.json();

            if (searchData.query?.search?.length > 0) {
                const title = searchData.query.search[0].title;
                return this.getWikipediaSummary(title);
            }

            return null;
        } catch (error) {
            console.error('Wikipedia API error:', error);
            return null;
        }
    }

    async getWikipediaSummary(title) {
        if (!config.wikipediaEnabled || !title) return null;

        try {
            await apiLimiter.waitForSlot();

            // Clean up and search for the title first
            const cleanedTitle = title.trim().toLowerCase();

            // Handle special cases for common queries
            const specialMappings = {
                'the current prime minister of india': 'Narendra Modi',
                'prime minister of india': 'Narendra Modi',
                'president of usa': 'President of the United States',
                'president of united states': 'President of the United States',
                'who won the last world cup': '2023 FIFA World Cup',
                'latest iphone': 'IPhone',
                'newest iphone': 'IPhone',
                'capital of india': 'New Delhi',
                'largest country': 'Russia',
                'smallest country': 'Vatican City',
                'most populous country': 'India'
            };

            // Check for special mappings
            let searchTitle = specialMappings[cleanedTitle] || cleanedTitle;

            // If it's still a natural language query, have the AI translate it first
            if (!specialMappings[cleanedTitle] && cleanedTitle.split(' ').length > 2) {
                // For now, just use the input as search terms but clean them
                searchTitle = cleanedTitle
                    .replace(/\b(the|a|an|of|for|in|what|who|when|where|why|how|is)\b/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            // Try to find the actual Wikipedia page by searching first
            const searchParams = new URLSearchParams({
                action: 'query',
                list: 'search',
                srsearch: searchTitle,
                format: 'json',
                srwhat: 'text',
                origin: '*',
                limit: '5'  // Increase limit to get better matches
            });

            const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${searchParams}`);

            if (!searchResponse.ok) {
                console.error(`Wikipedia search API error: ${searchResponse.status}`);
                return null;
            }

            const searchData = await searchResponse.json();

            if (searchData.query?.search?.length > 0) {
                // Find the best title match
                const foundResult = searchData.query.search.find(result => {
                    // Prefer exact matches or highly relevant results
                    const resultTitle = result.title.toLowerCase();
                    const relevanceScore = result.size > 1000 && !resultTitle.includes('disambiguation');
                    return relevanceScore || resultTitle.includes(searchTitle.split(' ')[0]);
                }) || searchData.query.search[0];

                const foundTitle = foundResult.title;

                try {
                    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(foundTitle)}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        mode: 'cors'
                    });

                    if (!response.ok) {
                        console.error(`Wikipedia summary API error: ${response.status} for title: ${foundTitle}`);
                        return null;
                    }

                    const data = await response.json();

                    if (data?.extract) {
                        return {
                            answer: data.extract,
                            source: 'wikipedia',
                            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(foundTitle)}`
                        };
                    }
                } catch (summaryError) {
                    console.error(`Error fetching Wikipedia summary for ${foundTitle}:`, summaryError);
                    // Continue to next result or return null
                }
            }

            return null;
        } catch (error) {
            console.error('Wikipedia API error:', error);
            return null;
        }
    }

    async getCountryFacts(name) {
        if (!name) return null;

        try {
            await apiLimiter.waitForSlot();
            const params = new URLSearchParams({
                fullText: 'false',
                fields: 'name,capital,region,subregion,population,area,cca2,cca3'
            });

            const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                console.error(`RestCountries API error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length) {
                const country = data[0];
                const official = country.name?.official || country.name?.common || name;
                const capital = Array.isArray(country.capital) ? country.capital[0] : country.capital;
                const population = country.population?.toLocaleString('en-US');
                const region = country.region || 'unknown region';
                const subregion = country.subregion ? `, ${country.subregion}` : '';

                return {
                    answer: `${official} is in ${region}${subregion}. Capital: ${capital || 'N/A'}. Population: ${population || 'N/A'}.`,
                    source: 'restcountries',
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(official)}`
                };
            }

            return null;
        } catch (error) {
            console.error('RestCountries error:', error);
            return null;
        }
    }

    async searchStackOverflow(query) {
        if (!config.stackoverflowEnabled) return null;

        try {
            await apiLimiter.waitForSlot();
            const params = new URLSearchParams({
                site: 'stackoverflow',
                order: 'desc',
                sort: 'relevance',
                q: query,
                filter: 'default',
                pagesize: '1'
            });

            const response = await fetch(`https://api.stackexchange.com/2.3/search?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                console.error(`Stack Overflow API error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            const items = data.items;
            if (items && items.length > 0) {
                const answer = items[0];
                return {
                    answer: answer.title + '. ' + (answer.body_markdown || '').substring(0, 200),
                    source: 'stackoverflow',
                    url: answer.link
                };
            }

            return null;
        } catch (error) {
            console.error('Stack Overflow API error:', error);
            return null;
        }
    }
}

// ========================
// MATH SERVICE
// ========================

class MathService {
    constructor() {
        this.math = new MathUtilities();
        this.unitAliases = {
            m: 'meters',
            meter: 'meters',
            meters: 'meters',
            foot: 'feet',
            feet: 'feet',
            ft: 'feet',
            inch: 'inches',
            inches: 'inches',
            in: 'inches',
            kilometer: 'kilometers',
            kilometers: 'kilometers',
            kilometre: 'kilometers',
            kilometres: 'kilometers',
            kms: 'kilometers',
            km: 'kilometers',
            mile: 'miles',
            miles: 'miles',
            mi: 'miles',
            c: 'celsius',
            celcius: 'celsius',
            celsius: 'celsius',
            degc: 'celsius',
            fahrenheit: 'fahrenheit',
            f: 'fahrenheit',
            degf: 'fahrenheit',
            kelvin: 'kelvin',
            k: 'kelvin',
            kilogram: 'kilograms',
            kilograms: 'kilograms',
            kg: 'kilograms',
            pound: 'pounds',
            pounds: 'pounds',
            lb: 'pounds',
            lbs: 'pounds',
            gram: 'grams',
            grams: 'grams',
            g: 'grams',
            ounce: 'ounces',
            ounces: 'ounces',
            oz: 'ounces',
            liter: 'liters',
            litre: 'liters',
            liters: 'liters',
            litres: 'liters',
            l: 'liters',
            gallon: 'gallons',
            gallons: 'gallons',
            gal: 'gallons',
            milliliter: 'milliliters',
            millilitre: 'milliliters',
            milliliters: 'milliliters',
            millilitres: 'milliliters',
            ml: 'milliliters',
            floz: 'fluid_ounces',
            'fluidounce': 'fluid_ounces',
            'fluidounces': 'fluid_ounces',
            'fluidounceus': 'fluid_ounces'
        };
    }

    evaluateExpression(expression) {
        if (!expression) return null;

        const trimmed = expression.trim();
        const naturalConversion = this._extractConversion(trimmed);

        if (naturalConversion) {
            const { value, fromUnit, toUnit } = naturalConversion;
            const normalizedFrom = this._normalizeUnit(fromUnit);
            const normalizedTo = this._normalizeUnit(toUnit);

            if (normalizedFrom && normalizedTo) {
                const converted = this.math.convertUnits(value, normalizedFrom, normalizedTo);
                if (converted !== null && converted !== undefined) {
                    const formatted = this.math.formatNumber(converted, 6);
                    return {
                        answer: `${formatted} ${this._formatUnit(normalizedTo)}`,
                        kind: 'conversion'
                    };
                }
            }
        }

        const explicitConvert = trimmed.toLowerCase().match(/convert\s+(-?\d+(?:\.\d+)?)\s*([\w\s°]+?)\s+to\s+([\w\s°]+)/);
        if (explicitConvert) {
            const [, value, fromRaw, toRaw] = explicitConvert;
            const fromUnit = this._normalizeUnit(fromRaw);
            const toUnit = this._normalizeUnit(toRaw);

            if (fromUnit && toUnit) {
                const converted = this.math.convertUnits(value, fromUnit, toUnit);
                if (converted !== null && converted !== undefined) {
                    const formatted = this.math.formatNumber(converted, 6);
                    return {
                        answer: `${formatted} ${this._formatUnit(toUnit)}`,
                        kind: 'conversion'
                    };
                }
            }
        }

        const sanitized = trimmed
            .replace(/^(what(\s+is|'s)|calculate|compute|solve)\s+/i, '')
            .trim();

        if (!sanitized) return null;

        const result = this.math.evaluate(sanitized);
        if (result === null || result === undefined) return null;

        if (this.math.isValidNumber(result)) {
            const formatted = this.math.formatNumber(result, 6);
            return {
                answer: formatted.toString(),
                kind: 'calculation'
            };
        }

        if (typeof result === 'number' && isFinite(result)) {
            return {
                answer: result.toString(),
                kind: 'calculation'
            };
        }

        return {
            answer: String(result),
            kind: 'calculation'
        };
    }

    _normalizeUnit(unit) {
        if (!unit) return null;
        const cleaned = unit
            .toLowerCase()
            .replace(/degrees?/g, '')
            .replace(/[\s_-]+/g, '');
        return this.unitAliases[cleaned] || null;
    }

    _formatUnit(normalizedUnit) {
        const friendly = {
            meters: 'meters',
            feet: 'feet',
            inches: 'inches',
            kilometers: 'kilometers',
            miles: 'miles',
            celsius: '°C',
            fahrenheit: '°F',
            kelvin: 'K',
            kilograms: 'kilograms',
            pounds: 'pounds',
            grams: 'grams',
            ounces: 'ounces',
            liters: 'liters',
            gallons: 'gallons',
            milliliters: 'milliliters',
            fluid_ounces: 'fluid ounces'
        };

        return friendly[normalizedUnit] || normalizedUnit;
    }

    _extractConversion(expression) {
        const normalized = expression
            .toLowerCase()
            .replace(/\?/g, '')
            .replace(/\b(the|a|an|please|kindly|would you|could you|do you|for)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const patterns = [
            /(?:convert|how much is|how many|what is)\s+(-?\d+(?:\.\d+)?)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:to|in|into)\s+(?:the\s+)?([a-z]+(?:\s+[a-z]+)?)/,
            /(-?\d+(?:\.\d+)?)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:to|in|into)\s+(?:the\s+)?([a-z]+(?:\s+[a-z]+)?)/,
            /(-?\d+(?:\.\d+)?)\s+([a-z]+)\s+(?:equals|=)\s+([a-z]+)/,
        ];

        for (const pattern of patterns) {
            const match = normalized.match(pattern);
            if (match) {
                return {
                    value: parseFloat(match[1]),
                    fromUnit: match[2].trim(),
                    toUnit: match[3].trim()
                };
            }
        }

        return null;
    }
}

// ========================
// MAIN CHAT SERVICE
// ========================

class ChatService {
    constructor() {
        this.queryProcessor = new QueryProcessor();
        this.knowledgeBase = new KnowledgeBase();
        this.aiService = new AIService();
        this.externalServices = new ExternalServices();
        this.mathService = new MathService();
        this.history = [];
    }

    async processQuery(query) {
        const startTime = Date.now();
        const normalizedQuery = query.trim();

        if (!normalizedQuery) {
            const fallback = this.makeConcise(this.generateSmartFallback('', { type: 'general', confidence: 0 }));
            const processingTime = Date.now() - startTime;
            return {
                answer: fallback,
                type: 'general',
                confidence: 0,
                processingTime
            };
        }

        const cacheKey = `answer:${normalizedQuery.toLowerCase()}`;

        const utilityHit = this.handleUtilityQuery(normalizedQuery);
        if (utilityHit) {
            const processingTime = Date.now() - startTime;
            const payload = {
                answer: utilityHit.answer,
                type: utilityHit.type,
                confidence: 1
            };

            this.history.push({
                query: normalizedQuery,
                timestamp: startTime,
                response: payload.answer,
                processingTime
            });

            responseCache.set(cacheKey, payload);
            return { ...payload, processingTime };
        }

        const cached = responseCache.get(cacheKey);
        if (cached) {
            const processingTime = Date.now() - startTime;
            this.history.push({
                query: normalizedQuery,
                timestamp: startTime,
                response: cached.answer,
                processingTime
            });
            return { ...cached, processingTime };
        }

        this.history.push({ query: normalizedQuery, timestamp: startTime });

        const analysis = this.queryProcessor.classifyQuery(normalizedQuery);
        let response = null;

        try {
            switch (analysis.type) {
                case 'portfolio':
                    response = await this.handlePortfolioQuery(normalizedQuery, analysis);
                    break;
                case 'math':
                    response = await this.handleMathQuery(normalizedQuery, analysis);
                    break;
                case 'factual':
                case 'definition':
                    response = await this.handleKnowledgeQuery(normalizedQuery, analysis);
                    break;
                default:
                    response = await this.handleGeneralQuery(normalizedQuery, analysis);
            }

            if (!response && this.aiService.enabled) {
                const aiAnswer = await this.aiService.getEnhancedResponse(normalizedQuery, analysis);
                if (aiAnswer) {
                    response = { answer: aiAnswer, type: 'ai' };
                }
            }

            if (!response) {
                response = this.generateSmartFallback(normalizedQuery, analysis);
            }
        } catch (error) {
            console.error('Query processing error:', error);
            response = { answer: "I hit a snag processing that question. Try rephrasing it.", type: 'error' };
        }

        // If the response is already a structured object with an answer, use it directly.
        // Otherwise, format it.
        const finalAnswer = (response && typeof response.answer === 'string')
            ? response.answer
            : this.makeConcise(response);

        const sourceMessage = this._generateSourceMessage(finalAnswer, analysis.type);

        const payload = {
            answer: finalAnswer,
            sourceMessage: sourceMessage,
            type: (response && response.type) || analysis.type,
            confidence: analysis.confidence
        };

        const processingTime = Date.now() - startTime;
        Object.assign(this.history[this.history.length - 1], {
            response: finalAnswer,
            processingTime
        });

        responseCache.set(cacheKey, payload);

        return { ...payload, processingTime };
    }

    handleUtilityQuery(query) {
        const lower = query.toLowerCase().trim();
        const now = new Date();

        if (/\b(time|current time|what time is it)\b/.test(lower)) {
            const time = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short'
            }).format(now);
            return { answer: `It's ${time}.`, type: 'utility' };
        }

        if (/\b(date|today['’]?s date|what day is it)\b/.test(lower) ||
            lower.includes('today') && lower.includes('day')) {
            const date = new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }).format(now);
            return { answer: `Today is ${date}.`, type: 'utility' };
        }

        if (/\bday of week\b/.test(lower)) {
            const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
            return { answer: `It's ${weekday}.`, type: 'utility' };
        }

        if (/\b(version|build)\b/.test(lower)) {
            return { answer: "I am AssistMe version 1.0.", type: 'utility' };
        }

        return null;
    }

    async handlePortfolioQuery(query, analysis) {
        const answer = this.knowledgeBase.getPortfolioInfo(query);
        return {
            answer,
            type: 'portfolio'
        };
    }

    async handleMathQuery(query, analysis) {
        const result = this.mathService.evaluateExpression(query);
        if (!result) return null;
        const prefix = result.kind === 'conversion' ? 'Converted: ' : 'Result: ';
        return {
            answer: `${prefix}${result.answer}`,
            type: 'math'
        };
    }

    async handleKnowledgeQuery(query, analysis) {
        const lower = query.toLowerCase();

        // Direct query handling for specific patterns (no verification needed)
        const whoMatch = lower.match(/who\s+(?:is|was)\s+([\w\s.'-]+)/);
        if (whoMatch) {
            const subject = whoMatch[1].trim();
            const responses = await this._collectMultipleResponses(query, 'factual', { subject, type: 'person' });
            const bestResponse = this._compareAndSelectBestResponse(query, responses);
            if (bestResponse) return {
                answer: bestResponse.formatted,
                type: 'factual',
                source: bestResponse.source
            };
        }

        const whatMatch = lower.match(/what\s+is\s+([\w\s.'-]+)/);
        if (whatMatch) {
            const topic = whatMatch[1].trim();
            const responses = await this._collectMultipleResponses(query, 'definition', { topic, type: 'definition' });
            const bestResponse = this._compareAndSelectBestResponse(query, responses);
            if (bestResponse) return {
                answer: bestResponse.formatted,
                type: 'definition',
                source: bestResponse.source
            };
        }

        const whereMatch = lower.match(/where\s+is\s+([\w\s.'-]+)/);
        if (whereMatch) {
            const place = whereMatch[1].trim();
            const responses = await this._collectMultipleResponses(query, 'factual', { type: 'location' });
            const bestResponse = this._compareAndSelectBestResponse(query, responses);
            if (bestResponse) return {
                answer: bestResponse.formatted,
                type: 'factual',
                source: bestResponse.source
            };
        }

        if (/which\s+country.*most\s+population/.test(lower)) {
            const responses = await this._collectMultipleResponses(query, 'factual', { subject: 'population statistics', type: 'statistics' });
            const bestResponse = this._compareAndSelectBestResponse(query, responses);
            if (bestResponse) return {
                answer: bestResponse.formatted,
                type: 'factual',
                source: bestResponse.source
            };
            // Fallback
            const concise = this.makeConcise('According to the United Nations World Population Prospects 2023 revision, India has the largest national population (~1.43 billion) followed by China (~1.41 billion).', 2, 360);
            return {
                answer: `${concise} (Source: Wikipedia • https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations))`,
                type: 'factual'
            };
        }

        // Collect responses from multiple sources for verification
        const responses = await this._collectMultipleResponses(query, 'factual', analysis);
        const bestResponse = this._compareAndSelectBestResponse(query, responses);

        if (bestResponse) {
            return {
                answer: bestResponse.formatted,
                type: 'factual',
                source: bestResponse.source
            };
        }

        return null;
    }

    // Collect responses from multiple sources for verification
    async _collectMultipleResponses(query, queryType, context = {}) {
        const responses = [];

        // Try AI services first (up to 2)
        if (this.aiService && config.grokEnabled) {
            try {
                const grokResponse = await this.aiService.getEnhancedResponse(query, { context: 'verification', limit: 100 });
                if (grokResponse) {
                    responses.push({
                        source: 'grok',
                        content: grokResponse,
                        type: 'ai',
                        priority: 1
                    });
                }
            } catch (error) {
                console.log('Grok verification failed:', error.message);
            }
        }

        // Try external APIs
        const promises = [
            this.externalServices.searchDuckDuckGo(query),
            this.externalServices.searchWikipedia(query),
        ];

        // Only call country facts API if query appears to be about countries/locations
        if (this._isLikelyCountryQuery(query, context)) {
            const countryName = this._extractCountryFromQuery(query);
            if (countryName) {
                promises.push(this.externalServices.getCountryFacts(countryName));
            }
        }

        // Add Stack Overflow for technical queries
        if (context.keywords && context.keywords.some(k => ['code', 'programming', 'bug', 'error'].includes(k))) {
            promises.push(this.externalServices.searchStackOverflow(query));
        }

        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                let source = 'unknown';
                switch(index) {
                    case 0: source = 'duckduckgo'; break;
                    case 1: source = 'wikipedia'; break;
                    case 2: source = 'country_facts'; break;
                    case 3: source = 'stackoverflow'; break;
                }
                responses.push({
                    source,
                    content: result.value,
                    type: 'external',
                    priority: 2
                });
            }
        });

        return responses;
    }

    // Compare responses and select the most accurate one
    _compareAndSelectBestResponse(query, responses) {
        if (!responses || responses.length === 0) return null;

        if (responses.length === 1) {
            // Only one response, format and return it
            const response = responses[0];
            return {
                formatted: this._formatKnowledgeResult(response.content, response.source),
                source: response.source,
                confidence: 0.5
            };
        }

        // Multiple responses - compare and select best
        const scored = responses.map(response => ({
            ...response,
            score: this._scoreResponse(query, response),
            formatted: this._formatKnowledgeResult(response.content, response.source)
        }));

        // Sort by score (higher is better)
        scored.sort((a, b) => b.score - a.score);

        // Log comparison for debugging
        console.log(`Response comparison for "${query}":`);
        scored.forEach((r, i) => console.log(`${i+1}. ${r.source}: ${r.score} points`));

        // Return the highest scoring response
        const best = scored[0];
        return {
            formatted: best.formatted,
            source: best.source,
            confidence: Math.min(best.score / 100, 1.0) // Normalize to 0-1
        };
    }

    // Score response accuracy based on multiple factors
    _scoreResponse(query, response) {
        let score = 0;
        const content = response.content?.answer || '';
        const source = response.source;

        // Source reliability scoring
        const sourceScores = {
            'grok': 90,
            'wikipedia': 85,
            'duckduckgo': 70,
            'stackoverflow': 80,
            'country_facts': 75
        };
        score += sourceScores[source] || 50;

        // Content quality scoring
        if (content.length > 50) score += 15; // Adequate length
        if (content.length > 200) score += 10; // Detailed but not too long

        // Query specificity match
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const contentWords = content.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const wordOverlap = queryWords.filter(word =>
            contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))
        ).length;
        score += Math.min(wordOverlap * 5, 25); // Up to 25 points for relevance

        // Factuality indicators
        if (content.includes('according to') || content.includes('source') || content.includes('data') || content.includes('statistics')) {
            score += 10; // Likely factual
        }

        // Technical accuracy for programming queries
        if (query.toLowerCase().includes('code') || query.toLowerCase().includes('programming')) {
            if (source === 'stackoverflow' || source === 'grok') {
                score += 15; // Preferred sources for technical questions
            }
        }

        // Location accuracy
        if (query.toLowerCase().includes('where') || query.toLowerCase().includes('location')) {
            if (source === 'wikipedia' || source === 'country_facts') {
                score += 10; // Preferred for location queries
            }
        }

        return Math.min(score, 100); // Cap at 100
    }

    _formatKnowledgeResult(result, source) {
        if (!result) return null;

        if (typeof result === 'object' && result.answer) {
            // Already formatted response object
            return this._formatKnowledgeResult(result.answer, result.source || source);
        }

        if (typeof result === 'string') {
            const concise = this.makeConcise(result, 3, 400);
            const sourceLabel = this._capitalizeSource(source);

            // Add source attribution if not already present
            if (!concise.includes(`Source:`)) {
                return `${concise} (Source: ${sourceLabel})`;
            }
            return concise;
        }

        return null;
    }

    async handleGeneralQuery(query, analysis) {
        const greeting = this.knowledgeBase.getGeneralInfo(query);
        if (greeting) return greeting;

        const ddgResult = await this.externalServices.searchDuckDuckGo(query);
        if (ddgResult) return {
            answer: this._formatKnowledgeResult(ddgResult),
            type: 'general'
        };

        const wikiResult = await this.externalServices.searchWikipedia(query);
        if (wikiResult) return {
            answer: this._formatKnowledgeResult(wikiResult),
            type: 'general'
        };

        return null;
    }

    generateSmartFallback(query, analysis) {
        const fallbacks = {
            portfolio: "Ask about Mangesh's roles, skills, projects, or education for a quick summary.",
            math: "I can handle calculations and unit conversions—try something like \"convert 10 km to miles\".",
            factual: "Try a specific factual or \"what/when\" question and I'll fetch a concise answer.",
            definition: "Ask me to define a term or concept and I'll keep it brief.",
            general: "I can share portfolio facts, solve math, or tap free knowledge sources. What do you need?"
        };

        return fallbacks[analysis.type] ||
            "I can help with portfolio details, math problems, or quick facts from trusted sources.";
    }

    makeConcise(text, maxSentences = 2, maxLength = 320) {
        if (!text) return text;
        const normalized = text.replace(/\s+/g, ' ').trim();
        if (!normalized) return normalized;

        const sentences = normalized.split(/(?<=[.?!])\s+/);
        const selected = sentences.slice(0, maxSentences).join(' ');

        if (selected.length <= maxLength) {
            return selected;
        }

        const truncated = selected.substring(0, maxLength).replace(/[,:;\-]?\s*$/, '');
        return `${truncated}...`;
    }

    _formatKnowledgeResult(result) {
        if (!result || !result.answer) return null;
        const concise = this.makeConcise(result.answer, 3, 360);
        const sourceLabel = result.source ? this._capitalizeSource(String(result.source)) : 'Source';
        if (result.url) {
            return `${concise} (Source: ${sourceLabel} • ${result.url})`;
        }
        return `${concise} (Source: ${sourceLabel})`;
    }

    _capitalizeSource(value) {
        return value
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    // Extract country name from natural language queries
    _extractCountryFromQuery(query) {
        if (!query) return null;

        const lower = query.toLowerCase().trim();

        // Common country name variations
        const countryMappings = {
            'india': 'India',
            'china': 'China',
            'usa': 'United States',
            'america': 'United States',
            'united states': 'United States',
            'uk': 'United Kingdom',
            'england': 'United Kingdom',
            'france': 'France',
            'germany': 'Germany',
            'japan': 'Japan',
            'canada': 'Canada',
            'australia': 'Australia',
            'brazil': 'Brazil',
            'russia': 'Russia',
            'mexico': 'Mexico',
            'italy': 'Italy',
            'spain': 'Spain',
            'south korea': 'South Korea',
            'netherlands': 'Netherlands',
            'sweden': 'Sweden',
            'norway': 'Norway',
            'denmark': 'Denmark',
            'finland': 'Finland'
        };

        // Check for countries in the query directly
        for (const [key, value] of Object.entries(countryMappings)) {
            if (lower.includes(key)) {
                return value;
            }
        }

        // Extract from patterns like "capital of France", "population of India"
        const patterns = [
            /(?:capital|population|area|gdp|size|location)\s+of\s+([\w\s '-]+)/i,
            /where\s+is\s+([\w\s '-]+)\s+located/i,
            /[\w\s '-]+(?:capital|population|area)\s+of\s+([\w\s '-]+)/i
        ];

        for (const pattern of patterns) {
            const match = lower.match(pattern);
            if (match) {
                const extracted = match[match.length - 1].trim();
                return countryMappings[extracted.toLowerCase()] || extracted;
            }
        }

        // Try basic country detection as fallback
        const commonCountries = Object.values(countryMappings);
        for (const country of commonCountries) {
            if (query.toLowerCase().includes(country.toLowerCase())) {
                return country;
            }
        }

        return null;
    }

    // Check if a query is likely about countries
    _isLikelyCountryQuery(query, context = {}) {
        if (!query) return false;

        const lower = query.toLowerCase().trim();

        // Always exclude person-related query patterns first
        const personIndicators = ['who is', 'who was', 'biography of', 'born', 'died', 'age of', 'height of', 'weight of'];
        if (personIndicators.some(indicator => lower.includes(indicator))) {
            return false;
        }

        // Check for actual country names or location queries
        const countryNames = [
            'india', 'china', 'usa', 'america', 'united states', 'uk', 'england', 'france', 'germany',
            'japan', 'canada', 'australia', 'brazil', 'russia', 'mexico', 'italy', 'spain',
            'south korea', 'netherlands', 'sweden', 'norway', 'denmark', 'finland'
        ];

        // Direct country queries
        if (lower.includes('what country') || lower.includes('which country')) return false;

        // Location queries about countries
        if ((lower.includes('where is') || lower.includes('location of') || lower.includes('capital of')) &&
            countryNames.some(country => lower.includes(country))) {
            return true;
        }

        // Statistics about countries
        if ((lower.includes('population of') || lower.includes('area of') || lower.includes('gdp of') ||
             lower.includes('largest country') || lower.includes('smallest country')) &&
            countryNames.some(country => lower.includes(country))) {
            return true;
        }

        // Region/continent queries
        const regionKeywords = ['continent', 'region', 'europe', 'asia', 'africa', 'north america', 'south america'];
        if (regionKeywords.some(kw => lower.includes(kw))) {
            return true;
        }

        // Context-based detection for specific cases
        if (context.type === 'location' || context.type === 'statistics') {
            return true;
        }

        // Default to false for unclear cases
        return false;
    }

    // Generate a simple source message separate from the answer
    _generateSourceMessage(answer, queryType) {
        if (!answer) return '';

        const lowerAnswer = answer.toLowerCase();

        // Detect Grok AI responses
        if (lowerAnswer.includes('[latest ai response]') || lowerAnswer.includes('powered by grok xai')) {
            return '📪 Answer provided by Grok AI';
        }

        // Detect Claude responses
        if (lowerAnswer.includes('[ai response]') || lowerAnswer.includes('powered by claude')) {
            return '🤖 Answer provided by Claude AI';
        }

        // Detect Wikipedia responses
        if (lowerAnswer.includes('(source: wikipedia') || lowerAnswer.includes('wikipedia.org')) {
            return '📚 Information from Wikipedia';
        }

        // Detect DuckDuckGo responses
        if (lowerAnswer.includes('duckduckgo') || lowerAnswer.includes('(source: duckduckgo')) {
            return '🔍 Results from DuckDuckGo search';
        }

        // Detect Stack Overflow responses
        if (lowerAnswer.includes('stackoverflow') || lowerAnswer.includes('(source: stackoverflow')) {
            return '💻 Coding answer from Stack Overflow';
        }

        // Detect country facts
        if (lowerAnswer.includes('restcountries') || lowerAnswer.includes('population') || lowerAnswer.includes('capital')) {
            return '🌍 Country information';
        }

        // Detect portfolio responses
        if (queryType === 'portfolio' || lowerAnswer.includes('linkedin') || lowerAnswer.includes('github.com/mangeshraut')) {
            return '👨‍💼 Portfolio information about Mangesh Raut';
        }

        // Detect math responses
        if (queryType === 'math' || lowerAnswer.includes('result:') || lowerAnswer.includes('converted:')) {
            return '🧮 Mathematical calculation';
        }

        // Detect utility/time responses
        if (queryType === 'utility' || lowerAnswer.includes('time') || lowerAnswer.includes('today')) {
            return '🕐 Current date/time information';
        }

        // Default fallback
        return '💬 Chatbot response';
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        this.history = [];
    }
}

// ========================
// EXPORTS
// ========================

const chatService = new ChatService();

export { ChatService, chatService };
export default chatService;

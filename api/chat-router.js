import express from 'express';
import axios from 'axios';
import chatService from './chat-service.js';

// MCP Server configurations
const MCP_SERVERS = {
    perplexity: {
        baseUrl: 'http://localhost:3001',
        enabled: process.env.PLEXITY_MCP_ENABLED === 'true'
    },
    github: {
        baseUrl: 'http://localhost:3002',
        enabled: process.env.GITHUB_MCP_ENABLED === 'true'
    }
};

class QueryAnalyzer {
    analyzeQueryType(query) {
        const lower = query.toLowerCase().trim();

        if (this._matchesKeywords(lower, ['code', 'programming', 'script', 'function', 'debug', 'error', 'git', 'github', 'repository', 'commit', 'pull request', 'issue'])) {
            return 'technical';
        }

        if (this._matchesKeywords(lower, ['what', 'how', 'why', 'when', 'where', 'definition', 'explain', 'fact', 'history', 'science', 'technology']) || /\?$/.test(lower)) {
            return 'knowledge';
        }

        if (this._containsMath(lower) || this._matchesKeywords(lower, ['calculate', 'compute', 'solve', 'convert'])) {
            return 'math';
        }

        if (this._matchesKeywords(lower, ['mangesh', 'raut', 'portfolio', 'experience', 'skill', 'project', 'education', 'contact'])) {
            return 'portfolio';
        }

        return 'general';
    }

    _matchesKeywords(query, keywords) {
        return keywords.some(keyword => query.includes(keyword));
    }

    _containsMath(query) {
        return /\d+\s*[+\-*/=]\s*\d+/.test(query) ||
               /\bsqrt\(|\bcos\(|\bsin\(|\btan\(/.test(query) ||
               /\bconvert\b|\bcalculate\b/.test(query);
    }
}

const queryAnalyzer = new QueryAnalyzer();
const router = express.Router();

const mcpHelpers = {
    async callPerplexityMCP(query) {
        if (!MCP_SERVERS.perplexity.enabled) return null;

        try {
            const response = await axios.post(`${MCP_SERVERS.perplexity.baseUrl}/tools/ask_perplexity`, {
                question: `Analyze and provide detailed information about: ${query}. Focus on technical accuracy and comprehensive coverage.`
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            if (response.data && response.data.answer) {
                return {
                    answer: response.data.answer,
                    source: 'Perplexity AI (MCP)',
                    type: 'enhanced_knowledge'
                };
            }

            return null;

        } catch (error) {
            console.error('Perplexity MCP error:', error.message);
            return null;
        }
    },

    async callGitHubMCP(query) {
        if (!MCP_SERVERS.github.enabled) return null;

        try {
            const lowerQuery = query.toLowerCase();
            const githubKeywords = ['github', 'repository', 'repo', 'git', 'code', 'programming', 'project', 'commit', 'branch'];

            if (!githubKeywords.some(keyword => lowerQuery.includes(keyword))) return null;

            const response = await axios.post(`${MCP_SERVERS.github.baseUrl}/tools/search_code`, {
                query,
                per_page: 5
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            if (response.data) {
                return {
                    answer: `Code search results: ${JSON.stringify(response.data)}`,
                    source: 'GitHub API (MCP)',
                    type: 'code_search'
                };
            }

            return null;

        } catch (error) {
            console.error('GitHub MCP error:', error.message);
            return null;
        }
    }
};

async function processWithMCPEnhancement(message) {
    const queryType = queryAnalyzer.analyzeQueryType(message);
    let mcpResult = null;

    switch (queryType) {
        case 'knowledge':
        case 'technical':
            mcpResult = await mcpHelpers.callPerplexityMCP(message);
            if (!mcpResult) {
                mcpResult = await mcpHelpers.callGitHubMCP(message);
            }
            break;
        case 'technical':
            mcpResult = await mcpHelpers.callGitHubMCP(message);
            if (!mcpResult) {
                mcpResult = await mcpHelpers.callPerplexityMCP(message);
            }
            break;
        default:
            if (MCP_SERVERS.perplexity.enabled && message.length > 20) {
                mcpResult = await mcpHelpers.callPerplexityMCP(message);
            }
            break;
    }

    return mcpResult;
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
}

// Handle CORS preflight request
router.options('/', (req, res) => {
    applyCors(res, req.headers.origin);
    res.sendStatus(200);
});

router.post('/', async (req, res) => {
    // Apply CORS headers to ALL responses
    applyCors(res, req.headers.origin);

    try {
        const { message } = req.body;
        const startTime = Date.now();

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const trimmedMessage = message.trim();
        const queryType = queryAnalyzer.analyzeQueryType(trimmedMessage);

        if (queryType === 'portfolio') {
            const result = await chatService.processQuery(trimmedMessage);
            return res.json({
                answer: result.answer,
                type: 'portfolio',
                confidence: result.confidence,
                processingTime: Date.now() - startTime,
                mcpEnhanced: false
            });
        }

        const primaryResult = await chatService.processQuery(trimmedMessage);

        if (primaryResult && ['ai', 'math', 'factual', 'general'].includes(primaryResult.type)) {
            return res.json({
                answer: primaryResult.answer,
                type: primaryResult.type,
                confidence: primaryResult.confidence,
                source: 'Grok AI',
                processingTime: Date.now() - startTime,
                mcpEnhanced: false
            });
        }

        const mcpEnhancement = await processWithMCPEnhancement(trimmedMessage);

        if (mcpEnhancement) {
            let finalAnswer = mcpEnhancement.answer;
            if (mcpEnhancement.type && trimmedMessage.toLowerCase().includes('mangesh')) {
                finalAnswer = `${mcpEnhancement.answer}\n\n💼 Portfolio Context: ${primaryResult ? primaryResult.answer : 'Mangesh is a Software Engineer specializing in Java Spring, AngularJS, AWS, and machine learning.'}`;
            }

            return res.json({
                answer: finalAnswer,
                type: 'enhanced_ai',
                confidence: 0.85,
                source: mcpEnhancement.source,
                processingTime: Date.now() - startTime,
                mcpEnhanced: true
            });
        }

        const result = primaryResult || await chatService.processQuery(trimmedMessage);

        res.json({
            answer: result.answer,
            type: result.type,
            confidence: result.confidence,
            processingTime: result.processingTime,
            mcpEnhanced: false
        });

    } catch (error) {
        console.error('Chat API error:', error);

        try {
            const fallbackResult = await chatService.processQuery(
                `${req.body?.message || ''} (error occurred, please provide a simplified response)`
            );

            if (fallbackResult) {
                return res.json({
                    answer: `🤖 ${fallbackResult.answer} (Note: There was an issue with advanced processing, so you received a basic response)`,
                    type: 'fallback',
                    confidence: 0.5,
                    processingTime: fallbackResult.processingTime,
                    error: true
                });
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'I\'m experiencing technical difficulties. Please try again in a moment.'
        });
    }
});

router.get('/history', (req, res) => {
    applyCors(res, req.headers.origin);

    try {
        const history = chatService.getHistory();
        res.json({ history });
    } catch (error) {
        console.error('History API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

router.post('/clear', (req, res) => {
    applyCors(res, req.headers.origin);

    try {
        chatService.clearHistory();
        res.json({
            success: true,
            message: 'Chat history cleared'
        });
    } catch (error) {
        console.error('Clear history API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

export default router;

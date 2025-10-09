import express from 'express';
import { chatService } from '../js/services.js'; // Import the chat service
import axios from 'axios';

// MCP Server configurations
const MCP_SERVERS = {
    perplexity: {
        baseUrl: 'http://localhost:3001', // Assumes Perplexity MCP server running locally
        enabled: process.env.PLEXITY_MCP_ENABLED === 'true'
    },
    github: {
        baseUrl: 'http://localhost:3002', // Assumes GitHub MCP server running locally
        enabled: process.env.GITHUB_MCP_ENABLED === 'true'
    }
};

// Enhanced query analyzer for MCP routing
class QueryAnalyzer {
    analyzeQueryType(query) {
        const lower = query.toLowerCase().trim();

        // Technical/code-related queries
        if (this._matchesKeywords(lower, ['code', 'programming', 'script', 'function', 'debug', 'error', 'git', 'github', 'repository', 'commit', 'pull request', 'issue'])) {
            return 'technical';
        }

        // General knowledge queries
        if (this._matchesKeywords(lower, ['what', 'how', 'why', 'when', 'where', 'definition', 'explain', 'fact', 'history', 'science', 'technology']) ||
            /\?$/.test(lower)) { // Questions end with ?
            return 'knowledge';
        }

        // Math queries
        if (this._containsMath(lower) || this._matchesKeywords(lower, ['calculate', 'compute', 'solve', 'convert'])) {
            return 'math';
        }

        // Portfolio/personal queries
        if (this._matchesKeywords(lower, ['mangesh', 'raut', 'portfolio', 'experience', 'skill', 'project', 'education', 'contact'])) {
            return 'portfolio';
        }

        return 'general';
    }

    _matchesKeywords(query, keywords) {
        return keywords.some(keyword => query.includes(keyword));
    }

    _containsMath(query) {
        // Basic math patterns
        return /\d+\s*[+\-*/=]\s*\d+/.test(query) ||
               /\bsqrt\(|\bcos\(|\bsin\(|\btan\(/.test(query) ||
               /\bconvert\b|\bcalculate\b/.test(query);
    }
}

const queryAnalyzer = new QueryAnalyzer();

const router = express.Router();

// MCP Server helpers
const mcpHelpers = {
    async callPerplexityMCP(query, context = {}) {
        if (!MCP_SERVERS.perplexity.enabled) return null;

        try {
            console.log('🔍 Calling Perplexity MCP for query analysis...');

            const response = await axios.post(`${MCP_SERVERS.perplexity.baseUrl}/tools/ask_perplexity`, {
                question: `Analyze and provide detailed information about: ${query}. Focus on technical accuracy and comprehensive coverage.`
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 second timeout for enhanced responses
            });

            if (response.data && response.data.answer) {
                console.log('✅ Perplexity MCP response received');
                return {
                    answer: response.data.answer,
                    source: 'Perplexity AI (MCP)',
                    type: 'enhanced_knowledge'
                };
            }

            return null;

        } catch (error) {
            console.error('❌ Perplexity MCP error:', error.message);
            return null;
        }
    },

    async callGitHubMCP(query, context = {}) {
        if (!MCP_SERVERS.github.enabled) return null;

        try {
            // Check if query is related to GitHub/code repositories
            const lowerQuery = query.toLowerCase();
            const githubKeywords = ['github', 'repository', 'repo', 'git', 'code', 'programming', 'project', 'commit', 'branch'];

            const isGitHubRelated = githubKeywords.some(keyword => lowerQuery.includes(keyword));

            if (!isGitHubRelated) return null;

            console.log('🐙 Calling GitHub MCP for repository/code queries...');

            // Try to extract repo information
            let owner = 'mangeshraut712'; // Default to user's GitHub
            let repo = '';

            const repoMatch = lowerQuery.match(/(?:github\.com\/|repository\s+)([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/);
            if (repoMatch) {
                owner = repoMatch[1];
                repo = repoMatch[2];
            }

            // Call appropriate GitHub endpoint based on query type
            if (lowerQuery.includes('repository') || lowerQuery.includes('repo')) {
                const response = await axios.post(`${MCP_SERVERS.github.baseUrl}/tools/search_repositories`, {
                    query: query.replace(/github|repository|repo/gi, '').trim(),
                    minimal_output: true,
                    per_page: 5
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });

                if (response.data) {
                    console.log('✅ GitHub MCP repository search completed');
                    return {
                        answer: `Found repository information: ${JSON.stringify(response.data)}`,
                        source: 'GitHub API (MCP)',
                        type: 'repository_info'
                    };
                }
            }

            // For general GitHub queries, try search_code
            const response = await axios.post(`${MCP_SERVERS.github.baseUrl}/tools/search_code`, {
                query: query,
                per_page: 5
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            if (response.data) {
                console.log('✅ GitHub MCP code search completed');
                return {
                    answer: `Code search results: ${JSON.stringify(response.data)}`,
                    source: 'GitHub API (MCP)',
                    type: 'code_search'
                };
            }

            return null;

        } catch (error) {
            console.error('❌ GitHub MCP error:', error.message);
            return null;
        }
    }
};

// Enhanced chat processing with MCP integration
async function processWithMCPEnhancement(message) {
    const queryType = queryAnalyzer.analyzeQueryType(message);
    console.log(`📋 Query classified as: ${queryType}`);

    let mcpResult = null;

    // Try MCP services based on query type
    switch (queryType) {
        case 'knowledge':
        case 'technical':
            // Try Perplexity first for comprehensive knowledge
            mcpResult = await mcpHelpers.callPerplexityMCP(message);
            if (!mcpResult) {
                // Fallback to GitHub if technical
                mcpResult = await mcpHelpers.callGitHubMCP(message);
            }
            break;

        case 'technical':
            // Prefer GitHub for technical queries
            mcpResult = await mcpHelpers.callGitHubMCP(message);
            if (!mcpResult) {
                // Fallback to Perplexity for general technical knowledge
                mcpResult = await mcpHelpers.callPerplexityMCP(message);
            }
            break;

        default:
            // For other queries, try Perplexity for general knowledge enhancement
            if (MCP_SERVERS.perplexity.enabled && message.length > 20) {
                mcpResult = await mcpHelpers.callPerplexityMCP(message);
            }
            break;
    }

    return mcpResult;
}

// Chat endpoint for processing queries
router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        const startTime = Date.now();

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const trimmedMessage = message.trim();
        console.log(`🎯 Processing query: "${trimmedMessage}"`);

        // First try MCP enhancement
        const mcpEnhancement = await processWithMCPEnhancement(trimmedMessage);

        if (mcpEnhancement) {
            console.log('🚀 Using MCP-enhanced response');
            const processingTime = Date.now() - startTime;

            // If we have an MCP response, use it enhanced with the regular chat service if needed
            let finalAnswer = mcpEnhancement.answer;

            // For some queries, combine MCP with portfolio knowledge
            if (mcpEnhancement.type && trimmedMessage.toLowerCase().includes('mangesh')) {
                const baseResult = await chatService.processQuery(trimmedMessage);
                if (baseResult && baseResult.answer) {
                    finalAnswer = `${mcpEnhancement.answer}\n\n💼 Portfolio Context: ${baseResult.answer}`;
                }
            }

            return res.json({
                answer: finalAnswer,
                type: 'enhanced_ai',
                confidence: 0.95,
                source: mcpEnhancement.source,
                processingTime,
                mcpEnhanced: true
            });
        }

        // Fallback to regular chat service
        console.log('🔄 Using standard chat service');
        const result = await chatService.processQuery(trimmedMessage);

        res.json({
            answer: result.answer,
            type: result.type,
            confidence: result.confidence,
            processingTime: result.processingTime,
            mcpEnhanced: false
        });

    } catch (error) {
        console.error('❌ Chat API error:', error);

        // Even on error, try to provide a helpful fallback response
        try {
            const fallbackResult = await chatService.processQuery(message + ' (error occurred, please provide a simplified response)');

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
            console.error('❌ Fallback also failed:', fallbackError);
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'I\'m experiencing technical difficulties. Please try again in a moment.'
        });
    }
});

// Get chat history endpoint
router.get('/history', (req, res) => {
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

// Clear chat history endpoint
router.post('/clear', (req, res) => {
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

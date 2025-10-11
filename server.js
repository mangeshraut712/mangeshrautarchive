import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { RateLimiter } from 'limiter';
import chatRouter from './api/chat-router.js';

function resolveBoolean(value, fallback = true) {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === null) return fallback;
    const normalized = String(value).toLowerCase();
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    return fallback;
}

let serverLocalConfig = {};
try {
    const configModule = await import('./src/js/config.local.js');
    if (configModule?.localConfig) {
        serverLocalConfig = configModule.localConfig;
    }
} catch (error) {
    console.info('config.local.js not found for server. Falling back to environment variables.');
}

const aiConfig = {
    grok: {
        apiKey: process.env.GROK_API_KEY || serverLocalConfig.grokApiKey || '',
        model: process.env.GROK_MODEL || serverLocalConfig.grokModel || 'grok-4-latest',
        enabled: resolveBoolean(process.env.GROK_ENABLED, serverLocalConfig.grokEnabled !== false)
    },
    claude: {
        apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || serverLocalConfig.anthropicApiKey || '',
        model: process.env.CLAUDE_MODEL || serverLocalConfig.anthropicModel || 'claude-3-sonnet-20240229',
        enabled: resolveBoolean(process.env.ANTHROPIC_ENABLED ?? process.env.CLAUDE_ENABLED, serverLocalConfig.anthropicEnabled !== false)
    },
    duckduckgo: {
        enabled: resolveBoolean(process.env.DUCKDUCKGO_ENABLED, serverLocalConfig.duckduckgoEnabled !== false)
    }
};

aiConfig.grok.enabled = aiConfig.grok.enabled && !!aiConfig.grok.apiKey;
aiConfig.claude.enabled = aiConfig.claude.enabled && !!aiConfig.claude.apiKey;

const limiter = new RateLimiter({
    tokensPerInterval: 100,
    interval: "minute"
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = join(__dirname, 'data');
const CONTACT_MESSAGES_FILE = join(DATA_DIR, 'contact-messages.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Rate limiting middleware
app.use(async (req, res, next) => {
    try {
        await limiter.removeTokens(1);
        next();
    } catch {
        res.status(429).json({ error: 'Too many requests' });
    }
});

// Serve static files from the built directory
const staticDir = join(__dirname, 'dist');
app.use(express.static(staticDir));

// API Routes
app.use('/api/chat', chatRouter);

// SPA fallback to index.html
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(join(staticDir, 'index.html'));
});

async function appendContactMessage(entry) {
    await fs.mkdir(DATA_DIR, { recursive: true });

    let existingMessages = [];
    try {
        const raw = await fs.readFile(CONTACT_MESSAGES_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            existingMessages = parsed;
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    existingMessages.push(entry);
    await fs.writeFile(CONTACT_MESSAGES_FILE, JSON.stringify(existingMessages, null, 2));
}

async function proxyJsonResponse(upstreamResponse, res) {
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';
    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status).type(contentType).send(text);
}

app.post('/api/ai/grok', async (req, res) => {
    if (!aiConfig.grok.enabled) {
        return res.status(503).json({ error: 'Grok AI service not configured' });
    }

    const payload = { ...req.body };
    if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
        payload.messages = [
            {
                role: 'system',
                content: 'You are AssistMe, an intelligent assistant for Mangesh Raut\'s portfolio website.'
            },
            {
                role: 'user',
                content: typeof payload.query === 'string' ? payload.query : ''
            }
        ].filter(message => message.content);
    }
    payload.model = payload.model || aiConfig.grok.model;
    payload.max_tokens = payload.max_tokens || 1000;
    payload.temperature = payload.temperature ?? 0.7;
    payload.stream = false;

    try {
        const upstreamResponse = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${aiConfig.grok.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        await proxyJsonResponse(upstreamResponse, res);
    } catch (error) {
        console.error('Failed to proxy Grok API request:', error);
        res.status(502).json({ error: 'Failed to reach Grok AI service.' });
    }
});

app.post('/api/ai/claude', async (req, res) => {
    if (!aiConfig.claude.enabled) {
        return res.status(503).json({ error: 'Claude AI service not configured' });
    }

    const payload = { ...req.body };
    payload.model = payload.model || aiConfig.claude.model;
    payload.max_tokens = payload.max_tokens || 1024;

    if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
        payload.messages = [
            {
                role: 'user',
                content: typeof payload.query === 'string' ? payload.query : ''
            }
        ].filter(message => message.content);
    }

    try {
        const upstreamResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': aiConfig.claude.apiKey,
                'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        await proxyJsonResponse(upstreamResponse, res);
    } catch (error) {
        console.error('Failed to proxy Claude API request:', error);
        res.status(502).json({ error: 'Failed to reach Claude AI service.' });
    }
});

app.get('/api/search/duckduckgo', async (req, res) => {
    if (!aiConfig.duckduckgo.enabled) {
        return res.status(503).json({ error: 'DuckDuckGo service not configured' });
    }

    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const params = new URLSearchParams({
        q: query,
        format: 'json',
        no_html: '1',
        no_redirect: '1',
        skip_disambig: '1'
    });

    try {
        const upstreamResponse = await fetch(`https://api.duckduckgo.com/?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!upstreamResponse.ok) {
            console.error('DuckDuckGo API responded with status:', upstreamResponse.status);
        }

        await proxyJsonResponse(upstreamResponse, res);
    } catch (error) {
        console.error('Failed to proxy DuckDuckGo request:', error);
        res.status(502).json({ error: 'Failed to reach DuckDuckGo service.' });
    }
});

app.get('/api/ai/status', (req, res) => {
    res.json({
        grok: {
            available: aiConfig.grok.enabled,
            model: aiConfig.grok.model || null
        },
        claude: {
            available: aiConfig.claude.enabled,
            model: aiConfig.claude.model || null
        },
        duckduckgo: {
            available: aiConfig.duckduckgo.enabled
        }
    });
});

app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body ?? {};

    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            error: 'All fields are required.',
        });
    }

    const trimmed = {
        name: String(name).trim(),
        email: String(email).trim(),
        subject: String(subject).trim(),
        message: String(message).trim()
    };

    if (!trimmed.name || !trimmed.email || !trimmed.subject || !trimmed.message) {
        return res.status(400).json({
            error: 'All fields are required.',
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed.email)) {
        return res.status(400).json({
            error: 'Please provide a valid email address.',
        });
    }

    const contactEntry = {
        ...trimmed,
        submittedAt: new Date().toISOString(),
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        userAgent: req.get('user-agent') || null
    };

    try {
        await appendContactMessage(contactEntry);
        res.status(201).json({
            success: true,
            message: 'Message received. Thank you for reaching out!'
        });
    } catch (error) {
        console.error('Failed to save contact message:', error);
        res.status(500).json({
            error: 'Something went wrong while saving your message. Please try again later.'
        });
    }
});

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Handle 404s by serving index.html (for SPA)
app.use((req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown for nodemon
process.once('SIGUSR2', () => {
    console.log('Received SIGUSR2, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        // This signals nodemon that the process is ready to be killed and restarted
        process.kill(process.pid, 'SIGUSR2'); 
    });
});

// Graceful shutdown for other signals like SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server closed due to app termination.');
        process.exit(0);
    });
});

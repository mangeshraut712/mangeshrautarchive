import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { RateLimiter } from 'limiter';
import chatRouter from './api/chat.js';

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

// Serve static files from root directory
app.use(express.static(__dirname));

// API Routes
app.use('/api/chat', chatRouter);

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

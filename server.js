import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
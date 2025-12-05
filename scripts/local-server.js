import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Get the project root directory
const projectRoot = resolve(__dirname, '..');

// Middleware to parse JSON bodies, which is needed for our API
app.use(express.json());

import { createProxyMiddleware } from 'http-proxy-middleware';

// Proxy API requests to Python backend
app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
}));

// Cache-busting middleware for development
app.use((req, res, next) => {
    // Disable caching for all requests in development
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// Serve static files from the 'src' directory
const staticPath = join(projectRoot, 'src');
app.use(express.static(staticPath));

// Serve chatbot assets so linked styles/scripts resolve correctly
const chatbotPath = join(projectRoot, 'chatbot');
app.use('/chatbot', express.static(chatbotPath));

app.listen(port, () => {
    console.log(`\n🚀 Local development server running!`);
    console.log(`   - Frontend: http://localhost:${port}`);
    console.log(`   - API requests to /api/* will be handled by the /api directory.`);
});

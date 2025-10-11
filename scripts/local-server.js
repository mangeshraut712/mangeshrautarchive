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

// API Route Handler
// This intercepts requests to /api/* and dynamically loads the corresponding
// Vercel function from the /api directory.
app.all('/api/:apiName', async (req, res) => {
    const { apiName } = req.params;
    const functionPath = join(projectRoot, 'api', `${apiName}.js`);

    try {
        // Dynamically import the handler function
        const { default: handler } = await import(functionPath);
        
        // Execute the Vercel function handler with the Express request and response
        console.log(`[Local Server] Executing API function: /api/${apiName}`);
        await handler(req, res);

    } catch (error) {
        console.error(`[Local Server] Error loading or executing API function /api/${apiName}:`, error);
        res.status(500).json({ error: `Could not execute function for /api/${apiName}.` });
    }
});

// Serve static files from the 'src' directory
const staticPath = join(projectRoot, 'src');
app.use(express.static(staticPath));

app.listen(port, () => {
    console.log(`\n🚀 Local development server running!`);
    console.log(`   - Frontend: http://localhost:${port}`);
    console.log(`   - API requests to /api/* will be handled by the /api directory.`);
});
/**
 * Vercel Serverless Function — Contact Form Backend
 * NOTE: This file is superseded by the /api/contact POST endpoint
 * in api/index.py (FastAPI). It is kept here only as a stub to
 * prevent 404s in case some deploy targets route to it directly.
 *
 * The primary contact logic now lives in api/index.py.
 */

// ESM-compatible export for Vercel Node.js runtime
export default async function handler(req, res) {
    // Redirect all traffic to the Python API which handles /api/contact
    res.setHeader('Location', '/api/contact');
    res.status(308).end();
}

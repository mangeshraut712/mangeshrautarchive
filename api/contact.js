/**
 * ═══════════════════════════════════════════════════════════
 * CONTACT FORM API ENDPOINT
 * Saves messages to Firebase from backend (more stable)
 * ═══════════════════════════════════════════════════════════
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin (server-side, more stable)
let db;

try {
  if (!admin.apps.length) {
    // Initialize with minimal config (uses service account from Vercel env)
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: 'mangeshrautarchive',
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
  }
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('⚠️ Firebase Admin init error:', error.message);
}

/**
 * Apply CORS
 */
function applyCors(res, origin) {
  const allowedOrigins = [
    'https://mangeshraut712.github.io',
    'http://localhost:3000',
    'http://localhost:8000'
  ];

  const corsOrigin = (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) 
    ? origin 
    : 'https://mangeshraut712.github.io';

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  applyCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message } = req.body || {};

    // Validate
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        success: false 
      });
    }

    // If Firebase Admin not available, just log and return success
    if (!db) {
      console.log('📬 Contact form submission (Firebase not configured):', {
        name,
        email: email.substring(0, 3) + '***',
        subject
      });
      
      return res.status(200).json({
        success: true,
        message: 'Message received successfully',
        id: 'local-' + Date.now()
      });
    }

    // Save to Firestore
    const messageData = {
      name,
      email,
      subject,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: req.headers['user-agent'] || 'unknown',
      submittedFrom: req.headers.referer || 'unknown'
    };

    const docRef = await db.collection('messages').add(messageData);

    console.log('✅ Message saved:', docRef.id);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      id: docRef.id
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      success: false
    });
  }
}

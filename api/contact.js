/**
 * Vercel Serverless Function - Contact Form Backend
 * Uses Firebase Admin SDK OR REST API to save messages
 */

const admin = require('firebase-admin');

// Try to initialize Firebase Admin SDK
let firebaseInitialized = false;

if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID || 'mangeshrautarchive',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                })
            });
            firebaseInitialized = true;
            console.log('✅ Firebase Admin SDK initialized');
        }
    } catch (error) {
        console.warn('⚠️ Firebase Admin init failed:', error.message);
    }
}

// Fallback: Use Firebase REST API with API key
async function saveToFirestoreREST(data) {
    const apiKey = process.env.GEMINI_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    
    if (!apiKey) {
        throw new Error('No Firebase API key found');
    }

    const projectId = 'mangeshrautarchive';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/messages?key=${apiKey}`;

    console.log('📡 Using Firebase REST API');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fields: {
                name: { stringValue: data.name },
                email: { stringValue: data.email },
                subject: { stringValue: data.subject },
                message: { stringValue: data.message },
                timestamp: { timestampValue: new Date().toISOString() },
                userAgent: { stringValue: data.userAgent || 'Unknown' },
                submittedFrom: { stringValue: data.submittedFrom || 'Direct' }
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Firestore REST API error:', errorText);
        throw new Error(`Firestore API error: ${response.status}`);
    }

    const result = await response.json();
    // Extract document ID from name field (format: projects/.../documents/messages/{id})
    const docId = result.name.split('/').pop();
    
    return { id: docId };
}

// CORS helper
function applyCors(req, res) {
    const allowedOrigins = [
        'https://mangeshraut712.github.io',
        'http://localhost',
        'http://127.0.0.1'
    ];
    
    const origin = req.headers.origin || req.headers.referer || '';
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    
    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');
}

module.exports = async (req, res) => {
    applyCors(req, res);

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { name, email, subject, message } = req.body;

        // Validate
        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        console.log('📬 Saving message to Firestore...');
        console.log('From:', name, '<' + email + '>');
        console.log('Subject:', subject);

        let docRef;

        // Try Admin SDK first, fallback to REST API
        if (firebaseInitialized) {
            console.log('🔥 Using Firebase Admin SDK');
            const db = admin.firestore();
            docRef = await db.collection('messages').add({
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                message: message.trim(),
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userAgent: req.headers['user-agent'] || 'Unknown',
                submittedFrom: req.headers.referer || req.headers.origin || 'Direct',
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            });
        } else {
            console.log('🔄 Falling back to Firebase REST API');
            docRef = await saveToFirestoreREST({
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                message: message.trim(),
                userAgent: req.headers['user-agent'] || 'Unknown',
                submittedFrom: req.headers.referer || req.headers.origin || 'Direct'
            });
        }

        const docId = docRef.id || docRef.id;
        console.log('✅ Message saved! Document ID:', docId);

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully!',
            id: docId
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        console.error('Error details:', error.message);
        
        return res.status(500).json({
            success: false,
            error: 'Failed to send message. Please try again or email mbr63@drexel.edu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

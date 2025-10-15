/**
 * Vercel Serverless Function - Contact Form Backend
 * Saves messages to Firebase Firestore from server-side
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (once)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || 'mangeshrautarchive',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            })
        });
        console.log('✅ Firebase Admin initialized');
    } catch (error) {
        console.error('❌ Firebase Admin init error:', error.message);
    }
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

        // Save to Firestore
        const db = admin.firestore();
        const docRef = await db.collection('messages').add({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            submittedFrom: req.headers.referer || req.headers.origin || 'Direct',
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });

        console.log('✅ Message saved! Document ID:', docRef.id);

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully!',
            id: docRef.id
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Failed to send message. Please try again or email mbr63@drexel.edu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Vercel Serverless Function - Contact Form Backend
 * Uses Firebase REST API to save messages
 */

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

// Save to Firestore using REST API
async function saveToFirestoreREST(data) {
    const apiKey = process.env.GEMINI_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

    if (!apiKey) {
        throw new Error('No Firebase API key found in environment variables');
    }

    const projectId = 'mangeshrautarchive';
    const databaseId = '(default)'; // Using default database
    const collectionId = 'messages';

    // Firebase REST API endpoint
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionId}?key=${apiKey}`;

    console.log('📡 Using Firebase REST API');
    console.log('Project:', projectId);
    console.log('Database:', databaseId);
    console.log('Collection:', collectionId);
    console.log('API Key length:', apiKey.length);

    try {
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
            console.error('❌ Firestore REST API error:');
            console.error('Status:', response.status);
            console.error('Response:', errorText);

            let errorMessage = 'Firestore API error';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorText;
            } catch {
                errorMessage = errorText;
            }

            throw new Error(`Firestore API error (${response.status}): ${errorMessage}`);
        }

        const result = await response.json();
        console.log('✅ Firestore response:', JSON.stringify(result, null, 2));

        // Extract document ID from name field (format: projects/.../documents/messages/{id})
        const docId = result.name.split('/').pop();
        console.log('📝 Document ID:', docId);

        return { id: docId };

    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        throw error;
    }
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
            error: 'Method not allowed. Use POST.'
        });
    }

    try {
        const { name, email, subject, message } = req.body;

        console.log('📬 Received contact form submission');
        console.log('From:', name, '<' + email + '>');
        console.log('Subject:', subject);

        // Validate
        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            console.log('❌ Validation failed - missing fields');
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Validation failed - invalid email');
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        console.log('✅ Validation passed, saving to Firestore...');

        // Save to Firestore via REST API
        const docRef = await saveToFirestoreREST({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            submittedFrom: req.headers.referer || req.headers.origin || 'Direct'
        });

        console.log('✅ Message saved successfully! ID:', docRef.id);

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully!',
            id: docRef.id
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Check for specific Firebase errors
        let errorMessage = 'Failed to send message. Please try again or email mbr63@drexel.edu';

        if (error.message.includes('PERMISSION_DENIED')) {
            errorMessage = 'Database permission denied. Please check Firestore rules.';
        } else if (error.message.includes('NOT_FOUND')) {
            errorMessage = 'Database or collection not found. Please check Firebase configuration.';
        } else if (error.message.includes('API key')) {
            errorMessage = 'Firebase API key issue. Please check environment variables.';
        }

        return res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

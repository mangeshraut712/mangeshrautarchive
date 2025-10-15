#!/usr/bin/env node

/**
 * Test Contact Form Backend
 * Tests both Firebase direct and Vercel backend
 */

const API_URL = process.env.API_URL || 'https://mangeshrautarchive.vercel.app/api/contact';

async function testContactAPI() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║       🧪 CONTACT FORM BACKEND TEST               ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const testPayload = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Message from Script',
        message: 'This is a test message to verify the contact form backend is working correctly.'
    };

    console.log('📤 Sending test message...');
    console.log('API URL:', API_URL);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://mangeshraut712.github.io'
            },
            body: JSON.stringify(testPayload)
        });

        console.log('\n📥 Response Status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (response.ok && data.success) {
            console.log('\n✅ TEST PASSED!');
            console.log('Message ID:', data.id);
            console.log('\n🔍 Check Firebase Console:');
            console.log('https://console.firebase.google.com/project/mangeshrautarchive/firestore/data/~2Fmessages~2F' + data.id);
        } else {
            console.log('\n❌ TEST FAILED!');
            console.log('Error:', data.error);
        }

    } catch (error) {
        console.error('\n❌ REQUEST FAILED!');
        console.error('Error:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n💡 Possible issues:');
            console.log('1. Vercel deployment not complete');
            console.log('2. API endpoint not accessible');
            console.log('3. Network/CORS issue');
        }
    }

    console.log('\n' + '─'.repeat(55) + '\n');
}

// Run test
testContactAPI();

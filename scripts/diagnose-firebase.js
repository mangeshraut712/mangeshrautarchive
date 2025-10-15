#!/usr/bin/env node

/**
 * Firebase Contact Form Diagnostic Tool
 * Run this to check what's preventing the form from working
 */

const apiKey = "AIzaSyDJS4ncepUtvNqtpa5mN3L1RTuURuYWTOo";
const projectId = "mangeshrautarchive";

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║     🔍 FIREBASE CONTACT FORM DIAGNOSTIC 🔍                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

async function runDiagnostics() {
    console.log('🧪 Running diagnostics...\n');

    // Test 1: Check if Firestore API is accessible
    console.log('TEST 1: Firestore API Accessibility');
    console.log('────────────────────────────────────');
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/messages?key=${apiKey}`;
        console.log('URL:', url);
        
        const response = await fetch(url, { method: 'GET' });
        console.log('Status:', response.status, response.statusText);
        
        if (response.status === 403) {
            const text = await response.text();
            console.log('❌ FAIL: Firestore API not enabled or API key restricted');
            console.log('Error:', text);
            console.log('\n💡 FIX:');
            console.log('   1. Enable Firestore API: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=' + projectId);
            console.log('   2. Or check API key restrictions: https://console.cloud.google.com/apis/credentials?project=' + projectId);
            return false;
        } else if (response.status === 200) {
            console.log('✅ PASS: Firestore API is accessible');
        } else if (response.status === 404) {
            console.log('⚠️ WARNING: Database or collection not found (might be OK if collection is empty)');
        } else {
            const text = await response.text();
            console.log('Response:', text);
        }
    } catch (error) {
        console.log('❌ FAIL: Network error -', error.message);
        return false;
    }

    console.log('\n');

    // Test 2: Try to write a test document
    console.log('TEST 2: Firestore Write Permission');
    console.log('────────────────────────────────────');
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/messages?key=${apiKey}`;
        
        const testData = {
            fields: {
                name: { stringValue: 'Diagnostic Test' },
                email: { stringValue: 'test@diagnostic.com' },
                subject: { stringValue: 'Automated Test' },
                message: { stringValue: 'This is an automated diagnostic test. You can delete this.' },
                timestamp: { timestampValue: new Date().toISOString() }
            }
        };

        console.log('Attempting to write test document...');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        console.log('Status:', response.status, response.statusText);

        if (response.status === 200) {
            const result = await response.json();
            const docId = result.name.split('/').pop();
            console.log('✅ PASS: Successfully wrote to Firestore!');
            console.log('Document ID:', docId);
            console.log('View at: https://console.firebase.google.com/project/' + projectId + '/firestore/data/~2Fmessages~2F' + docId);
            console.log('\n🎉 CONTACT FORM SHOULD WORK!');
            return true;
        } else if (response.status === 403) {
            const text = await response.text();
            console.log('❌ FAIL: Permission denied');
            console.log('Error:', text);
            console.log('\n💡 FIX:');
            console.log('   1. Check security rules are published:');
            console.log('      https://console.firebase.google.com/project/' + projectId + '/firestore/rules');
            console.log('   2. Rules should allow: create: if true');
            return false;
        } else {
            const text = await response.text();
            console.log('❌ FAIL:', text);
            return false;
        }
    } catch (error) {
        console.log('❌ FAIL: Network error -', error.message);
        return false;
    }
}

console.log('Project ID:', projectId);
console.log('API Key:', apiKey.substring(0, 20) + '...');
console.log('Database: (default)');
console.log('Collection: messages\n');

runDiagnostics().then(success => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    if (success) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('The contact form should work on your website.');
        console.log('\nIf it still fails, share the browser console error!');
    } else {
        console.log('❌ TESTS FAILED!');
        console.log('Follow the fixes above, then run this test again.');
    }
    console.log('\n');
});

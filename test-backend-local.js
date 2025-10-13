// Local backend test - simulates Vercel environment
// Tests AI chatbot without deploying

// Simulate environment variables
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'test-key-will-use-real';

// Import the chat service
import chatService from './api/chat-service.js';

console.log('\n🧪 LOCAL BACKEND TEST\n');
console.log('Testing AI Chatbot Logic...\n');

// Test cases
const testCases = [
    { message: 'What is 5+5?', category: 'Math' },
    { message: 'What is artificial intelligence?', category: 'General Knowledge' },
    { message: 'Tell me about Mangesh Raut', category: 'Portfolio' },
    { message: 'How do I reverse a string in Python?', category: 'Coding' }
];

async function runTests() {
    console.log('📊 Test Configuration:');
    console.log(`   • OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'Found ✓' : 'Missing ✗'}`);
    console.log(`   • Model: google/gemini-2.0-flash-001`);
    console.log(`   • Test Cases: ${testCases.length}\n`);
    
    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Test ${i + 1}/${testCases.length}: ${test.category}`);
        console.log(`Question: "${test.message}"`);
        console.log(`${'='.repeat(60)}\n`);
        
        try {
            const startTime = Date.now();
            const result = await chatService.processQuery({ message: test.message });
            const elapsed = Date.now() - startTime;
            
            console.log(`✅ Response received (${elapsed}ms):\n`);
            console.log(`📝 Answer: ${result.answer.substring(0, 150)}${result.answer.length > 150 ? '...' : ''}`);
            console.log(`\n📊 Metadata:`);
            console.log(`   • Source: ${result.source || 'N/A'}`);
            console.log(`   • Model: ${result.model || 'N/A'}`);
            console.log(`   • Category: ${result.category || result.type || 'N/A'}`);
            console.log(`   • Confidence: ${result.confidence || 'N/A'}`);
            console.log(`   • Runtime: ${result.runtime || elapsed + 'ms'}`);
            console.log(`   • Providers: ${result.providers?.join(', ') || 'N/A'}`);
            
            // Verify response format
            const hasNewFormat = result.source && result.model && result.category;
            console.log(`\n🔍 Format Check: ${hasNewFormat ? '✅ NEW format' : '⚠️ OLD format'}`);
            
        } catch (error) {
            console.error(`❌ Test failed: ${error.message}`);
            console.error(`   Stack: ${error.stack}`);
        }
        
        // Wait between tests
        if (i < testCases.length - 1) {
            console.log('\n⏳ Waiting 2 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed!');
    console.log('='.repeat(60) + '\n');
}

runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

// Test script for Vercel functions
import { chatService } from './vercel/api/chat-service.js';

// Test the status function
async function testStatus() {
  console.log('🧪 Testing status function...');
  const status = { ok: true, timestamp: Date.now() };
  console.log('✅ Status:', JSON.stringify(status));
}

// Test the chat service
async function testChatService() {
  console.log('\n🧪 Testing chat service...');

  const testQueries = [
    'hello',
    'who are you',
    'what is your experience',
    'convert 10 km to miles',
    'calculate 15 + 27'
  ];

  for (const query of testQueries) {
    console.log(`\n❓ Query: "${query}"`);
    try {
      const result = await chatService.processQuery(query);
      console.log(`✅ Response: "${result.answer}"`);
      console.log(`   Type: ${result.type}, Confidence: ${result.confidence}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Vercel Functions Tests...\n');

  await testStatus();
  await testChatService();

  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);

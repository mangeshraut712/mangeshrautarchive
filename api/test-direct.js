// Direct test of chat-service
import chatService from './chat-service.js';

async function test() {
  try {
    console.log('Testing chat-service directly...');
    const result = await chatService.processQuery({ message: 'hello' });
    console.log('✅ Result:', result);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();

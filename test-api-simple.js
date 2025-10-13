#!/usr/bin/env node
/**
 * Simple API test - OpenRouter + Gemini
 */

const API_URL = 'https://mangeshrautarchive.vercel.app/api/chat';

const tests = [
  "What is 10 + 5?",
  "Who is Mangesh Raut?",
  "Tell me about your skills",
  "Hello, how are you?"
];

async function testAPI(message) {
  console.log(`\n📤 Testing: "${message}"`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    
    console.log('✅ Response:');
    console.log(`   Answer: ${data.answer.substring(0, 80)}...`);
    console.log(`   Source: ${data.source}`);
    console.log(`   Model: ${data.model}`);
    console.log(`   Category: ${data.category}`);
    console.log(`   Confidence: ${data.confidence}`);
    console.log(`   Runtime: ${data.runtime}`);
    
    // Check format
    const hasAllFields = data.source && data.model && data.category && 
                         data.confidence !== undefined && data.runtime;
    console.log(`   Format: ${hasAllFields ? '✅ Complete' : '❌ Missing fields'}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function run() {
  console.log('🧪 Testing OpenRouter + Gemini API\n');
  console.log('═'.repeat(60));
  
  for (const test of tests) {
    await testAPI(test);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Test complete!');
}

run();

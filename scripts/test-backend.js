#!/usr/bin/env node
/**
 * Test chatbot backend API
 */

const API_URL = 'https://mangeshrautarchive.vercel.app/api/chat';

const testCases = [
  { message: "What is 5+5?", expected: "math" },
  { message: "Who is Mangesh Raut?", expected: "portfolio" },
  { message: "Hello", expected: "general" },
  { message: "Tell me about skills", expected: "portfolio" }
];

async function testAPI(message) {
  console.log(`\n📤 Testing: "${message}"`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ Response:`);
    console.log(`   Answer: ${data.answer.substring(0, 100)}${data.answer.length > 100 ? '...' : ''}`);
    console.log(`   Source: ${data.source}`);
    console.log(`   Model: ${data.model}`);
    console.log(`   Category: ${data.category}`);
    console.log(`   Runtime: ${data.runtime}`);
    
    return data;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Backend API Tests...\n');
  console.log(`API URL: ${API_URL}\n`);
  console.log('═'.repeat(60));
  
  for (const test of testCases) {
    await testAPI(test.message);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Tests complete!');
}

runTests();

#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 * COMPREHENSIVE CHATBOT FEATURE TEST
 * Tests all 11 categories with detailed reporting
 * ═══════════════════════════════════════════════════════════
 */

const API_URL = 'https://mangeshrautarchive.vercel.app/api/chat';

// Test cases covering all 11 categories
const testCases = [
  // Category 1: Time & Date (Direct Command)
  {
    category: 'Time & Date',
    question: 'What time is it?',
    expectedSource: 'Direct Command',
    expectedModel: 'Built-in',
    expectedResponseTime: '0ms'
  },
  {
    category: 'Time & Date',
    question: 'What date is today?',
    expectedSource: 'Direct Command',
    expectedModel: 'Built-in'
  },
  {
    category: 'Time & Date',
    question: 'Which day is today?',
    expectedSource: 'Direct Command',
    expectedModel: 'Built-in'
  },
  
  // Category 2: Mathematics (Direct Command)
  {
    category: 'Mathematics',
    question: '5 + 5',
    expectedSource: 'Direct Command',
    expectedModel: 'Built-in',
    expectedAnswer: '10'
  },
  {
    category: 'Mathematics',
    question: '100 - 25',
    expectedSource: 'Direct Command',
    expectedAnswer: '75'
  },
  {
    category: 'Mathematics',
    question: '8 * 7',
    expectedSource: 'Direct Command',
    expectedAnswer: '56'
  },
  
  // Category 3: Entertainment (Joke API → OpenRouter)
  {
    category: 'Entertainment',
    question: 'Tell me a joke',
    expectedSource: ['Joke API', 'OpenRouter'],
    expectedCategory: 'Entertainment'
  },
  
  // Category 4: Weather (Simulated → OpenRouter)
  {
    category: 'Weather',
    question: 'Weather in Philadelphia',
    expectedSource: ['Simulated', 'OpenRouter'],
    expectedCategory: 'Weather'
  },
  
  // Category 5: Web Commands (Direct Command)
  {
    category: 'Web Command',
    question: 'Open Google AI',
    expectedSource: 'Web Command',
    expectedModel: 'Built-in',
    expectedInAnswer: 'google.com/search'
  },
  {
    category: 'Web Command',
    question: 'Open YouTube tutorials',
    expectedSource: 'Web Command',
    expectedInAnswer: 'youtube.com'
  },
  
  // Category 6: Portfolio (OpenRouter + LinkedIn)
  {
    category: 'Portfolio',
    question: 'What are Mangesh Raut\'s skills?',
    expectedSource: 'OpenRouter',
    expectedModel: 'Gemini 2.0 Flash',
    expectedCategory: 'Portfolio',
    linkedInTest: true
  },
  {
    category: 'Portfolio',
    question: 'Tell me about Mangesh\'s experience',
    expectedSource: 'OpenRouter',
    expectedCategory: 'Portfolio',
    linkedInTest: true
  },
  {
    category: 'Portfolio',
    question: 'What is Mangesh\'s highest qualification?',
    expectedSource: 'OpenRouter',
    expectedCategory: 'Portfolio',
    expectedInAnswer: 'Bachelor',
    linkedInTest: true
  },
  {
    category: 'Portfolio',
    question: 'Where does Mangesh work?',
    expectedSource: 'OpenRouter',
    expectedCategory: 'Portfolio',
    linkedInTest: true
  },
  {
    category: 'Portfolio',
    question: 'What projects has Mangesh worked on?',
    expectedSource: 'OpenRouter',
    expectedCategory: 'Portfolio',
    linkedInTest: true
  },
  
  // Category 7: Programming (OpenRouter)
  {
    category: 'Programming',
    question: 'What is a REST API?',
    expectedSource: 'OpenRouter',
    expectedModel: 'Gemini 2.0 Flash'
  },
  {
    category: 'Programming',
    question: 'Explain React hooks',
    expectedSource: 'OpenRouter'
  },
  
  // Category 8: General Knowledge (OpenRouter)
  {
    category: 'General Knowledge',
    question: 'Who is the Prime Minister of India?',
    expectedSource: 'OpenRouter',
    expectedModel: 'Gemini 2.0 Flash'
  },
  {
    category: 'General Knowledge',
    question: 'What is machine learning?',
    expectedSource: 'OpenRouter'
  },
  
  // Category 9: Basic Greetings
  {
    category: 'General Knowledge',
    question: 'Hello',
    expectedSource: 'OpenRouter'
  }
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Test a single question
async function testQuestion(testCase, index) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST ${index + 1}/${testCases.length}: ${testCase.category}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📝 Question: "${testCase.question}"`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://mangeshraut712.github.io'
      },
      body: JSON.stringify({
        message: testCase.question
      })
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`\n✅ RESPONSE RECEIVED:`);
    console.log(`   Answer: ${data.answer.substring(0, 100)}${data.answer.length > 100 ? '...' : ''}`);
    console.log(`   Source: ${data.source}`);
    console.log(`   Model: ${data.model}`);
    console.log(`   Category: ${data.category}`);
    console.log(`   Confidence: ${data.confidence}`);
    console.log(`   Runtime: ${data.runtime}`);
    console.log(`   Response Time: ${responseTime}ms`);
    
    // Validate response
    let passed = true;
    const issues = [];
    
    if (testCase.expectedSource) {
      const sources = Array.isArray(testCase.expectedSource) ? testCase.expectedSource : [testCase.expectedSource];
      if (!sources.includes(data.source)) {
        passed = false;
        issues.push(`Expected source: ${sources.join(' or ')}, got: ${data.source}`);
      }
    }
    
    if (testCase.expectedModel && data.model !== testCase.expectedModel) {
      passed = false;
      issues.push(`Expected model: ${testCase.expectedModel}, got: ${data.model}`);
    }
    
    if (testCase.expectedCategory && data.category !== testCase.expectedCategory) {
      passed = false;
      issues.push(`Expected category: ${testCase.expectedCategory}, got: ${data.category}`);
    }
    
    if (testCase.expectedAnswer && !data.answer.includes(testCase.expectedAnswer)) {
      passed = false;
      issues.push(`Expected answer to include: ${testCase.expectedAnswer}`);
    }
    
    if (testCase.expectedInAnswer && !data.answer.includes(testCase.expectedInAnswer)) {
      passed = false;
      issues.push(`Expected answer to include: ${testCase.expectedInAnswer}`);
    }
    
    if (passed) {
      console.log(`\n✅ TEST PASSED`);
      results.passed++;
    } else {
      console.log(`\n❌ TEST FAILED`);
      issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
      results.failed++;
    }
    
    results.details.push({
      test: testCase.question,
      category: testCase.category,
      passed,
      issues,
      response: {
        source: data.source,
        model: data.model,
        category: data.category,
        confidence: data.confidence,
        runtime: data.runtime,
        answerPreview: data.answer.substring(0, 150)
      }
    });
    
  } catch (error) {
    console.log(`\n❌ TEST FAILED`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.details.push({
      test: testCase.question,
      category: testCase.category,
      passed: false,
      error: error.message
    });
  }
  
  results.total++;
}

// Run all tests
async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        🧪 CHATBOT COMPREHENSIVE FEATURE TEST 🧪              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`API Endpoint: ${API_URL}`);
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Start Time: ${new Date().toLocaleString()}\n`);
  
  for (let i = 0; i < testCases.length; i++) {
    await testQuestion(testCases[i], i);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print summary
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('TEST SUMMARY');
  console.log(`${'='.repeat(70)}\n`);
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);
  
  // Category breakdown
  console.log('RESULTS BY CATEGORY:\n');
  const categoryStats = {};
  results.details.forEach(result => {
    if (!categoryStats[result.category]) {
      categoryStats[result.category] = { passed: 0, total: 0 };
    }
    categoryStats[result.category].total++;
    if (result.passed) categoryStats[result.category].passed++;
  });
  
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const status = stats.passed === stats.total ? '✅' : '⚠️';
    console.log(`${status} ${category}: ${stats.passed}/${stats.total}`);
  });
  
  // LinkedIn-specific tests
  console.log(`\n\nLINKEDIN INTEGRATION TESTS:\n`);
  const linkedInTests = results.details.filter(r => testCases.find(t => t.question === r.test && t.linkedInTest));
  console.log(`Total LinkedIn tests: ${linkedInTests.length}`);
  console.log(`Passed: ${linkedInTests.filter(t => t.passed).length}`);
  linkedInTests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.test}`);
    if (test.response) {
      console.log(`   → ${test.response.answerPreview.substring(0, 80)}...`);
    }
  });
  
  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`End Time: ${new Date().toLocaleString()}`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Failed tests details
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS DETAILS:\n');
    results.details.filter(r => !r.passed).forEach((result, i) => {
      console.log(`${i + 1}. ${result.test}`);
      console.log(`   Category: ${result.category}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.issues) {
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      console.log('');
    });
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: `${((results.passed / results.total) * 100).toFixed(1)}%`
    },
    categories: categoryStats,
    linkedInTests: linkedInTests.length,
    details: results.details
  };
  
  const fs = require('fs');
  const reportPath = 'CHATBOT_TEST_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📋 Detailed report saved to: ${reportPath}\n`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Test script to verify API keys are properly loaded
 * Usage: node test-config.js
 */

import { localConfig } from './js/config.local.js';

console.log('🔧 Testing API Configuration...\n');

console.log('📊 Config Status:');
console.log(`  Grok xAI:     ${localConfig.grokEnabled ? '✅' : '❌'} Enabled`);
console.log(`  Claude:       ${localConfig.anthropicEnabled ? '✅' : '❌'} Enabled`);
console.log(`  MCP:          ${localConfig.mcpEnabled ? '✅' : '❌'} Enabled`);
console.log('');

console.log('🔑 API Keys Verification:');
console.log(`  Grok API Key: ${localConfig.grokApiKey ? '✅ Present (' + localConfig.grokApiKey.substring(0, 8) + '...)' : '❌ Missing'}`);
console.log(`  Claude API Key: ${localConfig.anthropicApiKey ? '✅ Present (' + localConfig.anthropicApiKey.substring(0, 8) + '...)' : '❌ Missing'}`);
console.log('');

const allGood = localConfig.grokApiKey &&
                 localConfig.anthropicApiKey &&
                 localConfig.grokEnabled &&
                 localConfig.anthropicEnabled;

if (allGood) {
    console.log('🎉 All systems go! API keys are properly configured.');
    console.log('🌍 Your portfolio chatbot will work on GitHub Pages!');
    process.exit(0);
} else {
    console.log('❌ Configuration issues detected. Check your API keys.');
    console.log('💡 Run: ./run-test.sh for local development testing');
    process.exit(1);
}

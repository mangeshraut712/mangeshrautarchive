// 🔧 DEVELOPMENT CONFIGURATION - Local Testing
// ⚠️  DO NOT COMMIT - contains API keys for testing only
// 🔐 SECURITY NOTICE: This file is ignored by git (.gitignore) to prevent API key exposure
export const localConfig = {
  // 🔥 Grok xAI - Latest AI Model
  grokEnabled: true,
  grokApiKey: "", // ← Configure locally (see API_KEYS.txt)

  // 🤖 Claude (Anthropic) - Fallback AI
  anthropicEnabled: true,
  anthropicApiKey: "", // ← Configure locally (see API_KEYS.txt)

  // 📚 Other API configurations
  wikipediaEnabled: true,
  duckduckgoEnabled: true,
  stackoverflowEnabled: true,

  // 🔧 MCP Server integrations
  mcpEnabled: true,
  perplexityEnabled: true,
  githubEnabled: true
};

console.log("🔧 Development config loaded - local testing mode");

// 🔧 DEVELOPMENT CONFIGURATION - Local Testing
// ⚠️  DO NOT COMMIT - contains API keys for testing only
export const localConfig = {
  // 🔥 Grok xAI - Latest AI Model
  grokEnabled: true,
  grokApiKey: "",

  // 🤖 Claude (Anthropic) - Fallback AI
  anthropicEnabled: true,
  anthropicApiKey: "",

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

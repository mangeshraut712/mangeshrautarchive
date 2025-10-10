// 🔧 DEVELOPMENT CONFIGURATION - Local Testing
// ⚠️  DO NOT COMMIT - contains API keys for testing only
// 🔐 SECURITY NOTICE: This file is ignored by git (.gitignore) to prevent API key exposure
export const localConfig = {
  // 🔥 Grok xAI - Latest AI Model
  grokEnabled: true,
  grokApiKey: "xai-yXUWqZgbryXv8KKcBav1KqtE14mmTiBXUimiOfv3lEQLjIZDDEF8qm1uLkLlLDt3BWNRViqQC5WazyG8",

  // 🤖 Claude (Anthropic) - Fallback AI
  anthropicEnabled: true,
  anthropicApiKey: "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",

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

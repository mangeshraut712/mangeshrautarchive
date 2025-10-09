#!/bin/bash
# 🚀 Portfolio Development & Test Runner
# This script helps you test the portfolio locally with API keys

echo "🚀 Starting Portfolio Development Environment..."
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "📂 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found. Using system environment variables."
fi

# Create local config with API keys for development
echo ""
echo "🔧 Generating development config..."

cat > js/config.local.js << EOF
// 🔧 DEVELOPMENT CONFIGURATION - Local Testing
// ⚠️  DO NOT COMMIT - contains API keys for testing only
export const localConfig = {
  // 🔥 Grok xAI - Latest AI Model
  grokEnabled: true,
  grokApiKey: "$GROK_API_KEY",

  // 🤖 Claude (Anthropic) - Fallback AI
  anthropicEnabled: true,
  anthropicApiKey: "$ANTHROPIC_API_KEY",

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
EOF

echo "👨‍💻 Starting development server..."
npm run dev

echo ""
echo "✅ Setup complete! You can test your chatbot via the chat widget on the page."
echo "🌍 Local server running at: http://localhost:3000 (or wherever npm run dev opens it)"
echo ""
echo "🔧 To test API keys: node test-config.js"
echo "📦 To build for production: npm run build"
echo ""
echo "⚠️  Remember: Never commit the generated js/config.local.js file with real API keys!"

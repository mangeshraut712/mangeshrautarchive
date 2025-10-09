// This file contains your secret API keys and configuration.
// It is imported by services.js and should NOT be committed to Git.
// API keys are managed via environment variables or GitHub secrets.

export const localConfig = {
    // Anthropic (Claude) Configuration
    anthropicEnabled: true,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key-here',

    // Grok API Configuration (xAI) - Latest and most up-to-date AI model
    grokEnabled: true,
    grokApiKey: process.env.GROK_API_KEY || 'your-grok-key-here',

    // Other APIs
    supabaseUrl: '', // Not used in your current setup
    supabaseKey: '', // Not used in your current setup

    // MCP Server integration
    mcpEnabled: true,
    perplexityEnabled: true,
    githubEnabled: true
};

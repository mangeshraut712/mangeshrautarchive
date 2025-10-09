// This file contains your secret API keys and configuration.
// It is imported by services.js and should NOT be committed to Git.

export const localConfig = {
    // Anthropic (Claude) Configuration
    anthropicEnabled: true,
    anthropicApiKey: 'sk-ant-your-anthropic-api-key-here', // 👈 REPLACE WITH YOUR ACTUAL ANTHROPIC API KEY HERE

    // Grok API Configuration (xAI) - Latest and most up-to-date AI model
    grokEnabled: true,
    grokApiKey: 'xai-your-grok-api-key-placeholder', // 👈 REPLACE WITH YOUR ACTUAL GROK API KEY HERE (from x.ai/xAI)

    // Other APIs
    supabaseUrl: '', // Not used in your current setup
    supabaseKey: '', // Not used in your current setup
};

// This file contains your secret API keys and configuration.
// It is imported by services.js and should NOT be committed to Git.

export const localConfig = {
    // Anthropic (Claude) Configuration
    anthropicEnabled: true,
    anthropicApiKey: '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',

    // Grok API Configuration (xAI) - Latest and most up-to-date AI model
    grokEnabled: true,
    grokApiKey: 'xai-your-grok-api-key-placeholder', // 👈 REPLACE WITH YOUR ACTUAL GROK API KEY HERE (from x.ai/xAI)

    // Other APIs
    supabaseUrl: '', // Not used in your current setup
    supabaseKey: '', // Not used in your current setup
};

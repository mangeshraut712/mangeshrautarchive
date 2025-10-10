// Base configuration for AssistMe Portfolio Chatbot
// This file contains client-side defaults - real API keys loaded from config.local.js

export const ui = {
    maxMessages: 50,
    maxInputLength: 500,
    typingDelay: 500,
    scrollThreshold: 100
};

export const features = {
    enableMarkdownRendering: true,
    enableTypingIndicator: true,
    enableHistory: true,
    enableVoiceInput: true,
    enableContactForm: true,
    enableProjectsData: true,
    enableSmoothScroll: true,
    enableOverlayNavigation: true
};

export const chat = {
    defaultGreeting: "Hello! I'm AssistMe, Mangesh Raut's AI assistant with enhanced intelligence powered by Grok AI and advanced APIs. Ask me about his experience, skills, or any technical questions!",
    welcomeDelay: 500,
    suggestionsLimit: 5,
    historyRetentionHours: 24
};

export const errorMessages = {
    genericError: "🤖 I'm experiencing technical difficulties. Please try again in a moment.",
    networkError: "📡 Network connection issue. Check your internet connection.",
    apiError: "🔧 AI service temporarily unavailable. Try again later.",
    invalidInput: "❌ Please enter a valid message.",

    // API-specific errors
    grokError: "🔥 Grok AI service is temporarily unavailable. Using fallback AI.",
    claudeError: "🤖 Claude AI service is temporarily unavailable.",
    wikipediaError: "📚 Wikipedia service is currently down.",
    duckduckgoError: "🔍 DuckDuckGo search is unavailable.",

    // Portfolio-specific errors
    portfolioNotFound: "👨‍💼 Portfolio information for that query is not available.",
    skillsNotFound: "💡 Skills information not found in portfolio database.",

    // Math-specific errors
    invalidMath: "🧮 Invalid mathematical expression. Try something like '2 + 2' or 'convert 10m to feet'.",
    divisionByZero: "🚫 Division by zero is not allowed.",
    infiniteValue: "🔢 Result is too large to display.",

    // Voice-specific errors
    voiceNotSupported: "🎤 Voice input is not supported in your browser.",
    speechRecognitionFailed: "🎙️ Speech recognition failed. Please try again.",

    // Contact-specific errors
    contactValidationError: "❌ Please fill in all required contact form fields.",
    contactSendError: "📧 Failed to send message. Please try again."
};

// Load local configuration if available (for API keys)
let localConfig = {};
const localConfigScript = document.querySelector('script[data-config]');
if (localConfigScript) {
    try {
        const configData = localConfigScript.getAttribute('data-config');
        if (configData) {
            localConfig = JSON.parse(configData);
        }
    } catch (error) {
        console.warn('Failed to load local config from script tag:', error);
    }
}

// Try to load GitHub Actions generated config.local.js (production with embedded keys)
if (Object.keys(localConfig).length === 0) {
    try {
        // Import the actual config.local.js module if available
        const moduleURL = new URL('./config.local.js', window.location.origin + window.location.pathname).href;
        const configModule = await import(moduleURL);

        if (configModule && configModule.localConfig) {
            localConfig = { ...configModule.localConfig };
            console.log('✅ Production config loaded from config.local.js:', {
                grokEnabled: localConfig.grokEnabled,
                anthropicEnabled: localConfig.anthropicEnabled,
                hasGrokKey: !!localConfig.grokApiKey,
                hasAnthropicKey: !!localConfig.anthropicApiKey
            });
        }
    } catch (error) {
        console.info('Production config.local.js not available:', error.message);
        // Fallback: try fetching and parsing as text (backup method)
        try {
            const configResponse = await fetch('./js/config.local.js');
            if (configResponse.ok) {
                const configText = await configResponse.text();
                if (configText.includes('grokApiKey:')) {
                    // Extract API keys using regex
                    const grokKeyMatch = configText.match(/grokApiKey:\s*['"`]([^'"`]+)['"`]/);
                    const anthropicKeyMatch = configText.match(/anthropicApiKey:\s*['"`]([^'"`]+)['"`]/);
                    const grokEnabledMatch = configText.match(/grokEnabled:\s*(true|false)/);
                    const anthropicEnabledMatch = configText.match(/anthropicEnabled:\s*(true|false)/);

                    localConfig.grokApiKey = grokKeyMatch ? grokKeyMatch[1] : '';
                    localConfig.anthropicApiKey = anthropicKeyMatch ? anthropicKeyMatch[1] : '';
                    localConfig.grokEnabled = grokEnabledMatch ? grokEnabledMatch[1] === 'true' : false;
                    localConfig.anthropicEnabled = anthropicEnabledMatch ? anthropicEnabledMatch[1] === 'true' : false;

                    // Set other defaults
                    localConfig.wikipediaEnabled = true;
                    localConfig.duckduckgoEnabled = true;
                    localConfig.stackoverflowEnabled = true;

                    console.log('✅ Production config loaded via fetch fallback:', {
                        grokEnabled: localConfig.grokEnabled,
                        anthropicEnabled: localConfig.anthropicEnabled,
                        hasGrokKey: !!localConfig.grokApiKey,
                        hasAnthropicKey: !!localConfig.anthropicApiKey
                    });
                }
            }
        } catch (fetchError) {
            console.info('All config loading methods failed:', fetchError.message);
        }
    }

    // If still no config loaded, use safe fallback (development/demo mode)
if (Object.keys(localConfig).length === 0) {
    localConfig = {
        // 🔥 Primary AI: Grok (xAI) - Disabled in fallback for security
        grokEnabled: true,
        grokApiKey: '',

        // 🤖 Fallback AI: Claude (Anthropic) - Disabled in fallback for security
        anthropicEnabled: true,
        anthropicApiKey: '',

        // 📚 External services remain available (free APIs, no keys needed)
        wikipediaEnabled: true,
        duckduckgoEnabled: true,
        stackoverflowEnabled: true,

        // 🔧 MCP Server integrations - disabled in fallback
        mcpEnabled: false,
        perplexityEnabled: false,
        githubEnabled: false
    };

    console.warn('🔒 Using secure fallback configuration; runtime AI availability will be auto-detected.');
}

// Attempt to detect server-side AI availability (will fail silently on static hosting)
try {
    const statusResponse = await fetch('/api/ai/status', { cache: 'no-store' });
    if (statusResponse.ok) {
        const status = await statusResponse.json();

        if (status?.grok && typeof status.grok.available === 'boolean') {
            localConfig.grokEnabled = status.grok.available;
            if (!status.grok.available) {
                localConfig.grokApiKey = localConfig.grokApiKey || '';
            }
        }

        if (status?.claude && typeof status.claude.available === 'boolean') {
            localConfig.anthropicEnabled = status.claude.available;
            if (!status.claude.available) {
                localConfig.anthropicApiKey = localConfig.anthropicApiKey || '';
            }
        }

        if (status?.duckduckgo && typeof status.duckduckgo.available === 'boolean') {
            localConfig.duckduckgoEnabled = status.duckduckgo.available;
        }
    }
} catch (error) {
    console.info('AI status endpoint unavailable (likely static build):', error.message);
}

// Export local configuration as defaults if no real keys
export { localConfig };
export default {
    ui,
    features,
    chat,
    errorMessages,
    localConfig
};

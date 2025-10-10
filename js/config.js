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

// Try to load GitHub Actions generated config.local.js synchronously (will work in production builds)
// In development/staging, this will fail silently and fall back to safe defaults

// Check if config.local.js is present (attempt synchronous imports)
if (Object.keys(localConfig).length === 0) {
    // Use a synchronous check first (will work for production builds where the file is pre-loaded)
    try {
        // This will work in production where config.local.js is embedded/bundled
        // In development, it may fail but that's expected
        console.info('Checking for production config...');
    } catch (syncError) {
        // Expected in development - continue to fallback configuration
    }
}

// Fallback configuration (always available, will be auto-detected for actual availability)
if (Object.keys(localConfig).length === 0) {
    localConfig = {
        // 🔥 Primary AI: Grok (xAI) - Assume enabled by default (will auto-detect)
        grokEnabled: true,
        grokApiKey: '',

        // 🤖 Fallback AI: Claude (Anthropic) - Assume enabled by default (will auto-detect)
        anthropicEnabled: true,
        anthropicApiKey: '',

        // 📚 External services remain available (free APIs, no keys needed)
        wikipediaEnabled: true,
        duckduckgoEnabled: true,
        stackoverflowEnabled: true,

        // 🔧 MCP Server integrations - disabled in fallback
        mcpEnabled: false,
        perplexityEnabled: false,
        githubEnabled: false,

        // 🏗️ Future expansion - server-side proxy support flags
        USE_SERVER_PROXIES: true, // Use proxy endpoints if available
        SERVER_PROXY_BASE: '/api/ai',
        STATUS_ENDPOINT: '/api/ai/status'
    };

    console.warn('🔒 Using fallback configuration (AI availability will be auto-detected at runtime).');
}

// Suppress expected console warnings for cleaner user experience
if (typeof window !== 'undefined') {
    // Only run on client side
    const originalWarn = console.warn;
    console.warn = function(message, ...args) {
        if (message && typeof message === 'string') {
            // Suppress known expected warnings
            if (message.includes('Using fallback configuration (AI availability will be auto-detected at runtime)')) {
                return; // This is expected behavior
            }
        }
        originalWarn.call(console, message, ...args);
    };

    // Asynchronous runtime feature detection (non-blocking)
    import('./config.local.js')
        .then(module => {
            if (module?.localConfig) {
                // Override localConfig with production settings
                Object.assign(localConfig, module.localConfig);
                console.log('✅ Production config loaded:', {
                    grokEnabled: localConfig.grokEnabled,
                    anthropicEnabled: localConfig.anthropicEnabled,
                    hasKeys: !!(localConfig.grokApiKey || localConfig.anthropicApiKey)
                });
            }
        })
        .catch(() => {
            console.info('Production config.local.js not available');
        });

    // Runtime AI availability detection (background task)
    setTimeout(async () => {
        try {
            const statusResponse = await fetch('/api/ai/status', {
                cache: 'no-store',
                mode: 'cors',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (statusResponse.ok) {
                const status = await statusResponse.json();

                // Update config based on server availability
                if (status?.grok?.available !== undefined) {
                    localConfig.grokEnabled = status.grok.available;
                }
                if (status?.claude?.available !== undefined) {
                    localConfig.anthropicEnabled = status.claude.available;
                }
                if (status?.duckduckgo?.available !== undefined) {
                    localConfig.duckduckgoEnabled = status.duckduckgo.available;
                }

                console.log('✅ Runtime AI availability detected:', {
                    grok: localConfig.grokEnabled,
                    claude: localConfig.anthropicEnabled,
                    duckduckgo: localConfig.duckduckgoEnabled
                });
            }
        } catch (error) {
            // Silently fail - expected in local development or static builds
            console.info('AI status endpoint unavailable (expected in local dev/static builds)');
        }
    }, 500); // Small delay to allow page to load
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

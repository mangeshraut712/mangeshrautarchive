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

// Check for GitHub Actions generated config.local.js
if (Object.keys(localConfig).length === 0) {
    try {
        // Try dynamic import for GitHub Actions generated config.local.js
        const configResponse = await fetch('./js/config.local.js');
        if (configResponse.ok) {
            const configModule = await configResponse.text();
            if (configModule && configModule.includes('export const localConfig')) {
                // Extract and parse the config object
                const startIndex = configModule.indexOf('export const localConfig');
                if (startIndex !== -1) {
                    const endIndex = configModule.indexOf('};', startIndex) + 2;
                    const configText = configModule.substring(startIndex, endIndex);
                    // Simple parsing - extract object content
                    const configStart = configText.indexOf('{');
                    const configEnd = configText.lastIndexOf('}');
                    if (configStart !== -1 && configEnd !== -1) {
                        const configObjText = configText.substring(configStart + 1, configEnd);
                        // Simple key-value extraction (basic approach)
                        localConfig = {};
                        const lines = configObjText.split(/\r?\n/).map(line => line.trim());
                        for (const line of lines) {
                            if (line.includes('grokApiKey:')) {
                                localConfig.grokApiKey = line.split(':')[1].trim().replace(/[,"']/g, '');
                            }
                            if (line.includes('anthropicApiKey:')) {
                                localConfig.anthropicApiKey = line.split(':')[1].trim().replace(/[,"']/g, '');
                            }
                            if (line.includes('grokEnabled:')) {
                                localConfig.grokEnabled = (line.split(':')[1].trim().toLowerCase() === 'true');
                            }
                            if (line.includes('anthropicEnabled:')) {
                                localConfig.anthropicEnabled = (line.split(':')[1].trim().toLowerCase() === 'true');
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.info('GitHub Actions config not available (expected for PRs/forks):', error.message);
        // Safe fallback - no API keys available for security, but system will still work
        localConfig = {
            grokEnabled: false,
            anthropicEnabled: false,
            grokApiKey: '',
            anthropicApiKey: '',
            // External services remain available
            wikipediaEnabled: true,
            duckduckgoEnabled: true
        };
    }
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

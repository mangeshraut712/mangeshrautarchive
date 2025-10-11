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
    voiceNotSupported: "🎤 Voice input is not supported in your browser.",
    speechRecognitionFailed: "🎙️ Speech recognition failed. Please try again.",
    contactValidationError: "❌ Please fill in all required contact form fields.",
    contactSendError: "📧 Failed to send message. Please try again."
};

export const localConfig = {
    apiBaseUrl: 'https://mangeshrautarchive.vercel.app'
};

export default {
    ui,
    features,
    chat,
    errorMessages,
    localConfig
};
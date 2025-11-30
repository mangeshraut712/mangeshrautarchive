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
    defaultGreeting: "Hello! I'm AssistMe. Ask me about Mangesh Raut's experience, skills, or any technical questions.",
    welcomeDelay: 300,
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
    apiBaseUrl: 'https://mangeshraut.pro',
    // Load API keys from window object (injected for localhost development)
    openaiApiKey: typeof window !== 'undefined' ? window.API_KEYS?.OPENAI_API_KEY : (typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : ''),
    grokApiKey: typeof window !== 'undefined' ? window.API_KEYS?.GROK_API_KEY : (typeof process !== 'undefined' ? process.env?.GROK_API_KEY : ''),
    anthropicApiKey: typeof window !== 'undefined' ? window.API_KEYS?.ANTHROPIC_API_KEY : (typeof process !== 'undefined' ? process.env?.ANTHROPIC_API_KEY : ''),
    perplexityApiKey: typeof window !== 'undefined' ? window.API_KEYS?.PERPLEXITY_API_KEY : (typeof process !== 'undefined' ? process.env?.PERPLEXITY_API_KEY : ''),
    geminiApiKey: typeof window !== 'undefined' ? window.API_KEYS?.GEMINI_API_KEY : (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : ''),
    geminiFirebaseApiKey: typeof window !== 'undefined' ? window.API_KEYS?.GEMINI_FIREBASE_API_KEY : (typeof process !== 'undefined' ? process.env?.GEMINI_FIREBASE_API_KEY : ''),
    openrouterApiKey: typeof window !== 'undefined' ? window.API_KEYS?.OPENROUTER_API_KEY : (typeof process !== 'undefined' ? process.env?.OPENROUTER_API_KEY : ''),
    huggingfaceApiKey: typeof window !== 'undefined' ? window.API_KEYS?.HUGGINGFACE_API_KEY : (typeof process !== 'undefined' ? process.env?.HUGGINGFACE_API_KEY : ''),
    // Service configuration
    openaiEnabled: true,
    grokEnabled: true,
    anthropicEnabled: true,
    perplexityEnabled: true,
    geminiEnabled: true,
    huggingfaceEnabled: true,
    openrouterEnabled: true
};

export default {
    ui,
    features,
    chat,
    errorMessages,
    localConfig
};

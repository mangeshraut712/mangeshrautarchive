// AssistMe Chatbot - Optimized Configuration
// Focus: OpenRouter AI + Portfolio Intelligence

export const ui = {
    maxMessages: 100, // Increased for better conversation history
    maxInputLength: 1000, // Allow longer questions
    typingDelay: 300, // Faster response feel
    scrollThreshold: 100,
    animationDuration: 300
};

export const features = {
    enableMarkdownRendering: true,
    enableTypingIndicator: true,
    enableHistory: true,
    enableVoiceInput: true, // Speech-to-text
    enableVoiceOutput: true, // Text-to-speech
    enableSuggestions: true,
    enableMetadata: true,
    enableCopyMessage: true,
    enableSpeakMessage: true,
    enableThemeAwareness: true,
    enablePortfolioContext: true, // Smart portfolio answers
    enableContactForm: true,
    enableProjectsData: true,
    enableSmoothScroll: true,
    enableOverlayNavigation: true
};

export const chat = {
    defaultGreeting: "👋 Hello! I'm AssistMe, your intelligent assistant. I can help you learn about Mangesh Raut's experience, skills, projects, and answer any technical questions. How can I assist you today?",
    welcomeDelay: 500,
    suggestionsLimit: 6,
    historyRetentionHours: 72, // 3 days
    model: 'x-ai/grok-4.1-fast', // Default OpenRouter model
    streaming: true,
    temperature: 0.7,
    maxTokens: 2000
};

export const errorMessages = {
    genericError: "🤖 I encountered an issue. Let me try that again...",
    networkError: "📡 Network connection lost. Please check your internet.",
    apiError: "🔧 AI service temporarily unavailable. Please retry.",
    invalidInput: "❌ Please enter a valid message.",
    voiceNotSupported: "🎤 Voice input isn't supported in your browser. Try Chrome, Edge, or Safari.",
    speechRecognitionFailed: "🎙️ Couldn't understand that. Please try speaking again.",
    contactValidationError: "❌ Please fill in all required contact form fields.",
    contactSendError: "📧 Message send failed. Please try again.",
    rateLimitError: "⏱️ Too many requests. Please wait a moment.",
    emptyMessage: "💬 Please type a message first."
};

export const api = {
    baseUrl: '', // Set dynamically
    endpoints: {
        chat: '/api/chat',
        models: '/api/models',
        health: '/api/health',
        contact: '/api/contact'
    },
    timeout: 30000, // 30 seconds
    retries: 2
};

export const portfolio = {
    name: 'Mangesh Raut',
    title: 'Software Engineer',
    location: 'Philadelphia, PA',
    expertise: [
        'Full-Stack Development',
        'Cloud Technologies (AWS)',
        'Machine Learning',
        'Java Spring Boot',
        'AngularJS',
        'Python',
        'TensorFlow'
    ],
    contextSections: [
        'about',
        'experience',
        'skills',
        'projects',
        'education',
        'publications',
        'certifications',
        'awards'
    ]
};

export const suggestions = {
    initial: [
        "📝 Tell me about Mangesh's experience",
        "💼 What skills does Mangesh have?",
        "🚀 Show me Mangesh's projects",
        "🎓 What's Mangesh's education background?",
        "📚 Any published papers?",
        "🏆 Awards and achievements?"
    ],
    contextual: {
        about: [
            "What's Mangesh's background?",
            "Current role and company?",
            "Technical expertise?"
        ],
        experience: [
            "Latest work experience?",
            "Previous companies?",
            "Key achievements?"
        ],
        skills: [
            "Programming languages?",
            "Cloud technologies?",
            "ML/AI experience?"
        ],
        projects: [
            "Featured projects?",
            "Tech stack used?",
            "GitHub repositories?"
        ]
    }
};

export default {
    ui,
    features,
    chat,
    errorMessages,
    api,
    portfolio,
    suggestions
};


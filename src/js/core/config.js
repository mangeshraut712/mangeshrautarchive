// AssistMe Chatbot - Optimized Configuration
// Focus: OpenRouter AI + Portfolio Intelligence

const ui = {
  maxMessages: 100, // Increased for better conversation history
  maxInputLength: 1000, // Allow longer questions
  typingDelay: 300, // Faster response feel
  scrollThreshold: 100,
  animationDuration: 300,
};

const features = {
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
  enableOverlayNavigation: true,
};

const limits = {
  /** Client-side daily AI message estimate (server enforces per-minute throttling separately). */
  dailyChatMessages: 12,
};

const chat = {
  defaultGreeting:
    "👋 Hey there! I'm **AssistMe**, Mangesh's elite AI assistant. I can provide deep insights into his technical expertise, projects, and engineering achievements. Ask me anything about:\n\n• 🚀 **Experience** at Customized Energy Solutions\n• 💻 **Tech Stack**: Java, Python, Spring Boot, AWS\n• 🤖 **AI/ML Projects** & Research\n• 🎓 **Education** at Drexel University\n\nHow can I assist you today?",
  welcomeDelay: 400,
  suggestionsLimit: 6,
  historyRetentionHours: 168, // 7 days for better context
  model: 'google/gemini-2.5-flash', // Reliable OpenRouter default (grok falls back server-side)
  streaming: true,
  temperature: 0.7,
  maxTokens: 2500,
};

const errorMessages = {
  genericError: '🤖 I encountered an issue. Let me try that again...',
  networkError: '📡 Network connection lost. Please check your internet.',
  apiError: '🔧 AI service temporarily unavailable. Please retry.',
  invalidInput: '❌ Please enter a valid message.',
  voiceNotSupported: "🎤 Voice input isn't supported in your browser. Try Chrome, Edge, or Safari.",
  speechRecognitionFailed: "🎙️ Couldn't understand that. Please try speaking again.",
  contactValidationError: '❌ Please fill in all required contact form fields.',
  contactSendError: '📧 Message send failed. Please try again.',
  rateLimitError: '⏱️ Too many requests. Please wait a moment.',
  emptyMessage: '💬 Please type a message first.',
};

const api = {
  baseUrl: '', // Set dynamically
  endpoints: {
    chat: '/api/chat',
    chatHealth: '/api/chat/health',
    models: '/api/models',
    health: '/api/health',
    contact: '/api/contact',
    newsletterSubscribe: '/api/newsletter/subscribe',
  },
  timeout: 30000, // 30 seconds
  retries: 2,
};

const portfolio = {
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
    'TensorFlow',
  ],
  contextSections: [
    'about',
    'experience',
    'skills',
    'projects',
    'education',
    'publications',
    'certifications',
    'awards',
  ],
};

const suggestions = {
  initial: [
    "📝 Tell me about Mangesh's experience",
    '💼 What skills does Mangesh have?',
    "🚀 Show me Mangesh's projects",
    "🎓 What's Mangesh's education background?",
    '📚 Any published papers?',
    '🏆 Awards and achievements?',
  ],
  contextual: {
    about: ["What's Mangesh's background?", 'Current role and company?', 'Technical expertise?'],
    experience: ['Latest work experience?', 'Previous companies?', 'Key achievements?'],
    skills: ['Programming languages?', 'Cloud technologies?', 'ML/AI experience?'],
    projects: ['Featured projects?', 'Tech stack used?', 'GitHub repositories?'],
  },
};

const chatbotConfig = {
  ui,
  features,
  chat,
  limits,
  errorMessages,
  api,
  portfolio,
  suggestions,
};

window.chatbotConfig = chatbotConfig;

export { ui, features, chat, limits, errorMessages, api, portfolio, suggestions, chatbotConfig };

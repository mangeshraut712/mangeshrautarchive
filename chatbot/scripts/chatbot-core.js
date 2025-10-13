/**
 * ═══════════════════════════════════════════════════════════
 * ASSISTME CHATBOT - CORE MODULE
 * Main chatbot initialization and orchestration
 * ═══════════════════════════════════════════════════════════
 */

import chatbotConfig from '../config/chatbot-config.js';
import { ChatbotUI } from './chatbot-ui.js';
import { ChatbotAPI } from './chatbot-api.js';

class Chatbot {
  constructor(config = {}) {
    this.config = { ...chatbotConfig, ...config };
    this.ui = null;
    this.api = null;
    this.isReady = false;
  }

  /**
   * Initialize the chatbot
   */
  async init() {
    try {
      console.log('🤖 Initializing AssistMe Chatbot...');

      // Initialize API
      this.api = new ChatbotAPI(this.config.api);

      // Initialize UI
      this.ui = new ChatbotUI(this.config.ui, this.config.theme);
      
      // Set up event listeners
      this.setupEventListeners();

      // Apply dark mode if needed
      this.applyTheme();

      this.isReady = true;
      console.log('✅ AssistMe Chatbot initialized successfully!');

      return true;
    } catch (error) {
      console.error('❌ Chatbot initialization failed:', error);
      return false;
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Toggle button click
    this.ui.onToggle(() => {
      this.ui.toggle();
    });

    // Close button click
    this.ui.onClose(() => {
      this.ui.close();
    });

    // Message submission
    this.ui.onSubmit(async (message) => {
      await this.handleMessage(message);
    });

    // Voice button click
    this.ui.onVoiceClick(() => {
      this.handleVoice();
    });
  }

  /**
   * Handle incoming message
   */
  async handleMessage(message) {
    try {
      // Add user message to UI
      this.ui.addMessage(message, 'user');

      // Show loading indicator
      const loadingId = this.ui.showLoading();

      // Send to API
      const response = await this.api.sendMessage(message);

      // Remove loading indicator
      this.ui.removeMessage(loadingId);

      // Add bot response
      this.ui.addMessage(response.answer, 'bot', {
        source: response.source,
        model: response.model,
        category: response.category,
        runtime: response.runtime
      });

      // Scroll to bottom
      this.ui.scrollToBottom();

    } catch (error) {
      console.error('❌ Error handling message:', error);
      this.ui.showError(this.config.messages.error.api);
    }
  }

  /**
   * Handle voice input
   */
  handleVoice() {
    if (!this.config.features.voice.enabled) {
      this.ui.showError(this.config.messages.error.voice);
      return;
    }

    // TODO: Implement voice handling
    console.log('🎤 Voice input triggered');
  }

  /**
   * Apply theme (dark/light mode)
   */
  applyTheme() {
    if (!this.config.features.darkMode.enabled) return;

    const isDark = detectDarkMode();
    document.documentElement.classList.toggle('dark', isDark);
  }

  /**
   * Destroy chatbot
   */
  destroy() {
    if (this.ui) this.ui.destroy();
    if (this.api) this.api.destroy();
    this.isReady = false;
    console.log('🗑️ Chatbot destroyed');
  }
}

/**
 * Initialize chatbot (exported function)
 */
export async function initChatbot(config) {
  const chatbot = new Chatbot(config);
  await chatbot.init();
  
  // Expose globally for debugging
  if (chatbot.config.debug) {
    window.chatbot = chatbot;
  }
  
  return chatbot;
}

/**
 * Dark mode detector
 */
function detectDarkMode() {
  const stored = localStorage.getItem('chatbot-theme');
  if (stored) return stored === 'dark';
  
  if (window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  return false;
}

export default Chatbot;

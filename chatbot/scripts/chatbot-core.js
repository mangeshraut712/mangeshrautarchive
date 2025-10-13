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
    this.lastScrollY = 0;
    this.scrollTimeout = null;
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
    // Scroll event for dynamic positioning
    window.addEventListener('scroll', () => {
      this.handleScroll();
    });

    // Toggle button click - bind directly to avoid method reference issues
    const toggleButton = document.getElementById('chatbot-toggle');
    if (toggleButton) {
      // Remove existing listeners to prevent duplication
      toggleButton.removeEventListener('click', this._toggleHandler);
      this._toggleHandler = (event) => {
        console.log('Toggle button clicked directly');
        event.preventDefault();
        event.stopPropagation();
        if (this.ui && this.ui.toggle) {
          this.ui.toggle();
        }
      };
      toggleButton.addEventListener('click', this._toggleHandler);
    }

    // Close button click
    this.ui.onClose(() => this.ui.close());

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
   * Handle scroll events for dynamic positioning
   */
  handleScroll() {
    const currentScrollY = window.scrollY;
    const direction = currentScrollY > this.lastScrollY ? 'down' : 'up';
    const scrollDistance = Math.abs(currentScrollY - this.lastScrollY);

    // Update toggle position based on scroll direction
    this.updateTogglePosition(direction, scrollDistance);

    this.lastScrollY = currentScrollY;

    // Clear existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Set new timeout to reset position after scrolling stops
    this.scrollTimeout = setTimeout(() => {
      this.resetTogglePosition();
    }, 150);
  }

  /**
   * Update toggle button position based on scroll direction
   */
  updateTogglePosition(direction, distance) {
    const toggleButton = document.getElementById('chatbot-toggle');
    if (!toggleButton) return;

    // Calculate movement (subtle effect)
    const maxMovement = 20;
    const movement = Math.min(distance * 0.5, maxMovement);

    // Apply transform based on scroll direction
    if (direction === 'down') {
      toggleButton.style.transform = `translate3d(0, ${-160 - movement}px, 0)`;
    } else {
      toggleButton.style.transform = `translate3d(0, ${-160 + movement}px, 0)`;
    }
  }

  /**
   * Reset toggle position after scrolling stops
   */
  resetTogglePosition() {
    const toggleButton = document.getElementById('chatbot-toggle');
    if (toggleButton) {
      toggleButton.style.transform = 'translate3d(0, -160px, 0)';
    }
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

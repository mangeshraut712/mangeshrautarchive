/**
 * ═══════════════════════════════════════════════════════════
 * CHATBOT INITIALIZATION
 * Easy integration file for the portfolio website
 * ═══════════════════════════════════════════════════════════
 * 
 * Usage:
 * 1. Include chatbot HTML in your page
 * 2. Load this script: <script type="module" src="chatbot/chatbot-init.js"></script>
 * 3. Chatbot will auto-initialize!
 */

import { initChatbot } from './scripts/chatbot-core.js';

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting chatbot initialization...');
    
    try {
      // Check if chatbot elements exist
      const toggle = document.getElementById('chatbot-toggle');
      const widget = document.getElementById('chatbot-widget');
      
      if (!toggle || !widget) {
        console.error('❌ Chatbot elements not found!', {
          toggle: !!toggle,
          widget: !!widget
        });
        return;
      }
      
      console.log('✅ Chatbot elements found');
      
      // Initialize chatbot with default config
      const chatbot = await initChatbot({
        // Override any config here if needed
        debug: true // Enable debug for testing
      });
      
      console.log('✅ Chatbot initialized:', chatbot);
      
      // Show welcome message after a delay
      setTimeout(() => {
        if (chatbot && chatbot.ui) {
          chatbot.ui.addMessage(
            "Hello! I'm AssistMe. Ask me about Mangesh Raut's experience, skills, or any technical questions.",
            'bot'
          );
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Failed to initialize chatbot:', error);
    }
  });
}

console.log('📦 Chatbot module loaded');

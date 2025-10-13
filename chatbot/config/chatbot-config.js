/**
 * ═══════════════════════════════════════════════════════════
 * CHATBOT CONFIGURATION
 * Central configuration for the AssistMe chatbot
 * ═══════════════════════════════════════════════════════════
 */

export const chatbotConfig = {
  // API Configuration
  api: {
    baseUrl: 'https://mangeshrautarchive.vercel.app',
    endpoints: {
      chat: '/api/chat',
      status: '/api/status'
    },
    timeout: 30000 // 30 seconds
  },

  // UI Configuration
  ui: {
    title: 'AssistMe',
    subtitle: 'AI Assistant',
    placeholder: 'Ask me anything...',
    welcomeMessage: "Hello! I'm AssistMe. Ask me about Mangesh Raut's experience, skills, or any technical questions.",
    
    // Positioning
    position: {
      toggle: {
        bottom: 32,
        right: 32,
        size: 64
      },
      widget: {
        bottom: 110,
        right: 32,
        width: 400,
        height: 640
      }
    },

    // Mobile responsiveness
    mobile: {
      breakpoint: 768,
      toggle: {
        bottom: 20,
        right: 20,
        size: 56
      },
      widget: {
        bottom: 90,
        margin: 10
      }
    }
  },

  // Theme Configuration
  theme: {
    // Colors (Apple Design System)
    colors: {
      primary: '#007aff',
      primaryDark: '#0051d5',
      success: '#34c759',
      successDark: '#30d158',
      
      // Light mode
      light: {
        background: 'rgba(255, 255, 255, 0.98)',
        text: '#1d1d1f',
        border: 'rgba(0, 0, 0, 0.08)',
        inputBg: 'rgba(242, 242, 247, 0.8)',
        messageBg: 'rgba(142, 142, 147, 0.12)'
      },
      
      // Dark mode
      dark: {
        background: 'rgba(28, 28, 30, 0.98)',
        text: '#f5f5f7',
        border: 'rgba(255, 255, 255, 0.1)',
        inputBg: 'rgba(44, 44, 46, 0.8)',
        messageBg: 'rgba(118, 118, 128, 0.24)'
      }
    },

    // Typography
    fonts: {
      primary: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
      sizes: {
        header: '18px',
        subtitle: '13px',
        message: '15px',
        metadata: '11px'
      }
    },

    // Animations
    animations: {
      duration: '0.3s',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      widgetDuration: '0.4s'
    },

    // Effects
    effects: {
      blur: '20px',
      shadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
      borderRadius: '20px'
    }
  },

  // Features
  features: {
    voice: {
      enabled: true,
      autoStop: true,
      silenceTimeout: 2000,
      s2rMode: true
    },
    
    darkMode: {
      enabled: true,
      auto: true, // Auto-detect system preference
      storageKey: 'chatbot-theme'
    },

    history: {
      enabled: true,
      maxMessages: 50,
      storageKey: 'chatbot-history'
    },

    typing: {
      enabled: true,
      delay: 500
    }
  },

  // Error Messages
  messages: {
    error: {
      network: '📡 Network connection issue. Check your internet.',
      api: '🔧 AI service temporarily unavailable. Try again later.',
      generic: '🤖 Something went wrong. Please try again.',
      voice: '🎤 Voice input not supported in your browser.'
    },
    
    loading: {
      thinking: 'Thinking...',
      typing: '●●●'
    }
  },

  // Z-index values
  zIndex: {
    toggle: 9998,
    widget: 9997,
    voiceMenu: 10000
  },

  // Debug mode
  debug: false
};

// Export individual configs for convenience
export const { api, ui, theme, features, messages, zIndex } = chatbotConfig;

// Dark mode detector
export function detectDarkMode() {
  if (!features.darkMode.enabled) return false;
  
  // Check stored preference
  const stored = localStorage.getItem(features.darkMode.storageKey);
  if (stored) return stored === 'dark';
  
  // Auto-detect system preference
  if (features.darkMode.auto && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  return false;
}

// Log config in debug mode
if (chatbotConfig.debug) {
  console.log('🤖 Chatbot Config:', chatbotConfig);
}

export default chatbotConfig;

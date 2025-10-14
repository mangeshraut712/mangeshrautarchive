/**
 * ═══════════════════════════════════════════════════════════
 * iMessage Pro - Modern JavaScript Implementation
 * Clean, async, production-ready
 * ═══════════════════════════════════════════════════════════
 */

class ChatbotPro {
  constructor() {
    this.isOpen = false;
    this.isVoiceListening = false;
    this.recognition = null;
    this.apiUrl = 'https://mangeshrautarchive.vercel.app/api/chat';
    
    this.elements = {
      toggle: null,
      widget: null,
      closeBtn: null,
      messages: null,
      form: null,
      input: null,
      sendBtn: null,
      voiceBtn: null
    };
    
    this.init();
  }
  
  /**
   * Initialize chatbot
   */
  async init() {
    console.log('💬 Initializing iMessage Pro chatbot...');
    
    // Get DOM elements
    this.elements = {
      toggle: document.getElementById('chatbot-toggle'),
      widget: document.getElementById('chatbot-widget'),
      closeBtn: document.querySelector('.chatbot-close-btn'),
      messages: document.getElementById('chatbot-messages'),
      form: document.getElementById('chatbot-form'),
      input: document.getElementById('chatbot-input'),
      sendBtn: document.querySelector('.chatbot-send-btn'),
      voiceBtn: document.getElementById('chatbot-voice-btn')
    };
    
    if (!this.elements.toggle || !this.elements.widget) {
      console.error('❌ Required elements not found');
      return;
    }
    
    // Setup event listeners
    this.setupToggle();
    this.setupClose();
    this.setupForm();
    this.setupVoice();
    
    // Show welcome message
    setTimeout(() => this.showWelcome(), 500);
    
    console.log('✅ iMessage Pro chatbot ready!');
  }
  
  /**
   * Setup toggle button
   */
  setupToggle() {
    this.elements.toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });
  }
  
  /**
   * Setup close button
   */
  setupClose() {
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }
  }
  
  /**
   * Setup form submission
   */
  setupForm() {
    if (this.elements.form) {
      this.elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = this.elements.input?.value.trim();
        if (text) {
          await this.sendMessage(text);
          this.elements.input.value = '';
        }
      });
    }
    
    if (this.elements.sendBtn) {
      this.elements.sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.elements.form) {
          this.elements.form.dispatchEvent(new Event('submit'));
        }
      });
    }
  }
  
  /**
   * Setup voice recognition
   */
  setupVoice() {
    if (!this.elements.voiceBtn) return;
    
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Recognized:', transcript);
        this.stopVoiceListening();
        if (transcript.trim()) {
          await this.sendMessage(transcript.trim());
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('🎤 Voice error:', event.error);
        this.stopVoiceListening();
      };
      
      this.recognition.onend = () => {
        this.stopVoiceListening();
      };
    }
    
    this.elements.voiceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleVoice();
    });
  }
  
  /**
   * Toggle chatbot open/close
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  /**
   * Open chatbot
   */
  open() {
    this.elements.widget.classList.remove('hidden');
    this.elements.widget.classList.add('active');
    this.elements.toggle.setAttribute('aria-expanded', 'true');
    this.elements.widget.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    console.log('✅ Chatbot opened');
  }
  
  /**
   * Close chatbot
   */
  close() {
    // Blur all focusable elements
    this.blurAll();
    
    this.elements.widget.classList.remove('active');
    this.elements.widget.classList.add('hidden');
    this.elements.toggle.setAttribute('aria-expanded', 'false');
    this.elements.widget.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    console.log('❌ Chatbot closed');
  }
  
  /**
   * Blur all focusable elements
   */
  blurAll() {
    setTimeout(() => {
      if (this.elements.input) this.elements.input.blur();
      if (this.elements.sendBtn) this.elements.sendBtn.blur();
      if (this.elements.voiceBtn) this.elements.voiceBtn.blur();
      if (this.elements.closeBtn) this.elements.closeBtn.blur();
      document.activeElement?.blur();
    }, 10);
  }
  
  /**
   * Toggle voice listening
   */
  toggleVoice() {
    if (!this.recognition) {
      alert('🎤 Voice not supported in this browser.\n\nPlease use Chrome, Edge, or Safari.');
      return;
    }
    
    if (this.isVoiceListening) {
      this.stopVoiceListening();
    } else {
      this.startVoiceListening();
    }
  }
  
  /**
   * Start voice listening
   */
  startVoiceListening() {
    try {
      this.recognition.start();
      this.isVoiceListening = true;
      this.elements.voiceBtn.classList.add('listening');
      this.elements.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i><span class="chatbot-voice-badge">●</span>';
      console.log('🎤 Listening...');
    } catch (error) {
      console.error('🎤 Start error:', error);
    }
  }
  
  /**
   * Stop voice listening
   */
  stopVoiceListening() {
    if (this.isVoiceListening && this.recognition) {
      this.recognition.stop();
    }
    this.isVoiceListening = false;
    this.elements.voiceBtn.classList.remove('listening');
    this.elements.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i><span class="chatbot-voice-badge">S2R</span>';
    this.elements.voiceBtn.blur();
  }
  
  /**
   * Send message
   */
  async sendMessage(text) {
    if (!text || !this.elements.messages) return;
    
    console.log('📤 Sending:', text);
    
    // Add user message
    this.addUserMessage(text);
    
    // Show typing indicator
    const typingId = this.showTyping();
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message: text })
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Response:', data);
      
      // Remove typing, add response
      this.hideTyping(typingId);
      this.addBotMessage(data);
      
    } catch (error) {
      console.error('❌ Error:', error);
      this.hideTyping(typingId);
      this.addErrorMessage(error.message);
    }
  }
  
  /**
   * Add user message
   */
  addUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';
    wrapper.style.justifyContent = 'flex-end';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = text;
    
    wrapper.appendChild(messageDiv);
    this.elements.messages.appendChild(wrapper);
    this.scrollToBottom();
  }
  
  /**
   * Add bot message with metadata
   */
  addBotMessage(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';
    wrapper.style.justifyContent = 'flex-start';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    // Answer text
    const answerDiv = document.createElement('div');
    answerDiv.textContent = data.answer;
    messageDiv.appendChild(answerDiv);
    
    // Metadata
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-metadata';
    metaDiv.innerHTML = `
      Source: ${data.source || 'AI'}<br>
      Model: ${data.model || 'Assistant'}<br>
      Category: ${data.category || 'Response'}<br>
      Confidence: ${((data.confidence || 0.9) * 100).toFixed(0)}%<br>
      Length: ${data.answerLength || data.answer?.length || 0} chars<br>
      Runtime: ${data.runtime || '0ms'}
    `;
    messageDiv.appendChild(metaDiv);
    
    wrapper.appendChild(messageDiv);
    this.elements.messages.appendChild(wrapper);
    this.scrollToBottom();
  }
  
  /**
   * Show typing indicator
   */
  showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper typing-wrapper';
    wrapper.style.justifyContent = 'flex-start';
    wrapper.id = 'typing-' + Date.now();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-typing';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    wrapper.appendChild(typingDiv);
    this.elements.messages.appendChild(wrapper);
    this.scrollToBottom();
    
    return wrapper.id;
  }
  
  /**
   * Hide typing indicator
   */
  hideTyping(typingId) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) {
      typingEl.remove();
    }
  }
  
  /**
   * Add error message
   */
  addErrorMessage(error) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';
    wrapper.style.justifyContent = 'flex-start';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.style.background = '#FF3B30';
    messageDiv.style.color = '#ffffff';
    messageDiv.textContent = `⚠️ ${error}. Please try again.`;
    
    wrapper.appendChild(messageDiv);
    this.elements.messages.appendChild(wrapper);
    this.scrollToBottom();
  }
  
  /**
   * Show welcome message
   */
  showWelcome() {
    if (this.elements.messages.children.length > 0) return;
    
    const data = {
      answer: "👋 Hey there! I'm AssistMe, your AI companion. I'd love to chat about Mangesh's expertise, projects, or answer any tech questions you have. What would you like to know?",
      source: 'AssistMe',
      model: 'Welcome Bot',
      category: 'Greeting',
      confidence: 1.0,
      answerLength: 165,
      runtime: '0ms'
    };
    
    this.addBotMessage(data);
  }
  
  /**
   * Scroll messages to bottom
   */
  scrollToBottom() {
    if (this.elements.messages) {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
  }
}

// Initialize on DOM ready
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.chatbotPro = new ChatbotPro();
    }, 600);
  });
}

export default ChatbotPro;

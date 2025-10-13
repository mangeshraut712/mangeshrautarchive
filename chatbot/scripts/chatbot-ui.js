/**
 * ═══════════════════════════════════════════════════════════
 * CHATBOT UI - User Interface Management
 * ═══════════════════════════════════════════════════════════
 */

export class ChatbotUI {
  constructor(uiConfig, themeConfig) {
    this.config = uiConfig;
    this.theme = themeConfig;
    this.messageId = 0;
    
    // Get DOM elements
    this.toggleButton = document.getElementById('chatbot-toggle');
    this.widget = document.getElementById('chatbot-widget');
    this.closeBtn = document.querySelector('.chatbot-close-btn');
    this.form = document.getElementById('chatbot-form');
    this.input = document.getElementById('chatbot-input');
    this.messages = document.getElementById('chatbot-messages');
    this.voiceBtn = document.getElementById('chatbot-voice-btn');
    
    if (!this.toggleButton || !this.widget) {
      console.error('❌ Chatbot elements not found!');
    }
  }

  /**
   * Toggle widget visibility
   */
  toggle() {
    const isHidden = this.widget.classList.contains('hidden');
    
    if (isHidden) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Open widget
   */
  open() {
    this.widget.classList.remove('hidden');
    this.toggleButton?.setAttribute('aria-expanded', 'true');
    this.widget.setAttribute('aria-hidden', 'false');
    this.input?.focus();
    console.log('✅ Chatbot opened');
  }

  /**
   * Close widget
   */
  close() {
    this.widget.classList.add('hidden');
    this.toggleButton?.setAttribute('aria-expanded', 'false');
    this.widget.setAttribute('aria-hidden', 'true');
    console.log('✅ Chatbot closed');
  }

  /**
   * Add message to chat
   */
  addMessage(text, type = 'bot', metadata = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${type}`;
    messageDiv.dataset.id = ++this.messageId;
    
    // Message text
    const textDiv = document.createElement('div');
    textDiv.textContent = text;
    messageDiv.appendChild(textDiv);
    
    // Add metadata if provided (for bot messages)
    if (metadata && type === 'bot') {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'chatbot-message-metadata';
      
      const parts = [];
      if (metadata.source) parts.push(metadata.source);
      if (metadata.model) parts.push(metadata.model);
      if (metadata.category) parts.push(metadata.category);
      if (metadata.runtime) parts.push(metadata.runtime);
      
      metaDiv.textContent = parts.join(' • ');
      messageDiv.appendChild(metaDiv);
    }
    
    this.messages.appendChild(messageDiv);
    this.scrollToBottom();
    
    return this.messageId;
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chatbot-message bot loading';
    loadingDiv.dataset.id = ++this.messageId;
    loadingDiv.innerHTML = '<span class="chatbot-typing">●●●</span>';
    
    this.messages.appendChild(loadingDiv);
    this.scrollToBottom();
    
    return this.messageId;
  }

  /**
   * Remove message by ID
   */
  removeMessage(id) {
    const message = this.messages.querySelector(`[data-id="${id}"]`);
    if (message) message.remove();
  }

  /**
   * Show error message
   */
  showError(errorText) {
    this.addMessage(errorText, 'bot');
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.messages.innerHTML = '';
    this.messageId = 0;
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  /**
   * Event: Toggle button clicked
   */
  onToggle(callback) {
    this.toggleButton?.addEventListener('click', callback);
  }

  /**
   * Event: Close button clicked
   */
  onClose(callback) {
    this.closeBtn?.addEventListener('click', callback);
  }

  /**
   * Event: Message submitted
   */
  onSubmit(callback) {
    this.form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = this.input.value.trim();
      if (!message) return;
      
      // Clear input
      this.input.value = '';
      
      // Call callback
      await callback(message);
    });
  }

  /**
   * Event: Voice button clicked
   */
  onVoiceClick(callback) {
    this.voiceBtn?.addEventListener('click', callback);
  }

  /**
   * Destroy UI
   */
  destroy() {
    // Remove event listeners would go here
    console.log('🗑️ UI destroyed');
  }
}

export default ChatbotUI;

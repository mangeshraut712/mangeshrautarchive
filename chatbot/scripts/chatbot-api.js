/**
 * ═══════════════════════════════════════════════════════════
 * CHATBOT API - Backend Communication
 * ═══════════════════════════════════════════════════════════
 */

export class ChatbotAPI {
  constructor(apiConfig) {
    this.config = apiConfig;
    this.conversationHistory = [];
  }

  /**
   * Send message to API
   */
  async sendMessage(message) {
    const startTime = Date.now();

    try {
      const url = `${this.config.baseUrl}${this.config.endpoints.chat}`;
      
      console.log('📤 Sending message:', message);
      console.log('📍 API URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          messages: this.conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const runtime = Date.now() - startTime;

      console.log('✅ Response received:', data);

      // Add to conversation history
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: data.answer }
      );

      // Keep only last 10 exchanges
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return {
        answer: data.answer || 'No response',
        source: data.source || 'AI',
        model: data.model || '',
        category: data.category || 'General',
        confidence: data.confidence || 0,
        runtime: data.runtime || `${runtime}ms`
      };

    } catch (error) {
      console.error('❌ API Error:', error);
      
      // Return offline fallback
      return {
        answer: '⚠️ Could not connect to AI service. Please try again later.',
        source: 'Offline',
        model: 'None',
        category: 'Error',
        confidence: 0,
        runtime: '0ms'
      };
    }
  }

  /**
   * Check API status
   */
  async checkStatus() {
    try {
      const url = `${this.config.baseUrl}${this.config.endpoints.status}`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Destroy API
   */
  destroy() {
    this.clearHistory();
    console.log('🗑️ API destroyed');
  }
}

export default ChatbotAPI;

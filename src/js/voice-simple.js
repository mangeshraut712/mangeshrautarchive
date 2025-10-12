/**
 * Simple Voice Mode - No Nonsense Approach
 * Just works - like modern voice assistants
 */

class SimpleVoiceMode {
    constructor(chatManager) {
        this.chatManager = chatManager;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Voice not supported');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // One question at a time
        this.recognition.interimResults = false; // Final results only
        this.recognition.maxAlternatives = 1; // Simple
        
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onend = () => this.handleEnd();
        
        console.log('✅ Simple voice mode ready');
    }
    
    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    start() {
        if (!this.recognition) return;
        
        try {
            this.recognition.start();
            this.isActive = true;
            this.chatManager.setVoiceInputActive(true);
            console.log('🎤 Listening...');
        } catch (e) {
            console.log('Already listening');
        }
    }
    
    stop() {
        if (!this.recognition) return;
        
        try {
            this.recognition.stop();
            this.isActive = false;
            this.chatManager.setVoiceInputActive(false);
            console.log('🛑 Stopped');
        } catch (e) {
            console.log('Already stopped');
        }
    }
    
    async handleResult(event) {
        const transcript = event.results[0][0].transcript.trim();
        console.log(`📝 You said: "${transcript}"`);
        
        // Stop immediately after getting input
        this.stop();
        
        // Show user's message
        this.chatManager.addMessage(`🎤 ${transcript}`, 'user', { skipSpeech: true });
        
        // Get AI response
        try {
            const response = await this.chatManager.fetchAssistantResponse(transcript);
            const content = response?.content || response?.answer || 'I did not understand that.';
            
            this.chatManager.addMessage(content, 'assistant');
            
            // Speak response if enabled
            if (this.chatManager.voiceOutputEnabled && this.synthesis) {
                this.synthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(content);
                utterance.rate = 1.1;
                utterance.pitch = 1.0;
                this.synthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Voice query error:', error);
            this.chatManager.addMessage('Sorry, I had trouble processing that.', 'assistant');
        }
        
        // Ready for next input (user clicks mic again)
        console.log('✅ Ready for next question');
    }
    
    handleError(event) {
        console.log('Voice error:', event.error);
        this.stop();
    }
    
    handleEnd() {
        this.isActive = false;
        this.chatManager.setVoiceInputActive(false);
        console.log('🎤 Mic ended');
    }
}

// Export for use in script.js
export { SimpleVoiceMode };

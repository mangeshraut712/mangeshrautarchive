/**
 * Voice Manager - S2R-Inspired Voice Processing
 * ==============================================
 *
 * Implements Google's Speech-to-Retrieval (S2R) concepts for advanced voice handling:
 * - Direct semantic mapping circumventing traditional speech-to-text conversion
 * - Intent-based understanding using embedding similarity
 * - Voice activation modes and continuous listening
 */

class VoiceManager {
    constructor(chatManager) {
        this.chatManager = chatManager;
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isContinuous = false;
        this.voiceCommands = new Map();

        this.initializeSpeechRecognition();
        this.initializeSpeechSynthesis();
        this.setupVoiceCommands();
        this.bindEvents();
    }

    /**
     * Initialize Web Speech API Recognition
     * Uses browser-native speech recognition for S2R-like semantic processing
     */
    initializeSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();

        // Configure for semantic/intent-focused recognition (S2R-inspired)
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3; // Multiple hypotheses for intent matching

        // Event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onend = () => this.onRecognitionEnd();
        this.recognition.onerror = (event) => this.onRecognitionError(event);
    }

    /**
     * Initialize Web Speech Synthesis API
     */
    initializeSpeechSynthesis() {
        this.synthesis = window.speechSynthesis;

        // Configure voice preferences
        this.voices = [];
        this.preferredVoice = null;

        if (this.synthesis) {
            // Load available voices
            const loadVoices = () => {
                this.voices = this.synthesis.getVoices();
                // Prefer natural, human-like voices
                this.preferredVoice = this.voices.find(voice =>
                    voice.name.toLowerCase().includes('natural') ||
                    voice.name.toLowerCase().includes('human') ||
                    voice.lang.startsWith('en') && voice.localService
                ) || this.voices.find(voice => voice.lang.startsWith('en'));
            };

            loadVoices();
            this.synthesis.onvoiceschanged = loadVoices;
        }
    }

    /**
     * Setup voice commands for intent recognition (S2R semantic matching)
     */
    setupVoiceCommands() {
        // Portfolio-specific voice commands (semantic intent mapping)
        this.intentMap = {
            // Greeting intents
            greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],

            // Portfolio inquiries
            qualifications: ['highest qualification', 'degree', 'education', 'what degree', 'masters', 'bachelors'],
            experience: ['work experience', 'job', 'career', 'profession', 'role'],
            skills: ['skills', 'technologies', 'expertise', 'programming'],
            projects: ['projects', 'work', 'code', 'github'],
            contact: ['contact', 'email', 'phone', 'reach', 'connect'],

            // General knowledge
            who_is: ['who is', 'what is', 'tell me about'],
            math: ['calculate', 'math', 'solve', 'compute'],
            facts: ['capital', 'population', 'history'],

            // Voice control
            stop: ['stop', 'enough', 'quit', 'exit'],
            help: ['help', 'commands', 'what can you do']
        };

        this.commandHandlers = {
            'help': () => this.handleHelpCommand(),
            'stop': () => this.handleStopCommand(),
            'activate_continuous': () => this.startContinuousListening(),
            'deactivate_continuous': () => this.stopContinuousListening()
        };
    }

    /**
     * Bind UI events for voice functionality
     */
    bindEvents() {
        // Voice button bindings (will be set up in UI)
        document.addEventListener('voice-input-click', () => this.toggleVoiceInput());
        document.addEventListener('voice-output-click', () => this.toggleVoiceOutput());
    }

    // ========== VOICE INPUT METHODS ==========

    /**
     * Start voice recognition (single utterance)
     */
    startVoiceInput() {
        if (!this.recognition) {
            this.chatManager.addMessage('Voice input is not supported in this browser.', 'system');
            return;
        }

        if (this.isListening) {
            this.stopVoiceInput();
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Speech recognition start failed:', error);
        }
    }

    /**
     * Stop voice recognition
     */
    stopVoiceInput() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Toggle voice input on/off
     */
    toggleVoiceInput() {
        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    /**
     * Start continuous voice listening mode
     */
    startContinuousListening() {
        if (!this.recognition) return;

        this.isContinuous = true;
        this.chatManager.addMessage('🔥 Continuous voice mode activated. I\'m listening...', 'system');
        this.startVoiceInput();
    }

    /**
     * Stop continuous voice listening mode
     */
    stopContinuousListening() {
        this.isContinuous = false;
        this.stopVoiceInput();
        this.chatManager.addMessage('🔇 Continuous voice mode deactivated.', 'system');
    }

    // ========== VOICE RECOGNITION EVENT HANDLERS ==========

    onRecognitionStart() {
        this.isListening = true;
        this.chatManager.setVoiceInputActive(true);

        // Add listening indicator
        if (!this.isContinuous) {
            this.chatManager.addMessage('🎤 Listening...', 'system');
        }
    }

    /**
     * Process speech recognition results with S2R-inspired semantic analysis
     */
    onRecognitionResult(event) {
        const results = Array.from(event.results);

        // Get the most confident result
        const finalResult = results.find(result => result.isFinal);
        const interimResult = results[results.length - 1][0].transcript;

        if (finalResult) {
            // Process final result
            const transcript = finalResult[0].transcript.trim();
            const confidence = finalResult[0].confidence;

            console.log(`Voice Recognition (${confidence*100}%): "${transcript}"`);

            this.processVoiceIntent(transcript);
            this.isListening = false;
        } else if (interimResult) {
            // Show interim results for user feedback
            if (!this.isContinuous) {
                this.chatManager.updateInterimTranscript(interimResult);
            }
        }
    }

    onRecognitionEnd() {
        this.isListening = false;
        this.chatManager.setVoiceInputActive(false);

        // Restart continuous listening
        if (this.isContinuous) {
            setTimeout(() => {
                if (this.isContinuous && !this.isListening) {
                    this.startVoiceInput();
                }
            }, 1000); // Brief pause between utterances
        }
    }

    onRecognitionError(event) {
        console.error('Speech recognition error:', event.error);

        let errorMessage = 'Voice recognition error';
        switch (event.error) {
            case 'speech-not-allowed':
                errorMessage = 'Microphone access denied. Please allow microphone access.';
                break;
            case 'network':
                errorMessage = 'Network error during speech recognition.';
                break;
            case 'no-speech':
                errorMessage = 'No speech detected.';
                break;
            case 'aborted':
                errorMessage = 'Speech recognition was aborted.';
                break;
        }

        this.chatManager.addMessage(`🚨 ${errorMessage}`, 'system');
        this.isListening = false;
        this.chatManager.setVoiceInputActive(false);
    }

    // ========== SEMANTIC INTENT PROCESSING (S2R-Inspired) ==========

    /**
     * Process voice input using semantic intent matching (S2R approach)
     */
    processVoiceIntent(transcript) {
        // Normalize input
        const normalizedText = transcript.toLowerCase().trim();

        // Extract intent using semantic similarity matching
        const intent = this.classifyIntent(normalizedText);

        console.log(`Detected Intent: ${intent}`);

        // Process based on intent
        switch (intent) {
            case 'greetings':
                this.handleGreetingIntent(transcript);
                break;
            case 'qualifications':
                this.handleQualificationQuery(transcript);
                break;
            case 'experience':
                this.handleExperienceQuery(transcript);
                break;
            case 'skills':
                this.handleSkillsQuery(transcript);
                break;
            case 'projects':
                this.handleProjectsQuery(transcript);
                break;
            case 'contact':
                this.handleContactQuery(transcript);
                break;
            case 'who_is':
                this.handleWhoIsQuery(transcript);
                break;
            case 'math':
                this.handleMathQuery(transcript);
                break;
            case 'facts':
                this.handleFactsQuery(transcript);
                break;
            case 'help':
                this.handleHelpCommand();
                break;
            case 'stop':
                this.handleStopCommand();
                break;
            default:
                // Fall back to general AI processing
                this.sendToChatbot(transcript);
        }
    }

    /**
     * Classify intent using semantic similarity (S2R-inspired approach)
     */
    classifyIntent(text) {
        const words = text.toLowerCase().split(' ');

        // Check exact matches first (high confidence)
        for (const [intent, keywords] of Object.entries(this.intentMap)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    return intent;
                }
            }
        }

        // Calculate semantic similarity scores
        const scores = {};

        for (const [intent, keywords] of Object.entries(this.intentMap)) {
            scores[intent] = this.calculateSemanticScore(text, keywords, words);
        }

        // Return intent with highest semantic score
        const bestIntent = Object.entries(scores).reduce((a, b) =>
            scores[a[0]] > scores[b[0]] ? a : b
        )[0];

        return scores[bestIntent] > 0.1 ? bestIntent : 'general';
    }

    /**
     * Calculate semantic similarity score for intent classification
     */
    calculateSemanticScore(text, keywords, words) {
        let score = 0;

        // Word overlap scoring
        for (const word of words) {
            for (const keyword of keywords) {
                if (word.includes(keyword) || keyword.includes(word)) {
                    score += 1;
                }
            }
        }

        // Exact phrase matching (higher weight)
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                score += 2;
            }
        }

        return score;
    }

    // ========== INTENT HANDLERS ==========

    handleGreetingIntent(transcript) {
        const greetings = ['Hello!', 'Hi there!', 'Hey!', 'Greetings!'];
        const response = greetings[Math.floor(Math.random() * greetings.length)];
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }

        if (!this.isContinuous) {
            this.sendToChatbot(transcript); // Let AI handle full greeting
        }
    }

    async handleQualificationQuery(transcript) {
        const query = 'highest qualification';
        const response = await this.chatManager.sendMessage(query, false);
        this.chatManager.addMessage(`"${transcript}" → ${query}`, 'user');
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    async handleExperienceQuery(transcript) {
        const query = 'professional experience';
        const response = await this.chatManager.sendMessage(query, false);
        this.chatManager.addMessage(`"${transcript}" → ${query}`, 'user');
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    async handleSkillsQuery(transcript) {
        const query = 'technical skills';
        const response = await this.chatManager.sendMessage(query, false);
        this.chatManager.addMessage(`"${transcript}" → ${query}`, 'user');
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    async handleProjectsQuery(transcript) {
        const query = 'featured projects';
        const response = await this.chatManager.sendMessage(query, false);
        this.chatManager.addMessage(`"${transcript}" → ${query}`, 'user');
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    async handleContactQuery(transcript) {
        const query = 'contact information';
        const response = await this.chatManager.sendMessage(query, false);
        this.chatManager.addMessage(`"${transcript}" → ${query}`, 'user');
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    async handleWhoIsQuery(transcript) {
        this.chatManager.addMessage(`🎤 "${transcript}"`, 'user');
        const response = await this.chatManager.sendMessage(transcript, false);
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    async handleMathQuery(transcript) {
        this.chatManager.addMessage(`🎤 "${transcript}"`, 'user');
        const response = await this.chatManager.sendMessage(transcript, false);
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    async handleFactsQuery(transcript) {
        this.chatManager.addMessage(`🎤 "${transcript}"`, 'user');
        const response = await this.chatManager.sendMessage(transcript, false);
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    handleHelpCommand() {
        const helpText = `
🎤 **Voice Commands Available:**

🔊 **Intent-Based (S2R-Inspired):**
• "What's your highest qualification?" → Portfolio info
• "Tell me about your experience" → Work history
• "What skills do you have?" → Technical skills
• "Show me your projects" → Featured work
• "How can I contact you?" → Contact info

🧠 **General Knowledge:**
• "Who is Elon Musk?" → AI-powered answers
• "Calculate 15 times 7" → Math calculations
• "What's the capital of France?" → Facts

🎯 **Voice Controls:**
• "Help" → This message
• "Stop" → Stop voice mode
• "Start continuous listening" → Hands-free mode

🎵 **Voice Settings:**
• Click microphone to start/stop listening
• Click speaker to toggle voice responses
        `;

        this.chatManager.addMessage(helpText, 'system');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak('Here are the available voice commands for interacting with my portfolio.');
        }
    }

    handleStopCommand() {
        this.stopContinuousListening();

        if (this.chatManager.voiceOutputEnabled) {
            this.speak('Voice mode stopped.');
        }
    }

    async sendToChatbot(text) {
        this.chatManager.addMessage(`🎤 "${text}"`, 'user');
        const response = await this.chatManager.sendMessage(text, false);
        this.chatManager.addMessage(response, 'assistant');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak(response);
        }
    }

    // ========== VOICE OUTPUT METHODS ==========

    /**
     * Speak text using Web Speech Synthesis API
     */
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Stop any current speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice synthesis
        utterance.voice = this.preferredVoice;
        utterance.rate = options.rate || 0.9; // Slightly slower for clarity
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;

        // Clean up chatbot response text for speech
        utterance.text = this.cleanTextForSpeech(text);

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.chatManager.setVoiceOutputActive(true);
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.chatManager.setVoiceOutputActive(false);
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
            this.chatManager.setVoiceOutputActive(false);
        };

        try {
            this.synthesis.speak(utterance);
        } catch (error) {
            console.error('Speech synthesis failed:', error);
        }
    }

    /**
     * Clean text for speech synthesis (remove markdown, emojis, etc.)
     */
    cleanTextForSpeech(text) {
        return text
            .replace(/[#*_`]/g, '') // Remove markdown
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
            .replace(/(\r\n|\n|\r)/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Stop current speech
     */
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.chatManager.setVoiceOutputActive(false);
        }
    }

    /**
     * Toggle voice output on/off
     */
    toggleVoiceOutput() {
        this.chatManager.voiceOutputEnabled = !this.chatManager.voiceOutputEnabled;

        const status = this.chatManager.voiceOutputEnabled ? 'enabled' : 'disabled';
        this.chatManager.addMessage(`🔊 Voice responses ${status}`, 'system');

        if (this.chatManager.voiceOutputEnabled) {
            this.speak('Voice responses enabled');
        }
    }

    // ========== UTILITY METHODS ==========

    /**
     * Get current voice status
     */
    getStatus() {
        return {
            listening: this.isListening,
            continuous: this.isContinuous,
            speaking: this.isSpeaking,
            voiceOutputEnabled: this.chatManager.voiceOutputEnabled,
            speechRecognition: !!this.recognition,
            speechSynthesis: !!this.synthesis,
            voices: this.voices.map(v => ({ name: v.name, lang: v.lang, localService: v.localService }))
        };
    }

    /**
     * Reset voice manager to clean state
     */
    reset() {
        this.stopVoiceInput();
        this.stopSpeaking();
        this.isContinuous = false;
    }

    /**
     * Check if browser supports required voice APIs
     */
    static checkSupport() {
        return {
            speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
            speechSynthesis: !!window.speechSynthesis
        };
    }
}

// Export for module usage
export default VoiceManager;

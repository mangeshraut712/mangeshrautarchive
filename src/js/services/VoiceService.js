/**
 * VoiceService — Encapsulates all browser speech I/O
 *
 * Extracted from ChatUI (script.js) to separate concerns:
 *   - Speech-to-Text  (SpeechRecognition / webkitSpeechRecognition)
 *   - Text-to-Speech  (SpeechSynthesis)
 *
 * Usage:
 *   import { voiceService } from './VoiceService.js';
 *   voiceService.startListening(transcript => console.log(transcript));
 *   voiceService.speak('Hello world');
 */

const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

class VoiceService extends EventTarget {
    constructor() {
        super();

        // TTS state
        this._ttsEnabled = false;
        this._currentUtterance = null;

        // STT state
        this._recognition = null;
        this._isListening = false;
        this._isContinuous = false;
        this._onTranscriptCallback = null;
        this._onInterimCallback = null;

        this._initRecognition();
    }

    // ─────────────────────────────────────────────
    // Capability checks
    // ─────────────────────────────────────────────

    get supportsSpeechInput() {
        return !!SpeechRecognitionAPI;
    }

    get supportsSpeechOutput() {
        return !!window.speechSynthesis;
    }

    get isListening() {
        return this._isListening;
    }

    get isContinuous() {
        return this._isContinuous;
    }

    get ttsEnabled() {
        return this._ttsEnabled;
    }

    // ─────────────────────────────────────────────
    // Text-to-Speech
    // ─────────────────────────────────────────────

    enableTTS() {
        this._ttsEnabled = true;
    }

    disableTTS() {
        this._ttsEnabled = false;
        window.speechSynthesis?.cancel();
    }

    /**
     * Speak a text string via the browser SpeechSynthesis API.
     * @param {string} text
     * @param {{ rate?: number, pitch?: number, volume?: number }} [opts]
     */
    speak(text, opts = {}) {
        if (!this.supportsSpeechOutput || !this._ttsEnabled) return;
        if (!text || typeof text !== 'string') return;

        window.speechSynthesis.cancel(); // stop any current utterance

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = opts.rate ?? 0.9;
        utterance.pitch = opts.pitch ?? 1.0;
        utterance.volume = opts.volume ?? 0.8;

        // Prefer a natural-sounding English voice
        const voices = window.speechSynthesis.getVoices();
        const preferred =
            voices.find(v => v.lang.startsWith('en') && (
                v.name.toLowerCase().includes('natural') ||
                v.name.toLowerCase().includes('human') ||
                v.localService
            )) ||
            voices.find(v => v.lang.startsWith('en'));

        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => this.dispatchEvent(new CustomEvent('tts-start'));
        utterance.onend = () => this.dispatchEvent(new CustomEvent('tts-end'));
        utterance.onerror = (e) => this.dispatchEvent(new CustomEvent('tts-error', { detail: e }));

        this._currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    stopSpeaking() {
        window.speechSynthesis?.cancel();
    }

    // ─────────────────────────────────────────────
    // Speech-to-Text
    // ─────────────────────────────────────────────

    _initRecognition() {
        if (!SpeechRecognitionAPI) return;

        this._recognition = new SpeechRecognitionAPI();
        this._recognition.lang = 'en-US';
        this._recognition.interimResults = true;
        this._recognition.maxAlternatives = 1;

        this._recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            if (interimTranscript && this._onInterimCallback) {
                this._onInterimCallback(interimTranscript);
            }

            if (finalTranscript && this._onTranscriptCallback) {
                this._onTranscriptCallback(finalTranscript.trim());
            }
        };

        this._recognition.onend = () => {
            if (this._isContinuous && this._isListening) {
                // Restart automatically for continuous mode
                try { this._recognition.start(); } catch { /* already started */ }
            } else {
                this._isListening = false;
                this.dispatchEvent(new CustomEvent('listening-stop'));
            }
        };

        this._recognition.onerror = (event) => {
            console.warn('🎤 SpeechRecognition error:', event.error);
            this._isListening = false;
            this.dispatchEvent(new CustomEvent('listening-error', { detail: event.error }));
        };
    }

    /**
     * Start listening for voice input.
     * @param {(transcript: string) => void} onTranscript  Called with final transcript
     * @param {(interim: string) => void}   onInterim      Called with interim results
     * @param {{ continuous?: boolean }}    opts
     */
    startListening(onTranscript, onInterim = null, opts = {}) {
        if (!this.supportsSpeechInput) {
            console.warn('Speech input not supported in this browser.');
            return false;
        }

        if (this._isListening) this.stopListening();

        this._onTranscriptCallback = onTranscript;
        this._onInterimCallback = onInterim;
        this._isContinuous = opts.continuous ?? false;
        this._recognition.continuous = this._isContinuous;

        try {
            this._recognition.start();
            this._isListening = true;
            this.dispatchEvent(new CustomEvent('listening-start'));
            return true;
        } catch (err) {
            console.error('Failed to start recognition:', err);
            return false;
        }
    }

    stopListening() {
        if (!this._recognition || !this._isListening) return;
        this._isContinuous = false;
        this._recognition.stop();
        this._isListening = false;
        this.dispatchEvent(new CustomEvent('listening-stop'));
    }

    toggleListening(onTranscript, onInterim = null, opts = {}) {
        if (this._isListening) {
            this.stopListening();
            return false;
        }
        return this.startListening(onTranscript, onInterim, opts);
    }
}

// ─────────────────────────────────────────────
// Singleton export — import this everywhere
// ─────────────────────────────────────────────
export const voiceService = new VoiceService();

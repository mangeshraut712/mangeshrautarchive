export function initVoiceInput(chatUIInstance, options = {}) {
    const { buttonId = 'portfolio-voice-input', documentRef = document } = options;

    const voiceButton = documentRef.getElementById(buttonId);
    if (!voiceButton || !chatUIInstance) return false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        voiceButton.style.display = 'none';
        return false;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.addEventListener('result', (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript) {
            chatUIInstance.sendMessage(transcript);
        }
    });

    recognition.addEventListener('end', () => {
        voiceButton.classList.remove('recording');
    });

    recognition.addEventListener('error', (error) => {
        console.error('Speech recognition error:', error);
        voiceButton.classList.remove('recording');
        chatUIInstance.notifyAssistant?.('Speech recognition error. Please check microphone permissions and try again.');
    });

    voiceButton.addEventListener('click', () => {
        recognition.start();
        voiceButton.classList.add('recording');
    });

    return true;
}

export default initVoiceInput;

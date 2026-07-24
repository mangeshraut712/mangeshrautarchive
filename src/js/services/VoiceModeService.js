/**
 * AssistMe Voice Mode — ChatGPT / Grok / Gemini-style conversational voice.
 *
 * Modular pipeline for AssistMe Voice Mode (Standard + Google AI Mode style UX):
 *   VAD / Web Speech STT → /api/chat (voice prompt) → OpenRouter TTS via /api/tts
 *
 * Barge-in: tap overlay / End / Escape cancels playback and returns to listening.
 */

import { buildApiUrl } from '../core/chat.js';

const SILENCE_TIMEOUT_MS = 800;
const MIN_TRANSCRIPT_CHARS = 2;
const THINKING_KEYWORDS = [
  "i've determined",
  "i've settled",
  "i've crafted",
  "i'm crafting",
  "i'm processing",
  'let me',
  'i plan to',
  'my response will',
];

function resolveSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function cleanVoiceResponseText(text) {
  if (!text) return '';
  const lower = text.toLowerCase();
  if (THINKING_KEYWORDS.some(k => lower.includes(k))) {
    const quoted = text.match(/"([^"]{5,})"/) || text.match(/'([^']{5,})'/);
    if (quoted?.[1]) return quoted[1].trim();
    return '';
  }
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

class VoiceModeService {
  constructor() {
    this.status = 'idle'; // idle | listening | thinking | speaking
    this.available = null;
    this.ttsAvailable = false;
    this.muted = false;
    this.sessionActive = false;
    this.onStatusChange = null;
    this.onTranscript = null;
    this.onAssistantText = null;
    this.onError = null;
    this.onAudioLevel = null;

    this._recognition = null;
    this._silenceTimer = null;
    this._processing = false;
    this._abortChat = null;
    this._ttsAbort = null;
    this._audioEl = null;
    this._objectUrl = null;
    this._askFn = null;
    this._levelRaf = 0;
    this._mediaStream = null;
    this._audioCtx = null;
    this._analyser = null;
    this._interim = '';
    this._finalBuffer = '';
  }

  async checkAvailability({ force = false } = {}) {
    if (!force && this.available !== null) {
      return this.available;
    }

    const SpeechRecognition = resolveSpeechRecognition();
    const hasSpeech = Boolean(SpeechRecognition && navigator.mediaDevices?.getUserMedia);

    let ttsOk = false;
    try {
      const res = await fetch(buildApiUrl('/api/tts/health'), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const payload = await res.json();
        ttsOk = Boolean(payload?.available);
      }
    } catch {
      ttsOk = false;
    }

    this.ttsAvailable = ttsOk;
    // Voice Mode can run with browser TTS fallback when OpenRouter TTS is down.
    this.available = hasSpeech;
    return this.available;
  }

  setAskHandler(askFn) {
    this._askFn = askFn;
  }

  isActive() {
    return this.sessionActive;
  }

  async startSession() {
    if (this.sessionActive) return;
    const ok = await this.checkAvailability({ force: true });
    if (!ok) {
      throw new Error('Voice Mode needs microphone access and speech recognition.');
    }

    this.sessionActive = true;
    this.muted = false;
    this._finalBuffer = '';
    this._interim = '';
    await this._startListening();
  }

  async stopSession() {
    this.sessionActive = false;
    this._processing = false;
    this._clearSilenceTimer();
    this._stopRecognition();
    this._stopAudioMonitor();
    this._cancelPlayback();
    if (typeof this._abortChat === 'function') {
      this._abortChat();
      this._abortChat = null;
    }
    this._abortTts();
    this._setStatus('idle');
  }

  async toggleSession() {
    if (this.sessionActive) {
      await this.stopSession();
      return false;
    }
    await this.startSession();
    return true;
  }

  setMuted(muted) {
    const next = Boolean(muted);
    this.muted = next;
    if (next) {
      this._clearSilenceTimer();
      this._cancelPlayback();
      this._abortTts();
      this._stopRecognition();
      this._stopAudioMonitor();
      if (this.sessionActive) this._setStatus('listening');
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** ChatGPT-style interrupt: stop speaking and listen again. */
  async interrupt() {
    this._cancelPlayback();
    this._abortTts();
    if (typeof this._abortChat === 'function') {
      this._abortChat();
      this._abortChat = null;
    }
    this._processing = false;
    if (this.sessionActive && !this.muted) {
      await this._startListening();
    }
  }

  _abortTts() {
    if (this._ttsAbort) {
      try {
        this._ttsAbort.abort();
      } catch {
        /* ignore */
      }
      this._ttsAbort = null;
    }
  }

  async _startListening() {
    if (!this.sessionActive || this.muted) {
      this._setStatus(this.sessionActive ? 'listening' : 'idle');
      return;
    }

    const SpeechRecognition = resolveSpeechRecognition();
    if (!SpeechRecognition) {
      this._emitError(new Error('Speech recognition is not supported in this browser.'));
      return;
    }

    this._stopRecognition();
    this._finalBuffer = '';
    this._interim = '';

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this._setStatus('listening');
      void this._startAudioMonitor();
    };

    recognition.onresult = event => {
      if (this.muted || this._processing) return;
      if (this.status === 'speaking') {
        // Barge-in on clear interim speech while assistant is talking.
        const latest = event.results[event.results.length - 1];
        if (latest && !latest.isFinal && (latest[0]?.transcript || '').trim().length >= 3) {
          void this.interrupt();
        }
        return;
      }

      let interim = '';
      let finals = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result[0]?.transcript || '';
        if (result.isFinal) {
          finals += `${piece} `;
        } else {
          interim += piece;
        }
      }

      if (finals.trim()) {
        this._finalBuffer = `${this._finalBuffer} ${finals}`.trim();
        this.onTranscript?.({ text: this._finalBuffer, interim: '', final: false });
        this._armSilenceCommit();
      }

      this._interim = interim.trim();
      if (this._interim) {
        this.onTranscript?.({
          text: this._finalBuffer,
          interim: this._interim,
          final: false,
        });
        this._armSilenceCommit();
      }
    };

    recognition.onerror = event => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        this._emitError(new Error('Microphone permission denied.'));
        void this.stopSession();
        return;
      }
      console.warn('Voice Mode recognition error:', event.error);
    };

    recognition.onend = () => {
      if (this.sessionActive && !this._processing && !this.muted && this.status === 'listening') {
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }
    };

    this._recognition = recognition;
    try {
      recognition.start();
    } catch (error) {
      this._emitError(error);
    }
  }

  _armSilenceCommit() {
    this._clearSilenceTimer();
    this._silenceTimer = setTimeout(() => {
      void this._commitUtterance();
    }, SILENCE_TIMEOUT_MS);
  }

  _clearSilenceTimer() {
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }
  }

  async _commitUtterance() {
    const text = `${this._finalBuffer} ${this._interim}`.trim();
    this._finalBuffer = '';
    this._interim = '';
    this._clearSilenceTimer();

    if (!this.sessionActive || this._processing) return;
    if (text.length < MIN_TRANSCRIPT_CHARS) return;

    this.onTranscript?.({ text, interim: '', final: true });
    await this._processTurn(text);
  }

  async _processTurn(userText) {
    this._processing = true;
    this._stopRecognition();
    this._setStatus('thinking');

    let assistantText = '';
    try {
      if (typeof this._askFn !== 'function') {
        throw new Error('Voice Mode chat handler is not ready.');
      }

      const controller = new AbortController();
      this._abortChat = () => controller.abort();

      const response = await this._askFn(userText, {
        signal: controller.signal,
        context: { mode: 'voice' },
        stream: true,
      });

      if (typeof response === 'string') {
        // Concurrency sentinel / cancelled string — do not speak as an answer.
        throw new Error(response);
      }

      assistantText = response?.answer || response?.content || response?.text || '';
      assistantText = cleanVoiceResponseText(assistantText);

      if (!assistantText) {
        assistantText = "I didn't catch a clear answer. Could you ask that again?";
      }

      this.onAssistantText?.({ text: assistantText, final: true });
      await this._speak(assistantText);
    } catch (error) {
      if (error?.name === 'AbortError') {
        /* interrupted */
      } else {
        console.error('Voice Mode turn failed:', error);
        // Prefer a spoken fallback bubble over a separate error chip + speech.
        const fallback = 'Sorry, I hit a snag. Try asking once more.';
        this.onAssistantText?.({ text: fallback, final: true });
        try {
          await this._speak(fallback);
        } catch {
          /* ignore */
        }
      }
    } finally {
      this._abortChat = null;
      this._processing = false;
      if (this.sessionActive && !this.muted) {
        await this._startListening();
      } else if (this.sessionActive) {
        this._setStatus('listening');
      } else {
        this._setStatus('idle');
      }
    }
  }

  async _speak(text) {
    if (!this.sessionActive || this.muted) return;
    this._setStatus('speaking');

    if (this.ttsAvailable) {
      try {
        await this._speakOpenRouter(text);
        return;
      } catch (error) {
        this._cancelPlayback();
        if (error?.name === 'AbortError') return;
        console.warn('OpenRouter TTS failed, falling back to browser speech:', error);
      }
    }

    if (!this.sessionActive || this.muted) return;
    await this._speakBrowser(text);
  }

  async _speakOpenRouter(text) {
    this._cancelPlayback();
    this._abortTts();
    const controller = new AbortController();
    this._ttsAbort = controller;
    const timeout = AbortSignal.timeout(45000);
    const signal =
      typeof AbortSignal.any === 'function'
        ? AbortSignal.any([controller.signal, timeout])
        : controller.signal;

    const res = await fetch(buildApiUrl('/api/tts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg,application/json',
      },
      body: JSON.stringify({
        text,
        response_format: 'mp3',
      }),
      signal,
    });

    if (!this.sessionActive || controller.signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      if (
        res.status === 402 ||
        res.status === 503 ||
        res.status === 429 ||
        /insufficient credits|payment|billing/i.test(detail)
      ) {
        this.ttsAvailable = false;
      }
      throw new Error(`TTS HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }

    const blob = await res.blob();
    if (!this.sessionActive || controller.signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const url = URL.createObjectURL(blob);
    this._objectUrl = url;

    const audio = new Audio(url);
    this._audioEl = audio;

    await new Promise((resolve, reject) => {
      const onAbort = () => {
        try {
          audio.pause();
        } catch {
          /* ignore */
        }
        reject(new DOMException('Aborted', 'AbortError'));
      };
      controller.signal.addEventListener('abort', onAbort, { once: true });
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch(reject);
      }
    });
  }

  _speakBrowser(text) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  _cancelPlayback() {
    if (this._audioEl) {
      try {
        this._audioEl.pause();
        this._audioEl.src = '';
      } catch {
        /* ignore */
      }
      this._audioEl = null;
    }
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  _stopRecognition() {
    this._clearSilenceTimer();
    if (this._recognition) {
      try {
        this._recognition.onend = null;
        this._recognition.stop();
      } catch {
        /* ignore */
      }
      this._recognition = null;
    }
  }

  async _startAudioMonitor() {
    this._stopAudioMonitor();
    const generation = (this._audioMonitorGen = (this._audioMonitorGen || 0) + 1);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (
        generation !== this._audioMonitorGen ||
        !this.sessionActive ||
        this.muted ||
        this.status !== 'listening'
      ) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      this._mediaStream = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      this._audioCtx = ctx;
      this._analyser = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!this._analyser) return;
        this._analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        this.onAudioLevel?.(Math.min(1, rms * 8));
        this._levelRaf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* level meter optional */
    }
  }

  _stopAudioMonitor() {
    this._audioMonitorGen = (this._audioMonitorGen || 0) + 1;
    if (this._levelRaf) {
      cancelAnimationFrame(this._levelRaf);
      this._levelRaf = 0;
    }
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(t => t.stop());
      this._mediaStream = null;
    }
    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {});
      this._audioCtx = null;
    }
    this._analyser = null;
    this.onAudioLevel?.(0);
  }

  _setStatus(status) {
    this.status = status;
    this.onStatusChange?.(status);
  }

  _emitError(error) {
    this.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

export const voiceModeService = new VoiceModeService();
export default VoiceModeService;

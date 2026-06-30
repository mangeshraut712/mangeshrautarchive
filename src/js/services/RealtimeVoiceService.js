/**
 * Realtime voice sessions through the server-proxied AI Gateway WebSocket.
 * Mirrors the Vercel AI Gateway realtime flow without exposing API keys in-browser.
 */

const TARGET_SAMPLE_RATE = 24000;

function resolveApiBase() {
  const base =
    globalThis.APP_CONFIG?.apiBaseUrl ||
    globalThis.buildConfig?.apiBaseUrl ||
    '';
  if (base) return base.replace(/\/$/, '');
  return window.location.origin;
}

function resolveRealtimeWsUrl(sessionPayload) {
  if (sessionPayload?.wsUrl) {
    return sessionPayload.wsUrl;
  }

  const apiBase = resolveApiBase();
  const url = new URL(apiBase);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/api/realtime/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function pcm16ToAudioBuffer(audioContext, pcmBytes, sampleRate = TARGET_SAMPLE_RATE) {
  const view = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);
  const sampleCount = pcmBytes.byteLength / 2;
  const audioBuffer = audioContext.createBuffer(1, sampleCount, sampleRate);
  const channel = audioBuffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    channel[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return audioBuffer;
}

class RealtimeVoiceService {
  constructor() {
    this.status = 'disconnected';
    this.available = null;
    this.sessionDefaults = null;
    this.ws = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.processor = null;
    this.sourceNode = null;
    this.playbackContext = null;
    this.playbackTime = 0;
    this.assistantTranscript = '';
    this.userTranscript = '';
    this.onStatusChange = null;
    this.onTranscript = null;
    this.onError = null;
  }

  async checkAvailability({ force = false } = {}) {
    if (!force && this.available !== null) {
      return this.available;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.available = false;
      return false;
    }

    try {
      const response = await fetch(`${resolveApiBase()}/api/realtime/health`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) {
        this.available = false;
        return false;
      }
      const payload = await response.json();
      this.available = Boolean(payload.available);
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

  async connect() {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    this._setStatus('connecting');

    const sessionResponse = await fetch(`${resolveApiBase()}/api/realtime/session`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!sessionResponse.ok) {
      this._setStatus('disconnected');
      throw new Error('Realtime voice is not available.');
    }

    const sessionPayload = await sessionResponse.json();
    this.sessionDefaults = sessionPayload.sessionDefaults || {};
    const wsUrl = resolveRealtimeWsUrl(sessionPayload);

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this._setStatus('connected');
        resolve();
      };

      ws.onmessage = event => this._handleServerMessage(event.data);
      ws.onerror = () => {
        const error = new Error('Realtime voice connection failed.');
        this._emitError(error);
        reject(error);
      };
      ws.onclose = () => {
        this._setStatus('disconnected');
        this.stopCapture();
      };
    });
  }

  async startCapture() {
    if (this.status !== 'connected') {
      await this.connect();
    }

    if (this.mediaStream) {
      return;
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioContext = new AudioContext();
    const inputSampleRate = this.audioContext.sampleRate;
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = event => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const downsampled =
        inputSampleRate === TARGET_SAMPLE_RATE
          ? input
          : this._downsample(input, inputSampleRate, TARGET_SAMPLE_RATE);
      const pcm = floatTo16BitPCM(downsampled);
      this._send({
        type: 'input-audio-buffer-append',
        audio: uint8ToBase64(pcm),
      });
    };

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this._setStatus('listening');
  }

  stopCapture() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.status === 'listening') {
      this._setStatus('connected');
    }
  }

  async disconnect() {
    this.stopCapture();
    if (this.playbackContext) {
      await this.playbackContext.close().catch(() => {});
      this.playbackContext = null;
      this.playbackTime = 0;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.assistantTranscript = '';
    this.userTranscript = '';
    this._setStatus('disconnected');
  }

  async toggleLiveSession() {
    if (this.status === 'listening' || this.status === 'connected' || this.status === 'speaking') {
      await this.disconnect();
      return false;
    }

    await this.connect();
    await this.startCapture();
    return true;
  }

  _downsample(buffer, inputRate, outputRate) {
    if (outputRate === inputRate) {
      return buffer;
    }
    const ratio = inputRate / outputRate;
    const outputLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i += 1) {
      result[i] = buffer[Math.min(buffer.length - 1, Math.round(i * ratio))];
    }
    return result;
  }

  _send(event) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(JSON.stringify(event));
  }

  _handleServerMessage(raw) {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const events = Array.isArray(payload) ? payload : [payload];
    events.forEach(event => this._handleServerEvent(event));
  }

  _handleServerEvent(event) {
    if (!event || typeof event !== 'object') {
      return;
    }

    switch (event.type) {
      case 'session-created':
      case 'session-updated':
        this._setStatus(this.mediaStream ? 'listening' : 'connected');
        break;
      case 'input-audio-transcript-delta':
      case 'conversation-item-input-audio-transcription-delta':
        this.userTranscript += event.delta || '';
        this.onTranscript?.({ role: 'user', delta: event.delta || '', text: this.userTranscript });
        break;
      case 'audio-transcript-delta':
        this.assistantTranscript += event.delta || '';
        this.onTranscript?.({
          role: 'assistant',
          delta: event.delta || '',
          text: this.assistantTranscript,
        });
        break;
      case 'response-created':
        this.assistantTranscript = '';
        break;
      case 'input-audio-transcript-done':
      case 'conversation-item-input-audio-transcription-completed':
        if (event.transcript) {
          this.userTranscript = event.transcript;
          this.onTranscript?.({ role: 'user', delta: '', text: this.userTranscript, final: true });
          this.userTranscript = '';
        }
        break;
      case 'audio-transcript-done':
        if (event.transcript) {
          this.assistantTranscript = event.transcript;
          this.onTranscript?.({
            role: 'assistant',
            delta: '',
            text: this.assistantTranscript,
            final: true,
          });
          this.assistantTranscript = '';
        }
        break;
      case 'audio-delta':
        this._enqueueAudio(event.delta);
        this._setStatus('speaking');
        break;
      case 'response-done':
        this._setStatus(this.mediaStream ? 'listening' : 'connected');
        break;
      case 'error':
        this._emitError(new Error(event.message || 'Realtime voice error'));
        break;
      default:
        break;
    }
  }

  _enqueueAudio(base64Audio) {
    if (!base64Audio) {
      return;
    }

    if (!this.playbackContext) {
      this.playbackContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      this.playbackTime = this.playbackContext.currentTime;
    }

    const pcm = base64ToUint8(base64Audio);
    const buffer = pcm16ToAudioBuffer(this.playbackContext, pcm, TARGET_SAMPLE_RATE);
    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.playbackContext.destination);
    const startAt = Math.max(this.playbackContext.currentTime, this.playbackTime);
    source.start(startAt);
    this.playbackTime = startAt + buffer.duration;
  }

  _setStatus(status) {
    this.status = status;
    this.onStatusChange?.(status);
  }

  _emitError(error) {
    this.onError?.(error);
  }
}

export const realtimeVoiceService = new RealtimeVoiceService();
export default RealtimeVoiceService;

/**
 * StreamingService — NDJSON chunk stream handler
 *
 * Extracted from ChatUI (script.js) to separate stream I/O from UI concerns.
 * Consumes the FastAPI /api/chat streaming endpoint, emitting events for each
 * recognised message type so the UI layer can react independently.
 *
 * Usage:
 *   import { streamingService } from './StreamingService.js';
 *
 *   streamingService.on('chunk',    ({ content }) => appendToMessage(content));
 *   streamingService.on('done',     ({ metadata }) => finaliseMessage(metadata));
 *   streamingService.on('typing',   ({ status }) => showTyping(status === 'start'));
 *   streamingService.on('error',    ({ message }) => showError(message));
 *   streamingService.on('abort',    () => showAborted());
 *
 *   const abort = await streamingService.stream('/api/chat', payload);
 *   // call abort() to cancel mid-stream
 */

class StreamingService extends EventTarget {
  constructor() {
    super();
    this._activeController = null;
  }

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  /**
   * Open an NDJSON streaming request to `url` with `payload`.
   * Returns an abort function that can be called to cancel the stream.
   *
   * @param {string} url      Absolute or relative URL (e.g. '/api/chat')
   * @param {object} payload  JSON-serialisable request body
   * @returns {() => void}    Abort function
   */
  async stream(url, payload) {
    // Cancel any in-flight request
    if (this._activeController) {
      this._activeController.abort();
    }

    const controller = new AbortController();
    this._activeController = controller;

    const abort = () => {
      controller.abort();
      this._activeController = null;
      this.dispatchEvent(new CustomEvent('abort'));
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-ndjson, application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!resp.ok) {
        let errMsg = `HTTP ${resp.status}`;
        try {
          const body = await resp.json();
          // Support both { detail: string } and { error: { message } }
          errMsg = body?.error?.message ?? body?.detail ?? errMsg;
        } catch {
          /* ignore parse errors */
        }
        this._emit('error', {
          code: `HTTP_${resp.status}`,
          message: errMsg,
          status: resp.status,
        });
        this._activeController = null;
        return abort;
      }

      await this._consumeStream(resp.body, controller.signal);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Expected — user cancelled
        this._activeController = null;
        return abort;
      }
      this._emit('error', {
        code: 'NETWORK_ERROR',
        message: `Network error: ${err.message}`,
      });
    }

    this._activeController = null;
    return abort;
  }

  get isStreaming() {
    return !!this._activeController;
  }

  cancel() {
    if (this._activeController) {
      this._activeController.abort();
      this._activeController = null;
      this.dispatchEvent(new CustomEvent('abort'));
    }
  }

  // ─────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────

  async _consumeStream(readableBody, signal) {
    const reader = readableBody.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done || signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep the incomplete last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          this._parseLine(trimmed);
        }
      }

      // Flush any remaining bytes
      if (buffer.trim()) {
        this._parseLine(buffer.trim());
      }
    } finally {
      reader.releaseLock();
    }
  }

  _parseLine(line) {
    // Support both plain NDJSON `{...}` and SSE `data: {...}`
    const raw = line.startsWith('data: ') ? line.slice(6) : line;
    if (raw === '[DONE]') return; // SSE sentinel

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('StreamingService: unparseable line:', raw.slice(0, 100));
      return;
    }

    const type = parsed.type ?? 'chunk';

    switch (type) {
      case 'typing':
        this._emit('typing', { status: parsed.status ?? 'start' });
        break;
      case 'chunk':
        this._emit('chunk', {
          content: parsed.content ?? parsed.delta ?? '',
          chunkId: parsed.chunk_id,
        });
        break;
      case 'done':
        this._emit('done', {
          fullContent: parsed.full_content ?? '',
          metadata: parsed.metadata ?? {},
        });
        break;
      case 'error':
        this._emit('error', {
          code: parsed.code ?? 'STREAM_ERROR',
          message: parsed.error ?? parsed.message ?? 'An error occurred',
        });
        break;
      default:
        // Forward unknown types as-is for extensibility
        this._emit(type, parsed);
    }
  }

  _emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Convenience: add a typed event listener.
   * @param {'chunk'|'done'|'typing'|'error'|'abort'} event
   * @param {(detail: any) => void} handler
   */
  on(event, handler) {
    this.addEventListener(event, e => handler(e.detail));
    return this; // chainable
  }

  off(event, handler) {
    this.removeEventListener(event, handler);
    return this;
  }
}

// Singleton export
export const streamingService = new StreamingService();

/**
 * ChatMessage — pure UI component for a single chat bubble
 *
 * Extracted from ChatUI (script.js) to separate message rendering from
 * the orchestrator logic. This component knows only about a single message —
 * it does NOT manage the message list or API calls.
 *
 * Usage:
 *   import { ChatMessage } from './ChatMessage.js';
 *   import { markdownService } from '../services/MarkdownService.js';
 *
 *   const msg = new ChatMessage({
 *     role: 'assistant',
 *     content: '**Hello!** How can I help?',
 *     metadata: { model: 'Grok 4.1 Fast', source: 'OpenRouter' },
 *   });
 *   container.appendChild(msg.render());
 *
 *   // Streaming append
 *   msg.appendChunk(' more text');
 *   msg.finalise({ model: 'Grok 4.1', confidence: 0.95 });
 */

import { markdownService } from '../services/MarkdownService.js';

const ROLE_CONFIG = {
    user: {
        avatarIcon: 'fas fa-user',
        avatarClass: 'user-avatar',
        bubbleClass: 'user-bubble',
        label: 'You',
    },
    assistant: {
        avatarIcon: 'fas fa-robot',
        avatarClass: 'assistant-avatar',
        bubbleClass: 'assistant-bubble',
        label: 'AssistMe',
    },
    system: {
        avatarIcon: 'fas fa-info-circle',
        avatarClass: 'system-avatar',
        bubbleClass: 'system-bubble',
        label: 'System',
    },
};

export class ChatMessage {
    /**
     * @param {{
     *   role: 'user'|'assistant'|'system',
     *   content: string,
     *   metadata?: Record<string, any>,
     *   isStreaming?: boolean,
     *   id?: string,
     * }} opts
     */
    constructor({ role = 'assistant', content = '', metadata = {}, isStreaming = false, id = null } = {}) {
        this.role = role;
        this.content = content;
        this.metadata = metadata;
        this.isStreaming = isStreaming;
        this.id = id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        this._rawText = content;
        this._element = null;
        this._contentEl = null;
        this._metaEl = null;
    }

    // ─────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────

    /** Build and return the DOM element for this message. */
    render() {
        const config = ROLE_CONFIG[this.role] ?? ROLE_CONFIG.assistant;

        const wrapper = document.createElement('div');
        wrapper.className = `chat-message chat-message--${this.role}`;
        wrapper.dataset.messageId = this.id;
        wrapper.setAttribute('role', 'listitem');

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = `chat-avatar ${config.avatarClass}`;
        avatar.setAttribute('aria-hidden', 'true');
        avatar.innerHTML = `<i class="${config.avatarIcon}"></i>`;

        // Bubble
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${config.bubbleClass}`;

        // Content area
        const contentEl = document.createElement('div');
        contentEl.className = 'chat-content';

        if (this.role === 'user') {
            contentEl.textContent = this.content;
        } else {
            contentEl.innerHTML = markdownService.render(this.content);
        }

        if (this.isStreaming) {
            contentEl.classList.add('chat-content--streaming');
        }

        this._contentEl = contentEl;
        bubble.appendChild(contentEl);

        // Metadata (model, source, confidence) — shown for assistant only
        if (this.role === 'assistant' && Object.keys(this.metadata).length) {
            const metaEl = this._buildMetaBadge(this.metadata);
            this._metaEl = metaEl;
            bubble.appendChild(metaEl);
        }

        // Timestamp
        const ts = document.createElement('time');
        ts.className = 'chat-timestamp';
        ts.dateTime = new Date().toISOString();
        ts.textContent = this._formatTime(new Date());
        ts.setAttribute('aria-label', `Sent at ${ts.textContent}`);
        bubble.appendChild(ts);

        if (this.role === 'user') {
            wrapper.appendChild(bubble);
            wrapper.appendChild(avatar);
        } else {
            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);
        }

        this._element = wrapper;
        return wrapper;
    }

    // ─────────────────────────────────────────────
    // Streaming helpers
    // ─────────────────────────────────────────────

    /** Append a text chunk during streaming. */
    appendChunk(chunk) {
        if (!chunk) return;
        this._rawText += chunk;
        if (this._contentEl) {
            this._contentEl.innerHTML = markdownService.render(this._rawText);
        }
    }

    /** Mark streaming as complete and set final metadata. */
    finalise(metadata = {}) {
        this.isStreaming = false;
        this.metadata = { ...this.metadata, ...metadata };

        if (this._contentEl) {
            this._contentEl.classList.remove('chat-content--streaming');
            this._contentEl.innerHTML = markdownService.render(this._rawText);
        }

        if (this._element && Object.keys(this.metadata).length) {
            const existingMeta = this._element.querySelector('.chat-meta');
            const newMeta = this._buildMetaBadge(this.metadata);
            this._metaEl = newMeta;
            const bubble = this._element.querySelector(`.chat-bubble`);
            if (bubble) {
                if (existingMeta) existingMeta.replaceWith(newMeta);
                else {
                    const ts = bubble.querySelector('.chat-timestamp');
                    if (ts) bubble.insertBefore(newMeta, ts);
                    else bubble.appendChild(newMeta);
                }
            }
        }
    }

    /** Update the text content (for edits or corrections). */
    update(newContent) {
        this._rawText = newContent;
        this.content = newContent;
        if (this._contentEl) {
            if (this.role === 'user') {
                this._contentEl.textContent = newContent;
            } else {
                this._contentEl.innerHTML = markdownService.render(newContent);
            }
        }
    }

    get element() { return this._element; }
    get text() { return this._rawText; }

    // ─────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────

    _buildMetaBadge(meta) {
        const el = document.createElement('div');
        el.className = 'chat-meta';
        el.setAttribute('aria-label', 'Response metadata');

        const parts = [];
        if (meta.model) parts.push(`<span class="chat-meta__model">${this._esc(meta.model)}</span>`);
        if (meta.source) parts.push(`<span class="chat-meta__source">${this._esc(meta.source)}</span>`);
        if (meta.confidence) parts.push(`<span class="chat-meta__confidence">${Math.round(meta.confidence * 100)}%</span>`);
        if (meta.runtime) parts.push(`<span class="chat-meta__runtime">${this._esc(meta.runtime)}</span>`);

        el.innerHTML = parts.join('<span class="chat-meta__sep">·</span>');
        return el;
    }

    _formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    _esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

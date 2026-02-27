/**
 * TypingIndicator — animated "AI is thinking" bubble
 *
 * Extracted from ChatUI (script.js) to an isolated, reusable component.
 * Renders the three-dot bouncing animation that shows while the backend
 * streams its response. Supports accessibility via aria-live.
 *
 * Usage:
 *   import { typingIndicator } from './TypingIndicator.js';
 *
 *   chatContainer.appendChild(typingIndicator.element);
 *   typingIndicator.show();   // make visible + announce to screen readers
 *   typingIndicator.hide();   // remove from view
 *   typingIndicator.toggle(); // flip visibility
 */

class TypingIndicator {
    constructor() {
        this._element = this._build();
        this._visible = false;
    }

    // ─────────────────────────────────────────────
    // DOM
    // ─────────────────────────────────────────────

    _build() {
        const wrapper = document.createElement('div');
        wrapper.className = 'typing-indicator';
        wrapper.setAttribute('role', 'status');
        wrapper.setAttribute('aria-live', 'polite');
        wrapper.setAttribute('aria-label', 'AssistMe is thinking');
        wrapper.hidden = true;

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar assistant-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.innerHTML = '<i class="fas fa-robot"></i>';

        // Bubble + dots
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble assistant-bubble typing-indicator__bubble';

        const dotsWrapper = document.createElement('div');
        dotsWrapper.className = 'typing-dots';
        dotsWrapper.setAttribute('aria-hidden', 'true');

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'typing-dot';
            dotsWrapper.appendChild(dot);
        }

        // Screen-reader text
        const srText = document.createElement('span');
        srText.className = 'sr-only';
        srText.textContent = 'AssistMe is typing…';

        bubble.appendChild(dotsWrapper);
        bubble.appendChild(srText);

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);

        return wrapper;
    }

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /** The DOM node — append this to your chat container once. */
    get element() {
        return this._element;
    }

    get isVisible() {
        return this._visible;
    }

    show() {
        if (this._visible) return;
        this._element.hidden = false;
        this._visible = true;
        // Scroll into view so the indicator is always visible
        this._element.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    hide() {
        if (!this._visible) return;
        this._element.hidden = true;
        this._visible = false;
    }

    toggle() {
        if (this._visible) this.hide();
        else this.show();
    }
}

// Singleton — the page should have one typing indicator
export const typingIndicator = new TypingIndicator();

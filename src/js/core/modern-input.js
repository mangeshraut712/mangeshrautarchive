/**
 * Modern Chatbot Input Handler (2026)
 * Ultra-fast, zero-lag input with latest web technologies
 */

export class ModernInputHandler {
    constructor(inputElement, onSubmit) {
        this.input = inputElement;
        this.onSubmit = onSubmit;
        this.composing = false;

        this._setupModernInput();
    }

    _setupModernInput() {
        if (!this.input) return;

        // Remove ALL old event listeners by cloning
        const newInput = this.input.cloneNode(true);
        this.input.parentNode.replaceChild(newInput, this.input);
        this.input = newInput;

        // Modern composition handling (for IME, emoji keyboards, etc.)
        this.input.addEventListener('compositionstart', () => {
            this.composing = true;
        }, { passive: true });

        this.input.addEventListener('compositionend', () => {
            this.composing = false;
        }, { passive: true });

        // Ultra-fast keyboard handling with modern event delegation
        this.input.addEventListener('keydown', (e) => {
            // Don't interfere during composition (IME input)
            if (this.composing) return;

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submit();
            }
        }, { passive: false });

        // Optimize input performance
        this._optimizeInput();
    }

    _optimizeInput() {
        // Modern CSS containment for better rendering performance
        this.input.style.contain = 'layout style paint';

        // Ensure no conflicting styles
        this.input.style.userSelect = 'text';
        this.input.style.pointerEvents = 'auto';
        this.input.style.touchAction = 'manipulation';

        // Remove any transform/filter that might cause issues
        this.input.style.transform = 'none';
        this.input.style.filter = 'none';

        // Ensure proper stacking
        this.input.style.position = 'relative';
        this.input.style.zIndex = '1';

        // Auto-resize for textarea
        if (this.input.tagName === 'TEXTAREA') {
            this.input.addEventListener('input', () => {
                this.input.style.height = 'auto';
                this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
            }, { passive: true });
        }

        // Ensure text input works properly
        this.input.addEventListener('keypress', (e) => {
            // Allow all printable characters including space
            if (e.key === ' ' || e.keyCode === 32) {
                // Space is allowed
                return true;
            }
        }, { passive: true });
    }

    submit() {
        const value = this.input.value.trim();
        if (value && this.onSubmit) {
            this.onSubmit(value);
            this.clear();
        }
    }

    clear() {
        this.input.value = '';
        this.input.style.height = 'auto';
    }

    focus() {
        this.input.focus();
    }

    getValue() {
        return this.input.value;
    }

    setValue(value) {
        this.input.value = value;
    }
}

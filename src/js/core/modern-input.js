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
    this.input.addEventListener(
      'compositionstart',
      () => {
        this.composing = true;
      },
      { passive: true }
    );

    this.input.addEventListener(
      'compositionend',
      () => {
        this.composing = false;
      },
      { passive: true }
    );

    // Ultra-fast keyboard handling with modern event delegation
    this.input.addEventListener(
      'keydown',
      e => {
        // Don't interfere during composition (IME input)
        if (this.composing) return;

        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.submit();
        }
      },
      { passive: false }
    );

    // Optimize input performance
    this._optimizeInput();
  }

  _optimizeInput() {
    // Modern CSS containment for better rendering performance and optimization
    this.input.style.cssText = `
      contain: layout style paint;
      user-select: text;
      pointer-events: auto;
      touch-action: manipulation;
      transform: none;
      filter: none;
      position: relative;
      z-index: 1;
    `.trim().replace(/\s+/g, ' ');

    // Auto-resize for textarea
    if (this.input.tagName === 'TEXTAREA') {
      this.input.addEventListener(
        'input',
        () => {
          const baseStyle = this.input.getAttribute('style') || '';
          this.input.style.cssText = `${baseStyle}; height: auto;`;
          const newHeight = Math.min(this.input.scrollHeight, 120);
          this.input.style.cssText = `${baseStyle}; height: ${newHeight}px;`;
        },
        { passive: true }
      );
    }

    // Ensure text input works properly
    this.input.addEventListener(
      'keypress',
      e => {
        // Allow all printable characters including space
        if (e.key === ' ' || e.keyCode === 32) {
          // Space is allowed
          return true;
        }
      },
      { passive: true }
    );
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

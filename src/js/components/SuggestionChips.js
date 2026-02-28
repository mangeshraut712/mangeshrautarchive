/**
 * SuggestionChips — contextual conversation starters
 *
 * Extracted from ChatUI (script.js) to an isolated, reusable component.
 * Renders a horizontal row of clickable suggestion chips below the chat input.
 * Chips are context-aware: they change depending on the current portfolio section
 * or the last assistant response.
 *
 * Usage:
 *   import { suggestionChips } from './SuggestionChips.js';
 *
 *   chatContainer.appendChild(suggestionChips.element);
 *   suggestionChips.show(['Tell me about projects', 'Download resume']);
 *   suggestionChips.onSelect(text => chatInput.value = text);
 *   suggestionChips.hide();
 */

// Context-aware suggestion sets keyed by section / intent
const SUGGESTION_SETS = {
  default: [
    '👋 Who is Mangesh?',
    '🛠️ What are his skills?',
    '💼 Show me his experience',
    '📁 What projects has he built?',
    '📄 Download resume',
    '📬 How do I contact him?',
  ],
  projects: [
    '📁 Show all projects',
    '🛠️ Which projects use Python?',
    '🌐 Any web apps?',
    '🤖 Any AI/ML projects?',
    '⭐ Most starred repos',
  ],
  experience: [
    '💼 Current role?',
    '📈 Key achievements?',
    '🏢 Previous companies?',
    '🎓 Education background?',
    '☁️ Cloud experience?',
  ],
  skills: [
    '🐍 Python expertise?',
    '☕ Java projects?',
    '⚛️ React experience?',
    '☁️ AWS certifications?',
    '🤖 ML frameworks used?',
  ],
  contact: [
    '📧 What is his email?',
    '🔗 LinkedIn profile?',
    '📍 Location?',
    '🕐 Best time to reach out?',
    '📄 Download resume',
  ],
};

class SuggestionChips {
  constructor() {
    this._element = this._build();
    this._selectCallback = null;
    this._visible = false;
  }

  // ─────────────────────────────────────────────
  // DOM
  // ─────────────────────────────────────────────

  _build() {
    const wrapper = document.createElement('div');
    wrapper.className = 'suggestion-chips';
    wrapper.setAttribute('role', 'list');
    wrapper.setAttribute('aria-label', 'Suggested questions');
    wrapper.hidden = true;
    return wrapper;
  }

  _createChip(text) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-chip';
    btn.setAttribute('role', 'listitem');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      if (this._selectCallback) this._selectCallback(text);
      this.hide();
    });
    return btn;
  }

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  get element() {
    return this._element;
  }
  get isVisible() {
    return this._visible;
  }

  /**
   * Register a callback invoked when the user clicks a chip.
   * @param {(text: string) => void} callback
   */
  onSelect(callback) {
    this._selectCallback = callback;
    return this; // chainable
  }

  /**
   * Show a specific list of suggestions.
   * @param {string[]} suggestions
   */
  show(suggestions = []) {
    this._element.innerHTML = '';
    suggestions.slice(0, 6).forEach(text => {
      this._element.appendChild(this._createChip(text));
    });
    this._element.hidden = false;
    this._visible = true;
  }

  /**
   * Show context-aware suggestions for a named section.
   * @param {'default'|'projects'|'experience'|'skills'|'contact'} context
   */
  showForContext(context = 'default') {
    const set = SUGGESTION_SETS[context] ?? SUGGESTION_SETS.default;
    this.show(set);
  }

  hide() {
    this._element.hidden = true;
    this._visible = false;
  }

  toggle(suggestions) {
    if (this._visible) this.hide();
    else this.show(suggestions);
  }

  /**
   * Infer context from a URL hash or section name and show matching suggestions.
   * @param {string} [sectionHint]  e.g. '#projects', 'skills', 'contact'
   */
  showForSection(sectionHint = '') {
    const s = sectionHint.replace('#', '').toLowerCase();
    const key = Object.keys(SUGGESTION_SETS).find(k => s.includes(k)) ?? 'default';
    this.showForContext(key);
  }
}

// Singleton export
export const suggestionChips = new SuggestionChips();
export { SUGGESTION_SETS };

/**
 * Smart Text Selection Floating Action Bar (iOS / Apple Glass Style)
 * Automatically presents a floating micro-toolbar when text or sentences are selected across
 * the portfolio, enabling one-tap Copy, Audio Reading (TTS), and Marathi Translation.
 */

import { showCopyToast } from './quick-copy.js';

let toolbarEl = null;
let activeSelectionText = '';

function createSelectionToolbar() {
  if (toolbarEl || typeof document === 'undefined') return toolbarEl;

  toolbarEl = document.createElement('div');
  toolbarEl.id = 'selection-floating-toolbar';
  toolbarEl.className = 'selection-floating-toolbar';
  toolbarEl.setAttribute('role', 'toolbar');
  toolbarEl.setAttribute('aria-label', 'Text selection actions');
  toolbarEl.hidden = true;

  toolbarEl.innerHTML = `
    <button type="button" class="selection-action-btn action-copy" aria-label="Copy selected text" title="Copy selection (⌘C)">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
      <span>Copy</span>
    </button>
    <div class="selection-action-divider" aria-hidden="true"></div>
    <button type="button" class="selection-action-btn action-speak" aria-label="Read selected text aloud" title="Speak selection">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <span>Speak</span>
    </button>
  `;

  document.body.appendChild(toolbarEl);

  const copyBtn = toolbarEl.querySelector('.action-copy');
  copyBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeSelectionText) return;

    navigator.clipboard
      ?.writeText(activeSelectionText)
      .then(() => {
        showCopyToast(
          activeSelectionText.length > 30
            ? `Copied selection: "${activeSelectionText.slice(0, 27)}..."`
            : `Copied: "${activeSelectionText}"`
        );
        hideSelectionToolbar();
      })
      .catch(() => {
        showCopyToast('Copied to clipboard');
        hideSelectionToolbar();
      });
  });

  const speakBtn = toolbarEl.querySelector('.action-speak');
  speakBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeSelectionText) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeSelectionText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      showCopyToast('Speaking selection...');
    }
  });

  return toolbarEl;
}

export function hideSelectionToolbar() {
  if (toolbarEl && !toolbarEl.hidden) {
    toolbarEl.classList.remove('is-visible');
    toolbarEl.hidden = true;
    activeSelectionText = '';
  }
}

export function handleSelectionChange() {
  if (typeof window === 'undefined') return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) {
    hideSelectionToolbar();
    return;
  }

  const text = selection.toString().trim();
  if (!text || text.length < 2) {
    hideSelectionToolbar();
    return;
  }

  // Do not show toolbar if selecting inside inputs, textareas, or chatbot composer
  const activeEl = document.activeElement;
  if (
    activeEl &&
    (activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable ||
      activeEl.closest('#chatbot-card'))
  ) {
    hideSelectionToolbar();
    return;
  }

  activeSelectionText = text;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (!rect || (rect.width === 0 && rect.height === 0)) {
    hideSelectionToolbar();
    return;
  }

  const toolbar = createSelectionToolbar();
  if (!toolbar) return;

  toolbar.hidden = false;
  const toolbarWidth = 140;
  const toolbarHeight = 36;

  // Position above the selection center, bounded within viewport
  let left = rect.left + rect.width / 2 - toolbarWidth / 2;
  left = Math.max(12, Math.min(window.innerWidth - toolbarWidth - 12, left));

  let top = rect.top + window.scrollY - toolbarHeight - 10;
  if (rect.top < 50) {
    // If too close to viewport top, position below selection
    top = rect.bottom + window.scrollY + 10;
  }

  toolbar.style.top = `${top}px`;
  toolbar.style.left = `${left}px`;
  requestAnimationFrame(() => {
    toolbar.classList.add('is-visible');
  });
}

export function initTextSelectionToolbar() {
  if (typeof document === 'undefined') return;

  document.addEventListener('mouseup', () => {
    setTimeout(handleSelectionChange, 10);
  });

  document.addEventListener('keyup', e => {
    if (['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      setTimeout(handleSelectionChange, 10);
    }
  });

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideSelectionToolbar();
    }
  });

  document.addEventListener('scroll', hideSelectionToolbar, { passive: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextSelectionToolbar);
  } else {
    initTextSelectionToolbar();
  }
}

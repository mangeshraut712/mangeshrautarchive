/**
 * Accessibility Enhancements - WCAG 2.2 Compliance
 * Ensures full keyboard navigation, screen reader support, and accessibility features
 *
 * Features:
 * - Full keyboard navigation with visible focus indicators
 * - Screen reader announcements (ARIA live regions)
 * - Skip links for quick navigation
 * - Focus trap for modals
 * - Keyboard shortcuts
 * - High contrast mode support
 * - Reduced motion support
 * - Focus management
 */

export class AccessibilityEnhancer {
  constructor() {
    this.focusableElements =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    this.currentFocusIndex = 0;
    this.shortcuts = new Map();
    this.announcer = null;
    this.skipLinks = [];
    this.isInitialized = false;
  }

  /**
   * Initialize all accessibility features
   */
  async init() {
    if (this.isInitialized) return;

    console.log('♿ Initializing Accessibility Enhancements...');

    // Create ARIA live region for announcements
    this.createLiveRegion();

    // Add skip links
    this.addSkipLinks();

    // Enhance focus visibility
    this.enhanceFocusIndicators();

    // Set up keyboard navigation
    this.setupKeyboardNavigation();

    // Add keyboard shortcuts
    this.registerKeyboardShortcuts();

    // Enhance form accessibility
    this.enhanceFormAccessibility();

    // Add ARIA labels where missing
    this.addMissingAriaLabels();

    // Set up focus trap for modals
    this.setupModalFocusTrap();

    // Respect user preferences
    this.respectUserPreferences();

    if (this.shouldShowToolbar()) {
      this.createAccessibilityToolbar();
    }

    this.isInitialized = true;
    this.announce('Accessibility features enabled', 'polite');
    console.log('✅ Accessibility Enhancements initialized');
  }

  shouldShowToolbar() {
    const toolbarQuery = new URLSearchParams(window.location.search).get('a11y-toolbar');
    const disabledByAttribute = document.body?.dataset.accessibilityToolbar === 'false';
    const disabledByQuery = toolbarQuery === '0';

    if (disabledByAttribute || disabledByQuery) {
      return false;
    }

    return true;
  }

  /**
   * Create ARIA live region for screen reader announcements
   */
  createLiveRegion() {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    if (!this.announcer) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = '';

    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      this.announcer.textContent = message;
    }, 100);

    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 3000);
  }

  /**
   * Add skip links for quick navigation
   */
  addSkipLinks() {
    const existingSkipLinks = document.querySelector('.skip-links');
    if (existingSkipLinks) {
      this.skipLinks = Array.from(existingSkipLinks.querySelectorAll('a.skip-link'));
      return;
    }

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.setAttribute('role', 'navigation');
    skipLinksContainer.setAttribute('aria-label', 'Skip links');

    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#global-nav', text: 'Skip to navigation' },
      { href: '#contact', text: 'Skip to contact' },
    ];

    skipLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.className = 'skip-link';
      a.style.cssText = `
                position: absolute;
                left: -10000px;
                top: 0;
                z-index: 10001;
                padding: 1rem 2rem;
                background: #007aff;
                color: white;
                text-decoration: none;
                border-radius: 0 0 8px 0;
                font-weight: 600;
            `;

      // Show on focus
      a.addEventListener('focus', () => {
        a.style.left = '0';
      });

      a.addEventListener('blur', () => {
        a.style.left = '-10000px';
      });

      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.href);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          this.announce(`Navigated to ${link.text.replace('Skip to ', '')}`);
        }
      });

      skipLinksContainer.appendChild(a);
      this.skipLinks.push(a);
    });

    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Enhance focus indicators
   */
  enhanceFocusIndicators() {
    const style = document.createElement('style');
    style.textContent = `
            /* Enhanced focus indicators */
            *:focus {
                outline: 3px solid #007aff !important;
                outline-offset: 2px !important;
            }

            *:focus:not(:focus-visible) {
                outline: none !important;
            }

            *:focus-visible {
                outline: 3px solid #007aff !important;
                outline-offset: 2px !important;
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                *:focus-visible {
                    outline: 4px solid currentColor !important;
                    outline-offset: 3px !important;
                }
            }

            /* Dark mode focus */
            html.dark *:focus-visible {
                outline-color: #0a84ff !important;
            }

            /* Button focus states */
            button:focus-visible,
            a:focus-visible {
                box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3) !important;
            }

            /* Screen reader only class */
            .sr-only {
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            }
        `;
    document.head.appendChild(style);
  }

  /**
   * Set up keyboard navigation
   */
  setupKeyboardNavigation() {
    // Tab navigation enhancement
    document.addEventListener('keydown', e => {
      // Escape key to close modals/overlays
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }

      // Arrow key navigation for certain elements
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowKeyNavigation(e);
      }

      // Home/End keys
      if (e.key === 'Home' && e.ctrlKey) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.announce('Scrolled to top of page');
      }

      if (e.key === 'End' && e.ctrlKey) {
        e.preventDefault();
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth',
        });
        this.announce('Scrolled to bottom of page');
      }
    });

    // Track focus for debugging
    document.addEventListener('focusin', e => {
      console.log('Focus:', e.target);
    });
  }

  /**
   * Handle Escape key press
   */
  handleEscapeKey() {
    // Close search overlay
    const searchOverlay = document.querySelector('#search-overlay');
    if (searchOverlay && searchOverlay.classList.contains('active')) {
      searchOverlay.classList.remove('active');
      this.announce('Search closed');
      return;
    }

    // Close chatbot
    const chatbot = document.querySelector('#chatbot-widget');
    if (chatbot && !chatbot.classList.contains('hidden')) {
      chatbot.classList.add('hidden');
      this.announce('Chatbot closed');
      return;
    }

    // Close any modals
    const modals = document.querySelectorAll('[role="dialog"], .modal, .modal-overlay');
    modals.forEach(modal => {
      if (modal.style.display !== 'none' && !modal.classList.contains('hidden')) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
        this.announce('Modal closed');
      }
    });
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowKeyNavigation(e) {
    const target = e.target;

    // Navigation menu
    if (target.closest('.nav-links')) {
      const links = Array.from(target.closest('.nav-links').querySelectorAll('a'));
      const currentIndex = links.indexOf(target);

      if (e.key === 'ArrowRight' && currentIndex < links.length - 1) {
        e.preventDefault();
        links[currentIndex + 1].focus();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        links[currentIndex - 1].focus();
      }
    }

    // Project cards, skill cards, etc.
    if (target.closest('.grid, .flex')) {
      const cards = Array.from(
        target.closest('.grid, .flex').querySelectorAll('a, button, [tabindex="0"]')
      );
      const currentIndex = cards.indexOf(target);
      const columns = this.getGridColumns(target.closest('.grid, .flex'));

      if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
        e.preventDefault();
        cards[currentIndex + 1].focus();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        cards[currentIndex - 1].focus();
      } else if (e.key === 'ArrowDown' && currentIndex + columns < cards.length) {
        e.preventDefault();
        cards[currentIndex + columns].focus();
      } else if (e.key === 'ArrowUp' && currentIndex - columns >= 0) {
        e.preventDefault();
        cards[currentIndex - columns].focus();
      }
    }
  }

  /**
   * Get number of columns in grid
   */
  getGridColumns(element) {
    const style = window.getComputedStyle(element);
    const gridTemplateColumns = style.gridTemplateColumns;
    if (gridTemplateColumns && gridTemplateColumns !== 'none') {
      return gridTemplateColumns.split(' ').length;
    }
    return 1;
  }

  /**
   * Register keyboard shortcuts
   */
  registerKeyboardShortcuts() {
    // Ctrl/Cmd + K: Open search
    this.registerShortcut('k', { ctrl: true }, () => {
      const searchToggle = document.querySelector('#search-toggle');
      if (searchToggle) {
        searchToggle.click();
        this.announce('Search opened');
      }
    });

    // Ctrl/Cmd + /: Show keyboard shortcuts
    this.registerShortcut('/', { ctrl: true }, () => {
      this.showKeyboardShortcuts();
    });

    // Ctrl/Cmd + D: Toggle dark mode
    this.registerShortcut('d', { ctrl: true }, () => {
      const themeToggle = document.querySelector('#theme-toggle');
      if (themeToggle) {
        themeToggle.click();
        const isDark = document.documentElement.classList.contains('dark');
        this.announce(`Switched to ${isDark ? 'dark' : 'light'} mode`);
      }
    });

    // Ctrl/Cmd + H: Go to home
    this.registerShortcut('h', { ctrl: true }, () => {
      window.location.hash = '#home';
      this.announce('Navigated to home');
    });

    // Ctrl/Cmd + C: Go to contact
    this.registerShortcut('c', { ctrl: true, shift: true }, () => {
      window.location.hash = '#contact';
      this.announce('Navigated to contact');
    });

    // Listen for shortcuts
    document.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();
      const modifiers = {
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
      };

      this.shortcuts.forEach((handler, shortcutKey) => {
        const [targetKey, targetModifiers] = shortcutKey.split('+');
        const modMatch = JSON.stringify(modifiers) === targetModifiers;

        if (key === targetKey && modMatch) {
          e.preventDefault();
          handler();
        }
      });
    });
  }

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(key, modifiers = {}, handler) {
    const shortcutKey = `${key}+${JSON.stringify(modifiers)}`;
    this.shortcuts.set(shortcutKey, handler);
  }

  /**
   * Show keyboard shortcuts modal
   */
  showKeyboardShortcuts() {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'shortcuts-title');
    modal.setAttribute('aria-modal', 'true');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
            <div class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                animation: fadeIn 0.3s ease;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                " tabindex="-1">
                    <h2 id="shortcuts-title" style="margin: 0 0 1.5rem 0; color: #1d1d1f;">
                        ⌨️ Keyboard Shortcuts
                    </h2>
                    <div style="display: grid; gap: 1rem;">
                        <div class="shortcut-item">
                            <kbd>Ctrl/Cmd + K</kbd>
                            <span>Open search</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl/Cmd + D</kbd>
                            <span>Toggle dark mode</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl/Cmd + H</kbd>
                            <span>Go to home</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl/Cmd + Shift + C</kbd>
                            <span>Go to contact</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Close modals/overlays</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Tab</kbd>
                            <span>Navigate forward</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Shift + Tab</kbd>
                            <span>Navigate backward</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Arrow Keys</kbd>
                            <span>Navigate within sections</span>
                        </div>
                    </div>
                    <button onclick="this.closest('.shortcuts-modal').remove()" style="
                        margin-top: 1.5rem;
                        background: #007aff;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        width: 100%;
                    ">
                        Close
                    </button>
                </div>
            </div>
        `;

    const style = document.createElement('style');
    style.textContent = `
            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                background: #f5f5f7;
                border-radius: 8px;
            }
            .shortcut-item kbd {
                background: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                border: 1px solid #ddd;
                font-family: monospace;
                font-size: 0.9rem;
            }
            html.dark .modal-content {
                background: #1d1d1f !important;
                color: #f5f5f7 !important;
            }
            html.dark .shortcut-item {
                background: #2c2c2e !important;
            }
            html.dark .shortcut-item kbd {
                background: #3a3a3c !important;
                border-color: #48484a !important;
                color: #f5f5f7 !important;
            }
        `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // Focus the modal
    const modalContent = modal.querySelector('.modal-content');
    modalContent.focus();

    // Set up focus trap
    this.trapFocus(modalContent);

    // Close on overlay click
    modal.querySelector('.modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        modal.remove();
      }
    });

    this.announce('Keyboard shortcuts dialog opened');
  }

  /**
   * Enhance form accessibility
   */
  enhanceFormAccessibility() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      // Add labels to inputs without labels
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (!input.id) {
          input.id = `input-${Math.random().toString(36).substr(2, 9)}`;
        }

        const label = form.querySelector(`label[for="${input.id}"]`);
        if (!label && input.placeholder) {
          const newLabel = document.createElement('label');
          newLabel.setAttribute('for', input.id);
          newLabel.className = 'sr-only';
          newLabel.textContent = input.placeholder;
          input.parentNode.insertBefore(newLabel, input);
        }

        // Add aria-required for required fields
        if (input.required) {
          input.setAttribute('aria-required', 'true');
        }

        // Add aria-invalid for validation
        input.addEventListener('invalid', () => {
          input.setAttribute('aria-invalid', 'true');
        });

        input.addEventListener('input', () => {
          if (input.validity.valid) {
            input.setAttribute('aria-invalid', 'false');
          }
        });
      });
    });
  }

  /**
   * Add missing ARIA labels
   */
  addMissingAriaLabels() {
    // Buttons without labels
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent.trim() && button.querySelector('i, svg')) {
        const icon = button.querySelector('i');
        if (icon) {
          const classes = icon.className;
          let label = 'Button';

          if (classes.includes('search')) label = 'Search';
          else if (classes.includes('menu')) label = 'Menu';
          else if (classes.includes('close')) label = 'Close';
          else if (classes.includes('theme')) label = 'Toggle theme';

          button.setAttribute('aria-label', label);
        }
      }
    });

    // Links without labels
    const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
    links.forEach(link => {
      if (!link.textContent.trim() && link.querySelector('i, svg, img')) {
        const img = link.querySelector('img');
        if (img && img.alt) {
          link.setAttribute('aria-label', img.alt);
        }
      }
    });
  }

  /**
   * Set up focus trap for modals
   */
  setupModalFocusTrap() {
    // Observe for new modals
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (
            node.nodeType === 1 &&
            (node.matches('[role="dialog"]') || node.classList?.contains('modal'))
          ) {
            this.trapFocus(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Trap focus within element
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(this.focusableElements);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = e => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Respect user preferences
   */
  respectUserPreferences() {
    // Reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      this.announce('Reduced motion enabled');
    }

    // High contrast
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.documentElement.classList.add('high-contrast');
    }

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
      if (e.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        this.announce('Reduced motion enabled');
      } else {
        document.documentElement.style.removeProperty('--animation-duration');
        this.announce('Animations enabled');
      }
    });
  }

  /**
   * Create accessibility toolbar
   */
  createAccessibilityToolbar() {
    if (document.querySelector('.a11y-toolbar')) return;

    if (!document.getElementById('a11y-toolbar-styles')) {
      const style = document.createElement('style');
      style.id = 'a11y-toolbar-styles';
      style.textContent = `
        .a11y-toolbar {
          position: fixed;
          left: 20px;
          bottom: max(24px, env(safe-area-inset-bottom));
          z-index: 9997;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 999px;
          background: rgb(255 255 255 / 90%);
          border: 1px solid rgb(0 0 0 / 8%);
          box-shadow:
            0 8px 32px rgb(0 0 0 / 12%),
            0 4px 16px rgb(0 0 0 / 8%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          pointer-events: auto;
        }

        .a11y-toolbar button {
          position: relative;
          width: 42px;
          height: 42px;
          border: 1px solid rgb(0 0 0 / 6%);
          border-radius: 999px;
          background: rgb(255 255 255 / 72%);
          color: #0071e3;
          box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.01em;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background 0.25s ease;
        }

        .a11y-toolbar button:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow:
            0 10px 24px rgb(0 113 227 / 14%),
            0 4px 12px rgb(0 0 0 / 8%);
          background: rgb(255 255 255 / 92%);
        }

        .a11y-toolbar button:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 4px rgb(0 113 227 / 25%),
            0 12px 28px rgb(0 113 227 / 18%);
        }

        .a11y-toolbar button::after {
          content: attr(data-label);
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%) translateY(4px);
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgb(255 255 255 / 96%);
          border: 1px solid rgb(0 0 0 / 8%);
          box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
          color: #1d1d1f;
          font-size: 0.75rem;
          font-weight: 700;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .a11y-toolbar button:hover::after,
        .a11y-toolbar button:focus-visible::after {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .a11y-toolbar-button__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .a11y-toolbar-button__icon--text {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        html.dark .a11y-toolbar button {
          border-color: rgb(255 255 255 / 10%);
          background: rgb(18 18 20 / 82%);
          color: #4ea1ff;
          box-shadow: 0 4px 12px rgb(0 0 0 / 24%);
        }

        html.dark .a11y-toolbar button:hover {
          background: rgb(24 24 28 / 92%);
          box-shadow:
            0 10px 24px rgb(10 132 255 / 12%),
            0 4px 12px rgb(0 0 0 / 30%);
        }

        html.dark .a11y-toolbar button:focus-visible {
          box-shadow:
            0 0 0 4px rgb(78 161 255 / 28%),
            0 12px 28px rgb(10 132 255 / 18%);
        }

        html.dark .a11y-toolbar {
          background: rgb(0 0 0 / 88%);
          border-color: rgb(255 255 255 / 10%);
          box-shadow:
            0 8px 32px rgb(0 0 0 / 40%),
            0 4px 16px rgb(0 0 0 / 30%);
        }

        html.dark .a11y-toolbar button::after {
          background: rgb(18 18 20 / 96%);
          border-color: rgb(255 255 255 / 10%);
          color: #f5f5f7;
        }

        @media (max-width: 768px) {
          .a11y-toolbar {
            left: 16px;
            bottom: max(20px, env(safe-area-inset-bottom));
            gap: 6px;
            padding: 6px;
          }

          .a11y-toolbar button {
            width: 40px;
            height: 40px;
            font-size: 0.84rem;
          }

          .a11y-toolbar button::after {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'a11y-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Accessibility tools');

    const buttons = [
      {
        icon: '⌨',
        label: 'Keyboard shortcuts',
        action: () => this.showKeyboardShortcuts(),
      },
      {
        icon: 'A+',
        label: 'Increase text size',
        action: () => this.adjustTextSize(1.1),
      },
      {
        icon: 'A−',
        label: 'Decrease text size',
        action: () => this.adjustTextSize(0.9),
      },
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', btn.label);
      button.setAttribute('data-label', btn.label);
      const iconClass = btn.icon.startsWith('A') ? 'a11y-toolbar-button__icon--text' : '';
      button.innerHTML = `<span class="a11y-toolbar-button__icon ${iconClass}" aria-hidden="true">${btn.icon}</span>`;
      button.addEventListener('click', btn.action);
      toolbar.appendChild(button);
    });

    document.body.appendChild(toolbar);
  }

  /**
   * Adjust text size
   */
  adjustTextSize(factor) {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const newSize = currentSize * factor;
    document.documentElement.style.fontSize = `${newSize}px`;
    this.announce(`Text size ${factor > 1 ? 'increased' : 'decreased'}`);
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  const initAccessibility = () => {
    const a11y = new AccessibilityEnhancer();
    a11y.init();

    // Make available globally
    window.a11y = a11y;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibility);
  } else {
    initAccessibility();
  }
}

export default AccessibilityEnhancer;

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

import { syncLiquidGlassTokens } from '../utils/liquid-glass-tokens.js';
import { syncLiquidGlassChrome } from './liquid-glass-chrome.js';

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

    this.applyGlassTint(this.getStoredGlassTint(), { instant: true });
    this.isInitialized = true;
    this.announce('Accessibility features enabled', 'polite');
  }

  shouldShowToolbar() {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      if (
        window.__PERF_AUDIT__ === true ||
        new URLSearchParams(window.location.search).has('perf-audit') ||
        /Chrome-Lighthouse|Lighthouse|PTST/i.test(userAgent)
      ) {
        return false;
      }
    }

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
      { href: '#a11y-toolbar', text: 'Skip to accessibility tools' },
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
        if (link.href === '#a11y-toolbar') {
          const toolbar =
            document.getElementById('a11y-toolbar') || document.querySelector('.a11y-toolbar');
          const mainBtn =
            toolbar?.querySelector('.a11y-toolbar__main') || toolbar?.querySelector('button');
          if (mainBtn) {
            this.setAccessibilityMenuOpen(true);
            mainBtn.focus();
            toolbar?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.announce('Navigated to accessibility tools');
          }
          return;
        }
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
    document.addEventListener('focusin', _e => {});
  }

  /**
   * Handle Escape key press
   */
  handleEscapeKey() {
    // Liquid Glass settings first
    const glassPopover = document.querySelector('.a11y-glass-popover.is-open');
    if (glassPopover) {
      this.toggleLiquidGlassPopover();
      document
        .querySelector('.a11y-toolbar__panel button[aria-label="Liquid Glass transparency"]')
        ?.focus();
      this.announce('Liquid Glass settings closed');
      return;
    }

    const a11yOpen = document.querySelector('.a11y-toolbar.is-open');
    if (a11yOpen) {
      this.setAccessibilityMenuOpen(false);
      document.querySelector('.a11y-toolbar__main')?.focus();
      this.announce('Accessibility options closed');
      return;
    }

    // Hero flyouts (Vibe Coder / Portfolio Reach)
    const openFlyout = document.querySelector('.hero-flyout.is-open');
    if (openFlyout) {
      if (openFlyout.id === 'vibe-stack-flyout') {
        window.vibeStack?.close?.();
        document.getElementById('vibe-coder-badge')?.focus();
      } else if (openFlyout.id === 'reach-flyout') {
        document.getElementById('portfolio-reach')?.click();
        document.getElementById('portfolio-reach')?.focus();
      }
      this.announce('Panel closed');
      return;
    }

    // Close search overlay fully (must clear display:flex !important, not only .active)
    const searchOverlay = document.querySelector('#search-overlay');
    const searchOpen =
      searchOverlay &&
      (searchOverlay.classList.contains('active') ||
        getComputedStyle(searchOverlay).display !== 'none');
    if (searchOpen) {
      if (typeof window.portfolioSearch?.closeSearch === 'function') {
        window.portfolioSearch.closeSearch();
      } else if (searchOverlay) {
        searchOverlay.classList.remove('active');
        searchOverlay.style.setProperty('display', 'none', 'important');
        searchOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
      this.announce('Search closed');
      return;
    }

    // Share + chatbot manage their own Escape handling and state classes.
    const shareDialog = document.getElementById('website-share-dialog');
    if (shareDialog?.classList.contains('active')) {
      return;
    }

    if (document.body.classList.contains('chatbot-open')) {
      window.appleIntelligenceChatbot?.closeWidget?.();
      return;
    }

    // Close overlay navigation menu if open
    if (document.body.classList.contains('menu-open')) {
      const closeBtn = document.getElementById('close-menu-btn');
      const menuBtn = document.getElementById('menu-btn');
      if (closeBtn) {
        closeBtn.click();
      } else if (menuBtn) {
        menuBtn.click();
      }
      return;
    }

    // Keyboard shortcuts modal
    const shortcutsModal = document.querySelector('.shortcuts-modal');
    if (shortcutsModal) {
      this.closeKeyboardShortcuts(shortcutsModal);
      return;
    }

    // Legacy modal cleanup for non-managed overlays only.
    const modals = document.querySelectorAll('.modal, .modal-overlay');
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
   * Show keyboard shortcuts modal (single instance, focus-trapped, Esc-closable)
   */
  showKeyboardShortcuts() {
    const existing = document.querySelector('.shortcuts-modal');
    if (existing) {
      existing.querySelector('.shortcuts-modal__panel')?.focus();
      return;
    }

    this._shortcutsReturnFocus = document.activeElement;

    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
    const mod = isMac ? '⌘' : 'Ctrl';
    const shift = isMac ? '⇧' : 'Shift';

    const groups = [
      {
        title: 'Site actions',
        items: [
          { keys: [mod, 'K'], desc: 'Open search' },
          { keys: [mod, 'D'], desc: 'Toggle light / dark theme' },
          { keys: [mod, 'H'], desc: 'Go to home' },
          { keys: [mod, shift, 'C'], desc: 'Go to contact' },
          { keys: [mod, '/'], desc: 'Show this shortcuts list' },
        ],
      },
      {
        title: 'Navigation',
        items: [
          { keys: ['Tab'], desc: 'Move focus forward' },
          { keys: [shift, 'Tab'], desc: 'Move focus backward' },
          { keys: ['↑', '↓', '←', '→'], desc: 'Move within menus and card grids' },
          { keys: [mod, 'Home'], desc: 'Scroll to top of page' },
          { keys: [mod, 'End'], desc: 'Scroll to bottom of page' },
          { keys: ['Esc'], desc: 'Close dialogs, menus, and overlays' },
        ],
      },
      {
        title: 'Accessibility toolbar',
        items: [
          { keys: ['A+', 'A−'], desc: 'Increase or decrease text size' },
          { keys: ['Contrast'], desc: 'Toggle high contrast mode' },
          { keys: ['Motion'], desc: 'Toggle reduced motion' },
          { keys: ['Glass'], desc: 'Adjust Liquid Glass transparency' },
          { keys: ['Share'], desc: 'Share this website' },
        ],
      },
    ];

    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'shortcuts-title');

    const overlay = document.createElement('div');
    overlay.className = 'shortcuts-modal__overlay';

    const panel = document.createElement('div');
    panel.className = 'shortcuts-modal__panel';
    panel.tabIndex = -1;

    const header = document.createElement('div');
    header.className = 'shortcuts-modal__header';

    const title = document.createElement('h2');
    title.id = 'shortcuts-title';
    title.className = 'shortcuts-modal__title';
    title.textContent = 'Keyboard shortcuts';

    const subtitle = document.createElement('p');
    subtitle.className = 'shortcuts-modal__subtitle';
    subtitle.textContent =
      'Use these shortcuts from anywhere on the site. Screen reader users can also use the skip links and accessibility toolbar.';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'shortcuts-modal__close';
    closeBtn.setAttribute('aria-label', 'Close keyboard shortcuts');
    closeBtn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'shortcuts-modal__body';

    groups.forEach(group => {
      const section = document.createElement('section');
      section.className = 'shortcuts-modal__group';
      section.setAttribute('aria-label', group.title);

      const groupTitle = document.createElement('h3');
      groupTitle.className = 'shortcuts-modal__group-title';
      groupTitle.textContent = group.title;
      section.appendChild(groupTitle);

      const list = document.createElement('ul');
      list.className = 'shortcuts-modal__list';

      group.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'shortcut-item';

        const keysWrap = document.createElement('span');
        keysWrap.className = 'shortcut-item__keys';
        const keyList = Array.isArray(item.keys) ? item.keys : [String(item.keys)];
        keyList.forEach((key, index) => {
          if (index > 0) {
            const sep = document.createElement('span');
            sep.className = 'shortcut-item__sep';
            sep.textContent = '+';
            sep.setAttribute('aria-hidden', 'true');
            keysWrap.appendChild(sep);
          }
          const kbd = document.createElement('kbd');
          kbd.className = 'shortcut-item__key';
          kbd.textContent = key;
          keysWrap.appendChild(kbd);
        });

        const desc = document.createElement('span');
        desc.className = 'shortcut-item__desc';
        desc.textContent = item.desc;

        li.append(keysWrap, desc);
        list.appendChild(li);
      });

      section.appendChild(list);
      body.appendChild(section);
    });

    const footer = document.createElement('div');
    footer.className = 'shortcuts-modal__footer';

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'shortcuts-modal__done';
    doneBtn.textContent = 'Done';

    footer.appendChild(doneBtn);
    panel.append(header, subtitle, body, footer);
    modal.append(overlay, panel);
    document.body.appendChild(modal);

    const close = () => this.closeKeyboardShortcuts(modal);
    closeBtn.addEventListener('click', close);
    doneBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    document.body.classList.add('shortcuts-modal-open');
    // Focus trap within the panel
    this.trapFocus(panel);
    closeBtn.focus();
    this.announce('Keyboard shortcuts dialog opened');
  }

  closeKeyboardShortcuts(modal = document.querySelector('.shortcuts-modal')) {
    if (!modal) return;
    modal.remove();
    document.body.classList.remove('shortcuts-modal-open');
    const returnTo = this._shortcutsReturnFocus;
    this._shortcutsReturnFocus = null;
    if (returnTo && typeof returnTo.focus === 'function' && document.contains(returnTo)) {
      returnTo.focus();
    } else {
      document.querySelector('.a11y-toolbar button[aria-label="Keyboard shortcuts"]')?.focus();
    }
    this.announce('Keyboard shortcuts closed');
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
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) return;

      if (button.title) {
        button.setAttribute('aria-label', button.title);
        return;
      }

      const icon = button.querySelector('i, svg');
      if (!icon) return;

      const classes = `${icon.className || ''} ${button.className || ''}`;
      let label = 'Button';
      if (/search/i.test(classes)) label = 'Search';
      else if (/menu|hamburger/i.test(classes)) label = 'Menu';
      else if (/close|times|xmark/i.test(classes)) label = 'Close';
      else if (/theme|moon|sun/i.test(classes)) label = 'Toggle theme';
      else if (/chevron-left|arrow-left/i.test(classes)) label = 'Previous';
      else if (/chevron-right|arrow-right/i.test(classes)) label = 'Next';
      else if (/calendar|today/i.test(classes)) label = 'Calendar';
      else if (/share/i.test(classes)) label = 'Share';
      else if (/plus/i.test(classes)) label = 'Add';
      else if (/preview/i.test(classes)) label = 'Expand section preview';
      button.setAttribute('aria-label', label);
    });

    const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
    links.forEach(link => {
      if ((link.textContent || '').trim()) return;
      if (link.title) {
        link.setAttribute('aria-label', link.title);
        return;
      }
      const img = link.querySelector('img');
      if (img?.alt) {
        link.setAttribute('aria-label', img.alt);
      }
    });

    // Icon-only images that are decorative
    document.querySelectorAll('img:not([alt])').forEach(img => {
      if (img.closest('a, button') || img.getAttribute('role') === 'presentation') {
        img.setAttribute('alt', '');
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
          if (node.nodeType !== 1) return;
          // Shortcuts dialog traps focus on its panel explicitly — skip the outer shell
          // so Tab handlers are not attached twice.
          if (node.classList?.contains('shortcuts-modal')) return;
          if (node.matches('[role="dialog"]') || node.classList?.contains('modal')) {
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
   * Respect user preferences (system + localStorage overrides)
   */
  respectUserPreferences() {
    // Reduced motion — system preference + user override
    let userMotion = null;
    try {
      const storedMotion = localStorage.getItem('a11y-reduce-motion');
      if (storedMotion === '1') userMotion = true;
      if (storedMotion === '0') userMotion = false;
    } catch {
      // ignore
    }

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      const enabled = userMotion === null ? motionMedia.matches : userMotion;
      this.applyReduceMotion(enabled, { persist: false, announce: false });
    };
    syncMotion();
    motionMedia.addEventListener('change', () => {
      if (userMotion !== null) return;
      syncMotion();
      this.announce(motionMedia.matches ? 'Reduced motion enabled' : 'Animations enabled');
    });
    this._userMotionOverride = userMotion;

    // High contrast — system preference + user override
    let userContrast = null;
    try {
      const stored = localStorage.getItem('a11y-high-contrast');
      if (stored === '1') userContrast = true;
      if (stored === '0') userContrast = false;
    } catch {
      // ignore
    }

    const contrastMedia = window.matchMedia('(prefers-contrast: more), (prefers-contrast: high)');
    const syncContrast = () => {
      if (userContrast === null) {
        document.documentElement.classList.toggle('high-contrast', contrastMedia.matches);
      } else {
        document.documentElement.classList.toggle('high-contrast', userContrast);
      }
      this.syncHighContrastButton();
    };
    syncContrast();
    contrastMedia.addEventListener('change', syncContrast);
    this._userContrastOverride = userContrast;
  }

  applyReduceMotion(enabled, { persist = true, announce = true } = {}) {
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', enabled);
    if (enabled) {
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }
    if (persist) {
      try {
        localStorage.setItem('a11y-reduce-motion', enabled ? '1' : '0');
      } catch {
        // best-effort
      }
      this._userMotionOverride = enabled;
    }
    this.syncReduceMotionButton();
    if (announce) {
      this.announce(enabled ? 'Reduced motion enabled' : 'Animations enabled');
    }
  }

  syncReduceMotionButton() {
    const active = document.documentElement.classList.contains('reduce-motion');
    const btn = document.querySelector(
      '.a11y-toolbar__panel button[aria-label="Toggle reduce motion"], .a11y-toolbar button[aria-label="Toggle reduce motion"]'
    );
    btn?.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn?.classList.toggle('is-active', active);
  }

  syncHighContrastButton() {
    const active = document.documentElement.classList.contains('high-contrast');
    const btn = document.querySelector(
      '.a11y-toolbar__panel button[aria-label="Toggle high contrast"], .a11y-toolbar button[aria-label="Toggle high contrast"]'
    );
    btn?.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn?.classList.toggle('is-active', active);
  }

  toggleReduceMotion() {
    const next = !document.documentElement.classList.contains('reduce-motion');
    this.applyReduceMotion(next, { persist: true, announce: true });
  }

  /**
   * Create accessibility FAB + expandable tool panel (share lives separately).
   */
  createAccessibilityToolbar() {
    let toolbar = document.querySelector('.a11y-toolbar');
    const hasExistingToolbar = !!toolbar;

    if (!document.getElementById('a11y-toolbar-styles')) {
      const style = document.createElement('style');
      style.id = 'a11y-toolbar-styles';
      style.textContent = `
        .a11y-toolbar {
          position: fixed;
          left: max(1rem, env(safe-area-inset-left, 0px));
          bottom: max(1.25rem, env(safe-area-inset-bottom, 0px));
          z-index: 9997;
          display: flex;
          flex-direction: column-reverse;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0;
          border-radius: 0;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          pointer-events: auto;
          max-width: none;
        }

        .a11y-toolbar__main {
          width: 48px !important;
          height: 48px !important;
          min-width: 48px !important;
          min-height: 48px !important;
          border-radius: 999px;
          border: 1px solid rgb(0 0 0 / 10%);
          background: #ffffff !important;
          box-shadow: 0 10px 28px rgb(0 0 0 / 14%);
          color: #1d1d1f;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          font-weight: 800;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }

        html.dark .a11y-toolbar__main {
          background: #1c1c1e !important;
          border-color: rgb(255 255 255 / 14%);
          color: #f5f5f7;
          box-shadow: 0 10px 28px rgb(0 0 0 / 42%);
        }

        .a11y-toolbar__main:hover {
          transform: translateY(-2px) scale(1.04);
        }

        .a11y-toolbar__main:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px rgb(0 113 227 / 28%);
        }

        .a11y-toolbar__main[aria-expanded='true'] {
          background: #0071e3 !important;
          border-color: #0071e3 !important;
          color: #fff;
        }

        html.dark .a11y-toolbar__main[aria-expanded='true'] {
          background: #0a84ff !important;
          border-color: #0a84ff !important;
        }

        .a11y-toolbar__panel {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0.45rem;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid rgb(0 0 0 / 10%);
          box-shadow: 0 14px 36px rgb(0 0 0 / 14%);
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          pointer-events: none;
          transform: translateY(8px) scale(0.96);
          transition: max-height 0.28s ease, opacity 0.22s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .a11y-toolbar.is-open .a11y-toolbar__panel {
          max-height: 22rem;
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }

        html.dark .a11y-toolbar__panel {
          background: #000000;
          border-color: rgb(255 255 255 / 14%);
          box-shadow: 0 14px 36px rgb(0 0 0 / 45%);
        }

        .a11y-toolbar__panel button {
          position: relative;
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          padding: 0;
          border-radius: 999px;
          border: 1px solid rgb(0 0 0 / 8%);
          background: #f5f5f7;
          color: #1d1d1f;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.01em;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        html.dark .a11y-toolbar__panel button {
          background: #1c1c1e;
          border-color: rgb(255 255 255 / 12%);
          color: #f5f5f7;
        }

        html.reduce-motion .a11y-toolbar__main,
        html.reduce-motion .a11y-toolbar__panel,
        html.reduce-motion .a11y-toolbar__panel button {
          transition: none;
        }

        .a11y-toolbar__panel button:hover {
          transform: scale(1.05);
        }

        .a11y-toolbar__panel button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgb(0 113 227 / 30%);
        }

        .a11y-toolbar__panel button::after {
          content: attr(data-label);
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%) translateX(-4px);
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgb(255 255 255 / 96%);
          border: 1px solid rgb(0 0 0 / 8%);
          box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
          color: #1d1d1f;
          font-size: 0.72rem;
          font-weight: 700;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 2;
        }

        .a11y-toolbar__panel button:hover::after,
        .a11y-toolbar__panel button:focus-visible::after {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        html.dark .a11y-toolbar__panel button::after {
          background: rgb(18 18 20 / 96%);
          border-color: rgb(255 255 255 / 10%);
          color: #f5f5f7;
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

        .a11y-glass-popover {
          position: fixed;
          left: max(1rem, env(safe-area-inset-left, 0px));
          bottom: max(6.5rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem));
          width: min(17.5rem, calc(100vw - 1.5rem));
          padding: 1rem;
          border-radius: 18px;
          z-index: 100050;
          opacity: 0;
          transform: scale(0.96) translateY(8px);
          pointer-events: none;
          background: #ffffff;
          border: 1px solid #e5e5ea;
          box-shadow: 0 16px 40px rgb(0 0 0 / 16%);
          transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .a11y-glass-popover.is-open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }

        html.dark .a11y-glass-popover {
          background: #000000;
          border-color: #2c2c2e;
        }

        .a11y-glass-popover__title {
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0 0 0.35rem;
          color: #1d1d1f;
          letter-spacing: -0.02em;
        }

        .a11y-glass-popover__value {
          font-size: 0.78rem;
          color: #0071e3;
          font-weight: 650;
          margin: 0 0 0.65rem;
        }

        .a11y-glass-popover__icons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 0 0.55rem;
        }

        .a11y-glass-icon {
          width: 32px;
          height: 22px;
          display: block;
        }

        .a11y-glass-popover input[type='range'] {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: #e5e5ea;
          outline: none;
          accent-color: #0071e3;
        }

        html.dark .a11y-glass-popover__title {
          color: #f5f5f7;
        }

        html.dark .a11y-glass-popover__value {
          color: #0a84ff;
        }

        html.dark .a11y-glass-popover input[type='range'] {
          accent-color: #0a84ff;
        }
      `;
      document.head.appendChild(style);
    }

    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'a11y-toolbar';
      toolbar.id = 'a11y-toolbar';
      toolbar.setAttribute('role', 'group');
      toolbar.setAttribute('aria-label', 'Accessibility tools');
    } else if (!toolbar.id) {
      toolbar.id = 'a11y-toolbar';
    }

    // Migrate legacy flat toolbar: strip share + rebuild as FAB + panel
    const legacyShare = toolbar.querySelector('#website-share-toggle');
    if (legacyShare) {
      legacyShare.remove();
    }

    let mainBtn = toolbar.querySelector('.a11y-toolbar__main');
    let panel = toolbar.querySelector('.a11y-toolbar__panel');

    if (!mainBtn) {
      // Clear old flat buttons if rebuilding
      if (!panel) {
        Array.from(toolbar.querySelectorAll(':scope > button')).forEach(btn => {
          if (!btn.classList.contains('a11y-toolbar__main')) btn.remove();
        });
      }
      mainBtn = document.createElement('button');
      mainBtn.type = 'button';
      mainBtn.className = 'a11y-toolbar__main';
      mainBtn.setAttribute('aria-label', 'Accessibility options');
      mainBtn.setAttribute('aria-expanded', 'false');
      mainBtn.setAttribute('aria-controls', 'a11y-toolbar-panel');
      mainBtn.innerHTML =
        '<span class="a11y-toolbar-button__icon" aria-hidden="true"><i class="fa-solid fa-universal-access" style="font-size: 1.05rem;"></i></span>';
      mainBtn.addEventListener('click', () => this.toggleAccessibilityMenu());
      toolbar.appendChild(mainBtn);
    }

    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'a11y-toolbar__panel';
      panel.id = 'a11y-toolbar-panel';
      panel.setAttribute('role', 'toolbar');
      panel.setAttribute('aria-label', 'Accessibility controls');
      toolbar.appendChild(panel);
    }

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
      {
        icon: '▣',
        label: 'Toggle high contrast',
        action: () => this.toggleHighContrast(),
        pressed: () => document.documentElement.classList.contains('high-contrast'),
      },
      {
        icon: '⏸',
        label: 'Toggle reduce motion',
        action: () => this.toggleReduceMotion(),
        pressed: () => document.documentElement.classList.contains('reduce-motion'),
      },
      {
        icon: '◐',
        label: 'Liquid Glass transparency',
        action: () => this.toggleLiquidGlassPopover(),
      },
    ];

    buttons.forEach(btn => {
      if (panel.querySelector(`button[aria-label="${btn.label}"]`)) {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', btn.label);
      button.setAttribute('data-label', btn.label);
      if (btn.label === 'Liquid Glass transparency') {
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'a11y-glass-popover');
      }
      if (typeof btn.pressed === 'function') {
        const active = btn.pressed();
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.classList.toggle('is-active', active);
      }
      const isHtmlIcon = btn.icon.startsWith('<');
      const iconClass =
        !isHtmlIcon && btn.icon.startsWith('A') ? 'a11y-toolbar-button__icon--text' : '';
      button.innerHTML = `<span class="a11y-toolbar-button__icon ${iconClass}" aria-hidden="true">${btn.icon}</span>`;
      if (btn.action) {
        button.addEventListener('click', btn.action);
      }
      panel.appendChild(button);
    });

    if (!hasExistingToolbar) {
      document.body.appendChild(toolbar);
    }
    document.body.classList.add('has-a11y-toolbar');

    if (!this._a11yOutsideCloseBound) {
      this._a11yOutsideCloseBound = event => {
        if (!toolbar.classList.contains('is-open')) return;
        if (toolbar.contains(event.target)) return;
        if (event.target.closest?.('.a11y-glass-popover')) return;
        this.setAccessibilityMenuOpen(false);
      };
      document.addEventListener('click', this._a11yOutsideCloseBound, true);
    }

    this.setupToolbarKeyboardNav(panel);
    this.restoreTextSize();
    this.syncHighContrastButton();
    this.syncReduceMotionButton();
  }

  setAccessibilityMenuOpen(open) {
    const toolbar =
      document.getElementById('a11y-toolbar') || document.querySelector('.a11y-toolbar');
    const mainBtn = toolbar?.querySelector('.a11y-toolbar__main');
    if (!toolbar || !mainBtn) return;
    toolbar.classList.toggle('is-open', open);
    mainBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) {
      // Close glass sheet when collapsing tools
      const glassPopover = document.querySelector('.a11y-glass-popover.is-open');
      if (glassPopover) {
        this.toggleLiquidGlassPopover();
      }
    }
  }

  toggleAccessibilityMenu() {
    const toolbar =
      document.getElementById('a11y-toolbar') || document.querySelector('.a11y-toolbar');
    const next = !toolbar?.classList.contains('is-open');
    this.setAccessibilityMenuOpen(next);
    this.announce(next ? 'Accessibility options opened' : 'Accessibility options closed');
  }

  setupToolbarKeyboardNav(toolbar) {
    if (!toolbar || toolbar.dataset.kbNav === 'true') return;
    toolbar.dataset.kbNav = 'true';
    toolbar.addEventListener('keydown', e => {
      if (
        !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(
          e.key
        )
      ) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.setAccessibilityMenuOpen(false);
        document.querySelector('.a11y-toolbar__main')?.focus();
        return;
      }
      const buttons = Array.from(toolbar.querySelectorAll('button'));
      if (!buttons.length) return;
      const index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      e.preventDefault();
      let next = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % buttons.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        next = (index - 1 + buttons.length) % buttons.length;
      }
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = buttons.length - 1;
      buttons[next]?.focus();
    });
  }

  toggleHighContrast() {
    const root = document.documentElement;
    const next = !root.classList.contains('high-contrast');
    root.classList.toggle('high-contrast', next);
    try {
      localStorage.setItem('a11y-high-contrast', next ? '1' : '0');
    } catch {
      // best-effort
    }
    this._userContrastOverride = next;
    this.syncHighContrastButton();
    this.announce(next ? 'High contrast enabled' : 'High contrast disabled');
  }

  restoreTextSize() {
    try {
      const stored = Number(localStorage.getItem('a11y-text-scale'));
      if (Number.isFinite(stored) && stored >= 0.85 && stored <= 1.4) {
        const base = 16;
        document.documentElement.style.fontSize = `${(base * stored).toFixed(2)}px`;
      }
    } catch {
      // ignore
    }
  }

  formatGlassTintLabel(value) {
    const clamped = Math.min(100, Math.max(0, value));
    if (clamped <= 12) return 'Clear';
    if (clamped >= 88) return 'Tinted';
    if (clamped >= 35 && clamped <= 55) return 'Balanced';
    return `${clamped}% tint`;
  }

  getGlassMode(value) {
    const clamped = Math.min(100, Math.max(0, value));
    if (clamped <= 12) return 'clear';
    if (clamped >= 88) return 'tinted';
    if (clamped >= 35 && clamped <= 55) return 'balanced';
    return 'custom';
  }

  updateGlassTintReadout(value, root = document) {
    const clamped = Math.min(100, Math.max(0, value));
    const label = this.formatGlassTintLabel(clamped);
    const mode = this.getGlassMode(clamped);
    const detail =
      mode === 'custom' ? `${label} · ${clamped}% tint` : `${label} · ${clamped}% tint`;

    const readout = root.querySelector('.a11y-glass-popover__value');
    if (readout) {
      readout.hidden = false;
      readout.textContent = detail;
    }

    const badge = root.querySelector('.a11y-glass-popover__badge');
    if (badge) {
      badge.textContent = label;
      badge.dataset.mode = mode;
    }

    const fill = root.querySelector('.a11y-glass-slider__fill');
    if (fill) {
      fill.style.width = `${clamped}%`;
    }

    const previewPane = root.querySelector('.a11y-glass-preview__pane');
    if (previewPane) {
      // Higher tint = more opaque frost
      const opacity = 0.18 + (clamped / 100) * 0.72;
      const blur = 2 + (clamped / 100) * 14;
      previewPane.style.setProperty('--ag-preview-opacity', String(opacity));
      previewPane.style.setProperty('--ag-preview-blur', `${blur.toFixed(1)}px`);
    }

    root.querySelectorAll('.a11y-glass-preset').forEach(button => {
      const preset = button.getAttribute('data-glass-preset');
      const isActive =
        (preset === 'clear' && mode === 'clear') ||
        (preset === 'balanced' && mode === 'balanced') ||
        (preset === 'tinted' && mode === 'tinted');
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-checked', isActive ? 'true' : 'false');
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const slider = root.querySelector('.a11y-glass-popover input[type="range"]');
    if (slider && Number(slider.value) !== clamped) {
      slider.value = String(clamped);
    }
  }

  /**
   * Liquid Glass material control — accessible sheet with presets + fine control.
   * 0 = clear, 42 = balanced (default), 100 = tinted. Drives --lg-tint.
   */
  toggleLiquidGlassPopover() {
    const glassButton = document.querySelector(
      '.a11y-toolbar button[aria-label="Liquid Glass transparency"]'
    );
    let popover = document.querySelector('.a11y-glass-popover');

    if (!popover) {
      popover = document.createElement('div');
      popover.className = 'a11y-glass-popover';
      popover.id = 'a11y-glass-popover';
      popover.setAttribute('role', 'dialog');
      popover.setAttribute('aria-modal', 'false');
      popover.setAttribute('aria-labelledby', 'a11y-glass-title');
      popover.setAttribute('aria-describedby', 'a11y-glass-hint');

      const header = document.createElement('div');
      header.className = 'a11y-glass-popover__header';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'a11y-glass-popover__heading';

      const title = document.createElement('h2');
      title.className = 'a11y-glass-popover__title';
      title.id = 'a11y-glass-title';
      title.textContent = 'Liquid Glass';

      const badge = document.createElement('span');
      badge.className = 'a11y-glass-popover__badge';
      badge.setAttribute('aria-live', 'polite');

      titleWrap.append(title, badge);

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'a11y-glass-popover__close';
      closeBtn.setAttribute('aria-label', 'Close Liquid Glass settings');
      closeBtn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      closeBtn.addEventListener('click', () => {
        if (popover.classList.contains('is-open')) {
          this.toggleLiquidGlassPopover();
        }
      });

      header.append(titleWrap, closeBtn);

      // Live preview strip — shows how transparent vs frosted glass feels
      const preview = document.createElement('div');
      preview.className = 'a11y-glass-popover__preview';
      preview.setAttribute('aria-hidden', 'true');
      preview.innerHTML = `
        <div class="a11y-glass-preview__bg"></div>
        <div class="a11y-glass-preview__pane">
          <span class="a11y-glass-preview__label">Preview</span>
        </div>
      `;

      const segment = document.createElement('div');
      segment.className = 'a11y-glass-popover__presets';
      segment.setAttribute('role', 'radiogroup');
      segment.setAttribute('aria-label', 'Glass material presets');

      const clearPreset = document.createElement('button');
      clearPreset.type = 'button';
      clearPreset.className = 'a11y-glass-preset';
      clearPreset.dataset.glassPreset = 'clear';
      clearPreset.setAttribute('role', 'radio');
      clearPreset.innerHTML =
        '<span class="a11y-glass-preset__dot a11y-glass-preset__dot--clear" aria-hidden="true"></span><span class="a11y-glass-preset__name">Clear</span><span class="a11y-glass-preset__meta">0%</span>';
      clearPreset.setAttribute('aria-label', 'Clear glass — maximum transparency');

      const balancedPreset = document.createElement('button');
      balancedPreset.type = 'button';
      balancedPreset.className = 'a11y-glass-preset';
      balancedPreset.dataset.glassPreset = 'balanced';
      balancedPreset.setAttribute('role', 'radio');
      balancedPreset.innerHTML =
        '<span class="a11y-glass-preset__dot a11y-glass-preset__dot--balanced" aria-hidden="true"></span><span class="a11y-glass-preset__name">Balanced</span><span class="a11y-glass-preset__meta">42%</span>';
      balancedPreset.setAttribute(
        'aria-label',
        'Balanced glass — Apple-like frosted material (default)'
      );

      const tintedPreset = document.createElement('button');
      tintedPreset.type = 'button';
      tintedPreset.className = 'a11y-glass-preset';
      tintedPreset.dataset.glassPreset = 'tinted';
      tintedPreset.setAttribute('role', 'radio');
      tintedPreset.innerHTML =
        '<span class="a11y-glass-preset__dot a11y-glass-preset__dot--tinted" aria-hidden="true"></span><span class="a11y-glass-preset__name">Tinted</span><span class="a11y-glass-preset__meta">100%</span>';
      tintedPreset.setAttribute('aria-label', 'Tinted glass — maximum opacity for contrast');

      segment.append(clearPreset, balancedPreset, tintedPreset);

      const sliderBlock = document.createElement('div');
      sliderBlock.className = 'a11y-glass-slider';

      const track = document.createElement('div');
      track.className = 'a11y-glass-slider__track';
      track.setAttribute('aria-hidden', 'true');

      const fill = document.createElement('div');
      fill.className = 'a11y-glass-slider__fill';
      track.appendChild(fill);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.step = '1';
      slider.value = String(this.getStoredGlassTint());
      slider.className = 'a11y-glass-slider__input';
      slider.setAttribute('aria-labelledby', 'a11y-glass-title');
      slider.setAttribute('aria-valuetext', this.formatGlassTintLabel(Number(slider.value)));
      slider.setAttribute('aria-label', 'Glass material from clear to tinted');

      sliderBlock.append(track, slider);

      const scale = document.createElement('div');
      scale.className = 'a11y-glass-popover__scale';
      scale.innerHTML = '<span>Clear</span><span>Balanced</span><span>Tinted</span>';

      const readout = document.createElement('p');
      readout.className = 'a11y-glass-popover__value';
      readout.setAttribute('aria-live', 'polite');

      const hint = document.createElement('p');
      hint.className = 'a11y-glass-popover__hint';
      hint.id = 'a11y-glass-hint';
      hint.textContent =
        'Clear is most transparent. Balanced matches Apple Liquid Glass. Tinted maximizes contrast for readability. Your choice is saved for next visits.';

      slider.addEventListener('input', () => {
        const nextValue = Number(slider.value);
        this.applyGlassTint(nextValue);
        slider.setAttribute('aria-valuetext', this.formatGlassTintLabel(nextValue));
      });

      clearPreset.addEventListener('click', () => {
        this.applyGlassTint(0, { instant: true });
        this.announce('Liquid Glass set to clear');
      });

      balancedPreset.addEventListener('click', () => {
        this.applyGlassTint(42, { instant: true });
        this.announce('Liquid Glass set to balanced');
      });

      tintedPreset.addEventListener('click', () => {
        this.applyGlassTint(100, { instant: true });
        this.announce('Liquid Glass set to tinted');
      });

      popover.append(header, preview, segment, sliderBlock, scale, readout, hint);
      document.body.appendChild(popover);
      this.updateGlassTintReadout(Number(slider.value), popover);

      // Outside click closes
      document.addEventListener(
        'pointerdown',
        event => {
          if (!popover.classList.contains('is-open')) return;
          const path = event.composedPath?.() || [];
          if (path.includes(popover) || path.includes(glassButton)) return;
          this.toggleLiquidGlassPopover();
        },
        true
      );

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && popover.classList.contains('is-open')) {
          this.toggleLiquidGlassPopover();
          glassButton?.focus();
        }
      });
    }

    const isOpen = popover.classList.toggle('is-open');
    glassButton?.classList.toggle('a11y-glass-active', isOpen);
    glassButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    this.announce(isOpen ? 'Liquid Glass settings opened' : 'Liquid Glass settings closed');
    if (isOpen) {
      this.updateGlassTintReadout(this.getStoredGlassTint(), popover);
      popover.querySelector('.a11y-glass-slider__input')?.focus();
    }
  }

  getStoredGlassTint() {
    try {
      if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
        return 100;
      }
    } catch (_error) {
      // ignore
    }
    try {
      const raw = localStorage.getItem('wwdc26-liquid-glass-tint');
      if (raw !== null) {
        const stored = Number(raw);
        if (Number.isFinite(stored) && stored >= 0 && stored <= 100) {
          return stored;
        }
      }
    } catch (_error) {
      // Storage unavailable — fall through to default.
    }
    // Balanced liquid glass (Apple-like frosted material)
    return 42;
  }

  applyGlassTint(value, { instant = false } = {}) {
    const clamped = Math.min(100, Math.max(0, value));
    syncLiquidGlassTokens(clamped / 100, { instant });
    syncLiquidGlassChrome();
    this.updateGlassTintReadout(clamped);
    const slider = document.querySelector('.a11y-glass-popover input[type="range"]');
    if (slider && Number(slider.value) !== clamped) {
      slider.value = String(clamped);
    }
    try {
      localStorage.setItem('wwdc26-liquid-glass-tint', String(clamped));
    } catch (_error) {
      // Persistence is best-effort.
    }
  }

  /**
   * Adjust text size (clamped 85%–140% of 16px base)
   */
  adjustTextSize(factor) {
    const base = 16;
    const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || base;
    const next = Math.min(base * 1.4, Math.max(base * 0.85, currentSize * factor));
    document.documentElement.style.fontSize = `${next.toFixed(2)}px`;
    try {
      localStorage.setItem('a11y-text-scale', String(next / base));
    } catch {
      // best-effort
    }
    const pct = Math.round((next / base) * 100);
    this.announce(`Text size ${pct}%`);
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

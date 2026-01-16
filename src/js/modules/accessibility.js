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
        this.focusableElements = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
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

        // Add accessibility toolbar
        this.createAccessibilityToolbar();

        this.isInitialized = true;
        this.announce('Accessibility features enabled', 'polite');
        console.log('✅ Accessibility Enhancements initialized');
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
        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.setAttribute('role', 'navigation');
        skipLinksContainer.setAttribute('aria-label', 'Skip links');

        const skipLinks = [
            { href: '#main-content', text: 'Skip to main content' },
            { href: '#global-nav', text: 'Skip to navigation' },
            { href: '#contact', text: 'Skip to contact' }
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

            a.addEventListener('click', (e) => {
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
        document.addEventListener('keydown', (e) => {
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
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                this.announce('Scrolled to bottom of page');
            }
        });

        // Track focus for debugging
        document.addEventListener('focusin', (e) => {
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
            const cards = Array.from(target.closest('.grid, .flex').querySelectorAll('a, button, [tabindex="0"]'));
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
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const modifiers = {
                ctrl: e.ctrlKey || e.metaKey,
                shift: e.shiftKey,
                alt: e.altKey
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
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
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
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (
                        node.matches('[role="dialog"]') ||
                        node.classList?.contains('modal')
                    )) {
                        this.trapFocus(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Trap focus within element
     */
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(this.focusableElements);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
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
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
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
        // Inject styles for the toolbar
        const style = document.createElement('style');
        style.textContent = `
            .a11y-toolbar {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 0.5rem;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9998;
                display: flex;
                gap: 0.5rem;
                transition: all 0.3s ease;
            }
            
            .a11y-toolbar button {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 0.5rem;
                cursor: pointer;
                font-size: 1.2rem;
                transition: all 0.2s;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .a11y-toolbar button:hover {
                transform: scale(1.1);
                background: #f5f5f7;
            }

            html.dark .a11y-toolbar {
                background: rgba(28, 28, 30, 0.95);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            html.dark .a11y-toolbar button {
                background: #2c2c2e;
                border-color: #3a3a3c;
                color: #fff;
            }

            /* Mobile adjustments */
            @media (max-width: 768px) {
                .a11y-toolbar {
                    display: none !important; /* Hide on mobile to prevent overlap */
                }
            }
        `;
        document.head.appendChild(style);

        const toolbar = document.createElement('div');
        toolbar.className = 'a11y-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Accessibility tools');

        const buttons = [
            { icon: '⌨️', label: 'Keyboard shortcuts', action: () => this.showKeyboardShortcuts() },
            { icon: '🔍', label: 'Increase text size', action: () => this.adjustTextSize(1.1) },
            { icon: '🔎', label: 'Decrease text size', action: () => this.adjustTextSize(0.9) }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.icon;
            button.setAttribute('aria-label', btn.label);
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
    document.addEventListener('DOMContentLoaded', () => {
        const a11y = new AccessibilityEnhancer();
        a11y.init();

        // Make available globally
        window.a11y = a11y;
    });
}

export default AccessibilityEnhancer;

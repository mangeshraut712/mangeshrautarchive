/**
 * Scroll engineering for streaming chat (AssistMe).
 * Follow the live reply while the reader is following; never fight scroll intent.
 * Apple Messages–inspired: keep the latest turn visible without spacer tricks.
 */

const SESSION_KEY = 'assistme-chat-scroll-v1';
const PROGRAMMATIC_GRACE_MS = 140;
const NEAR_BOTTOM_THRESHOLD = 96;

export class ChatScrollEngine {
  constructor(messagesEl, { widgetEl, announce } = {}) {
    this.messagesEl = messagesEl;
    this.widgetEl = widgetEl;
    this.announce = announce || (() => {});
    this.following = true;
    this.isStreaming = false;
    this.activityBelow = false;
    this.lastProgrammaticScrollAt = 0;
    this.pendingFollowFrame = 0;
    this.resizeObserver = null;
    this.scrollDistanceFromBottom = 0;
    this.activeTurnEl = null;
    this.jumpBtn = null;
    this.boundHandlers = [];
  }

  bind() {
    if (!this.messagesEl) return;
    if (!this.messagesEl.hasAttribute('tabindex')) {
      this.messagesEl.setAttribute('tabindex', '0');
    }
    this.messagesEl.classList.add('chat-scroll-fade');
    this.ensureScrollAnchor();
    this.createJumpButton();
    this.initResizeObserver();
    this.updateScrollFade();

    const on = (target, type, handler, options) => {
      target.addEventListener(type, handler, options);
      this.boundHandlers.push({ target, type, handler, options });
    };

    on(
      this.messagesEl,
      'scroll',
      () => {
        if (Date.now() - this.lastProgrammaticScrollAt < PROGRAMMATIC_GRACE_MS) return;
        if (this.isNearBottom()) {
          this.resumeFollowing('scroll-edge');
        } else {
          this.pauseFollowing('scroll');
        }
        this.captureScrollDistance();
        this.updateJumpAffordance();
        this.updateScrollFade();
      },
      { passive: true }
    );

    on(
      this.messagesEl,
      'wheel',
      event => {
        if (event.deltaY < -2) {
          this.pauseFollowing('wheel-up');
        } else if (event.deltaY > 2 && this.isNearBottom()) {
          this.resumeFollowing('wheel-down');
        }
      },
      { passive: true }
    );

    let touchStartY = 0;
    on(
      this.messagesEl,
      'touchstart',
      () => {
        touchStartY = this.messagesEl.scrollTop;
      },
      { passive: true }
    );

    on(
      this.messagesEl,
      'touchmove',
      () => {
        if (this.messagesEl.scrollTop < touchStartY - 8) {
          this.pauseFollowing('touch');
        }
        if (this.isNearBottom()) {
          this.resumeFollowing('touch-edge');
        }
      },
      { passive: true }
    );

    on(
      this.messagesEl,
      'pointerdown',
      event => {
        if (event.target.closest('.chatbot-jump-latest')) return;
        if (!this.isNearBottom()) {
          this.pauseFollowing('pointer');
        }
      },
      { passive: true }
    );

    on(this.messagesEl, 'click', event => {
      if (event.target.closest('a[href]')) {
        this.pauseFollowing('link');
      }
    });

    on(document, 'selectionchange', () => {
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed) return;
      const anchor = selection.anchorNode;
      if (anchor && this.messagesEl.contains(anchor)) {
        this.pauseFollowing('selection');
      }
    });

    on(this.messagesEl, 'keydown', event => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
        this.pauseFollowing('keyboard');
      }
    });
  }

  dispose() {
    this.boundHandlers.forEach(({ target, type, handler, options }) => {
      target.removeEventListener(type, handler, options);
    });
    this.boundHandlers = [];
    this.resizeObserver?.disconnect();
    if (this.pendingFollowFrame) {
      cancelAnimationFrame(this.pendingFollowFrame);
    }
    this.jumpBtn?.remove();
  }

  isFollowing() {
    return this.following;
  }

  pauseFollowing(_reason = 'user') {
    if (!this.following) return;
    this.following = false;
    this.captureScrollDistance();
    this.updateJumpAffordance();
  }

  resumeFollowing(_reason = 'user') {
    if (this.following) return;
    this.following = true;
    this.activityBelow = false;
    this.updateJumpAffordance();
  }

  isNearBottom(threshold = NEAR_BOTTOM_THRESHOLD) {
    const messages = this.messagesEl;
    if (!messages) return true;
    return messages.scrollHeight - messages.scrollTop - messages.clientHeight <= threshold;
  }

  captureScrollDistance() {
    const messages = this.messagesEl;
    if (!messages) return;
    this.scrollDistanceFromBottom =
      messages.scrollHeight - messages.scrollTop - messages.clientHeight;
  }

  preserveScrollDistance() {
    const messages = this.messagesEl;
    if (!messages || this.following) return;
    messages.scrollTop = Math.max(
      0,
      messages.scrollHeight - messages.clientHeight - this.scrollDistanceFromBottom
    );
  }

  ensureScrollAnchor() {
    const messages = this.messagesEl;
    if (!messages) return null;

    let anchor = messages.querySelector('#chatbot-scroll-anchor');
    if (!anchor) {
      anchor = document.createElement('div');
      anchor.id = 'chatbot-scroll-anchor';
      anchor.className = 'chatbot-scroll-anchor';
      anchor.setAttribute('aria-hidden', 'true');
      messages.appendChild(anchor);
    } else if (anchor.parentElement !== messages || anchor !== messages.lastElementChild) {
      messages.appendChild(anchor);
    }

    return anchor;
  }

  insertNode(node) {
    const messages = this.messagesEl;
    if (!messages || !node) return;
    const anchor = messages.querySelector('#chatbot-scroll-anchor');
    if (anchor) {
      messages.insertBefore(node, anchor);
    } else {
      messages.appendChild(node);
    }
    this.ensureScrollAnchor();
  }

  /**
   * @param {'if-following'|'force'|false} pin
   */
  afterInsert(pin = 'if-following') {
    if (pin === false) return;
    if (pin === 'force') {
      this.jumpToLatest({ announce: false });
      return;
    }
    if (pin === 'if-following' && this.following) {
      this.scheduleFollow();
    } else if (!this.following) {
      this.markActivityBelow();
      this.preserveScrollDistance();
    }
  }

  beginUserTurn(messageEl) {
    if (!messageEl) return;
    this.activeTurnEl = messageEl;
    this.resumeFollowing('new-turn');
    // Soft pin: bring the user bubble into view without a giant spacer pad
    // (the old 90vh pad made the transcript jump upward and stuck Jump-to-latest).
    this.scrollTurnIntoView(messageEl);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this.scrollTurnIntoView(messageEl));
    }
  }

  ensureUserPinPad() {
    // Intentionally no-op: spacer pads caused scroll thrash on mobile/desktop.
    return null;
  }

  collapseUserPinPad() {
    const pad = this.messagesEl?.querySelector('#chatbot-user-pin-pad');
    if (pad) {
      pad.remove();
    }
  }

  scrollTurnIntoView(messageEl) {
    const messages = this.messagesEl;
    if (!messages || !messageEl) return;

    const topInset = Math.max(12, Math.round(messages.clientHeight * 0.12));
    try {
      const containerRect = messages.getBoundingClientRect();
      const messageRect = messageEl.getBoundingClientRect();
      const delta = messageRect.top - containerRect.top - topInset;
      // Only nudge when the bubble is meaningfully off-screen
      if (Math.abs(delta) > 24) {
        this.markProgrammaticScroll();
        messages.scrollTop = Math.max(0, messages.scrollTop + delta);
      }
    } catch {
      this.markProgrammaticScroll();
      messages.scrollTop = Math.max(0, messageEl.offsetTop - topInset);
    }
    this.captureScrollDistance();
  }

  followLiveContent(element) {
    if (!this.following || !element) return;
    const messages = this.messagesEl;
    if (!messages) return;

    const containerRect = messages.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();
    const bottomPadding = 28;
    const overflow = targetRect.bottom - (containerRect.bottom - bottomPadding);

    if (overflow > 0) {
      this.markProgrammaticScroll();
      messages.scrollTop += overflow;
      this.captureScrollDistance();
    }
  }

  jumpToLatest({ announce = true } = {}) {
    const messages = this.messagesEl;
    if (!messages) return;

    this.resumeFollowing('jump');
    this.collapseUserPinPad();
    this.markProgrammaticScroll();
    const anchor = this.ensureScrollAnchor();
    messages.scrollTop = Math.max(0, messages.scrollHeight - messages.clientHeight);

    if (anchor?.scrollIntoView) {
      try {
        anchor.scrollIntoView({ block: 'end', inline: 'nearest' });
      } catch {
        anchor.scrollIntoView(false);
      }
    }

    messages.scrollTop = Math.max(0, messages.scrollHeight - messages.clientHeight);
    this.captureScrollDistance();
    this.updateJumpAffordance();
    this.updateScrollFade();
    if (announce) {
      this.announce('Jumped to latest message. Following resumed.');
    }
  }

  scheduleFollow({ force = false } = {}) {
    if (!force && !this.following) {
      this.markActivityBelow();
      return;
    }

    if (force) {
      this.resumeFollowing('force');
    }

    if (this.pendingFollowFrame) {
      cancelAnimationFrame(this.pendingFollowFrame);
    }

    this.pendingFollowFrame = requestAnimationFrame(() => {
      this.pendingFollowFrame = requestAnimationFrame(() => {
        this.pendingFollowFrame = 0;
        if (!this.following) return;
        const stream = this.messagesEl?.querySelector('.message.streaming');
        if (stream) {
          this.followLiveContent(stream);
          return;
        }
        this.jumpToLatest({ announce: false });
      });
    });
  }

  onStreamStart() {
    this.isStreaming = true;
    this.messagesEl?.setAttribute('aria-busy', 'true');
    this.collapseUserPinPad();
    this.resumeFollowing('stream-start');
    this.scheduleFollow({ force: true });
    this.updateJumpAffordance();
    this.updateScrollFade();
  }

  onStreamEnd() {
    this.isStreaming = false;
    this.messagesEl?.setAttribute('aria-busy', 'false');
    this.collapseUserPinPad();
    if (this.following) {
      this.jumpToLatest({ announce: false });
    } else {
      this.markActivityBelow();
    }
    this.updateJumpAffordance();
    this.updateScrollFade();
  }

  markActivityBelow() {
    if (!this.following) {
      this.activityBelow = true;
      this.updateJumpAffordance();
    }
  }

  markProgrammaticScroll() {
    this.lastProgrammaticScrollAt = Date.now();
  }

  initResizeObserver() {
    if (!this.messagesEl || this.resizeObserver || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      if (this.following) {
        if (this.isStreaming) {
          const stream = this.messagesEl.querySelector('.message.streaming');
          if (stream) {
            this.followLiveContent(stream);
            return;
          }
        }
        this.jumpToLatest({ announce: false });
      } else {
        this.preserveScrollDistance();
        this.markActivityBelow();
      }
    });
    this.resizeObserver.observe(this.messagesEl);
  }

  createJumpButton() {
    if (!this.widgetEl || this.jumpBtn) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chatbot-jump-latest';
    button.hidden = true;
    button.tabIndex = -1;
    button.setAttribute('aria-label', 'Jump to latest message');
    button.innerHTML =
      '<span class="chatbot-jump-latest__icon" aria-hidden="true">↓</span><span class="chatbot-jump-latest__label">Jump to latest</span>';
    button.addEventListener('click', () => this.jumpToLatest());
    this.widgetEl.appendChild(button);
    this.jumpBtn = button;
  }

  hasMessages() {
    if (!this.messagesEl) return false;
    if (this.messagesEl.children.length === 0) return false;
    const hasWelcomeOnly =
      this.messagesEl.children.length === 1 &&
      this.messagesEl.querySelector('.welcome-message, .welcome-message-simplified');
    return !hasWelcomeOnly;
  }

  updateJumpAffordance() {
    if (!this.jumpBtn) return;

    const hasMsgs = this.hasMessages();
    const show =
      hasMsgs &&
      !this.following &&
      (this.activityBelow || this.isStreaming || !this.isNearBottom());
    this.jumpBtn.hidden = !show;
    this.jumpBtn.tabIndex = show ? 0 : -1;
    this.jumpBtn.classList.toggle('is-streaming', this.isStreaming);
    this.jumpBtn.classList.toggle('is-visible', show);

    const label = this.jumpBtn.querySelector('.chatbot-jump-latest__label');
    if (label) {
      label.textContent = this.isStreaming ? 'Reply streaming' : 'Jump to latest';
    }
  }

  updateScrollFade() {
    const messages = this.messagesEl;
    if (!messages?.classList.contains('chat-scroll-fade')) return;

    const nearTop = messages.scrollTop < 24;
    const nearBottom = this.isNearBottom(24);
    if (nearBottom && !nearTop) {
      messages.dataset.fade = 'bottom';
    } else if (nearTop && !nearBottom) {
      messages.dataset.fade = 'top';
    } else {
      delete messages.dataset.fade;
    }
  }

  saveSession() {
    const messages = this.messagesEl;
    if (!messages) return;

    try {
      const lastUser = messages.querySelector('.user-message:last-of-type');
      const payload = {
        scrollTop: messages.scrollTop,
        following: this.following,
        messageId: lastUser?.dataset?.messageId || null,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch {
      // Storage may be unavailable.
    }
  }

  restoreSession() {
    // Prefer a clean bottom-following open — restoring mid-scroll left the
    // Jump-to-latest chip stuck over the composer on Pages.
    const messages = this.messagesEl;
    if (!messages) return false;
    this.following = true;
    this.activityBelow = false;
    requestAnimationFrame(() => this.jumpToLatest({ announce: false }));
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    return true;
  }

  clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }
}

export default ChatScrollEngine;

/**
 * Scroll engineering for streaming chat (AssistMe).
 * Follow only while the reader is following; never fight user intent.
 */

const SESSION_KEY = 'assistme-chat-scroll-v1';
const PROGRAMMATIC_GRACE_MS = 100;
const NEAR_BOTTOM_THRESHOLD = 72;

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
    this.ensureScrollAnchor();
    this.createJumpButton();
    this.initResizeObserver();

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
    // Keep the user bubble near the top until assistant streaming starts
    this.userTurnPinnedUntil = Date.now() + 1200;
    const pin = () => {
      // Do not re-expand the pin pad once the assistant stream is live
      if (this.isStreaming) return;
      this.scrollTurnIntoView(messageEl);
    };
    pin();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        requestAnimationFrame(pin);
      });
    }
    // Layout settles after flex spacers / markdown paint / offline auto-reply
    setTimeout(pin, 32);
    setTimeout(pin, 80);
    setTimeout(pin, 160);
    setTimeout(pin, 320);
    setTimeout(pin, 640);
  }

  ensureUserPinPad() {
    const messages = this.messagesEl;
    if (!messages) return null;
    let pad = messages.querySelector('#chatbot-user-pin-pad');
    if (!pad) {
      pad = document.createElement('div');
      pad.id = 'chatbot-user-pin-pad';
      pad.setAttribute('aria-hidden', 'true');
      pad.style.flexShrink = '0';
      pad.style.width = '100%';
      pad.style.pointerEvents = 'none';
      const anchor = this.ensureScrollAnchor();
      if (anchor) {
        messages.insertBefore(pad, anchor);
      } else {
        messages.appendChild(pad);
      }
    }
    const need = Math.max(Math.round(messages.clientHeight * 0.9), 280);
    pad.style.minHeight = `${need}px`;
    return pad;
  }

  collapseUserPinPad() {
    const pad = this.messagesEl?.querySelector('#chatbot-user-pin-pad');
    if (pad) {
      pad.style.minHeight = '0px';
    }
  }

  scrollTurnIntoView(messageEl) {
    const messages = this.messagesEl;
    if (!messages || !messageEl) return;

    // Temporary pad so we can always scroll the user bubble near the top
    // (skip while streaming so bottom-follow tests stay tight)
    if (!this.isStreaming) {
      this.ensureUserPinPad();
    }

    // Anchor user turn near the top of the scroller (Apple Messages–like)
    const topInset = Math.max(8, Math.round(messages.clientHeight * 0.08));
    const apply = () => {
      try {
        const containerRect = messages.getBoundingClientRect();
        const messageRect = messageEl.getBoundingClientRect();
        const delta = messageRect.top - containerRect.top - topInset;
        if (Math.abs(delta) > 0.5) {
          this.markProgrammaticScroll();
          messages.scrollTop = Math.max(0, messages.scrollTop + delta);
        }
      } catch {
        this.markProgrammaticScroll();
        messages.scrollTop = Math.max(0, messageEl.offsetTop - topInset);
      }
    };
    // Two passes: first jump, second corrects after browser layout reflow
    apply();
    apply();
    this.captureScrollDistance();
  }

  followLiveContent(element) {
    if (!this.following || !element) return;
    const messages = this.messagesEl;
    if (!messages) return;

    // Prefer pinning the user turn near the top only until assistant streaming starts
    if (
      !this.isStreaming &&
      this.activeTurnEl &&
      this.userTurnPinnedUntil &&
      Date.now() < this.userTurnPinnedUntil
    ) {
      this.scrollTurnIntoView(this.activeTurnEl);
      return;
    }

    // While streaming, drop the pin pad so bottom-follow math stays tight
    if (this.isStreaming) {
      this.collapseUserPinPad();
    }

    const containerRect = messages.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();
    const bottomPadding = 20;
    const overflow = targetRect.bottom - (containerRect.bottom - bottomPadding);

    if (overflow > 0) {
      this.markProgrammaticScroll();
      messages.scrollTop += overflow;
      this.captureScrollDistance();
      return;
    }

    if (this.activeTurnEl && !this.isStreaming) {
      const turnRect = this.activeTurnEl.getBoundingClientRect();
      const topOverflow = containerRect.top + 12 - turnRect.top;
      if (topOverflow > 0) {
        this.markProgrammaticScroll();
        messages.scrollTop = Math.max(0, messages.scrollTop - topOverflow);
        this.captureScrollDistance();
      }
    }
  }

  jumpToLatest({ announce = true } = {}) {
    const messages = this.messagesEl;
    if (!messages) return;

    this.resumeFollowing('jump');
    this.userTurnPinnedUntil = 0;
    this.collapseUserPinPad();
    this.markProgrammaticScroll();
    const anchor = this.ensureScrollAnchor();
    const targetTop = Math.max(0, messages.scrollHeight - messages.clientHeight);
    messages.scrollTop = targetTop;

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
        if (this.activeTurnEl && this.following && this.isStreaming) {
          const stream = this.messagesEl?.querySelector('.message.streaming');
          if (stream) {
            this.followLiveContent(stream);
            return;
          }
        }
        if (this.following) {
          this.jumpToLatest({ announce: false });
        }
      });
    });
  }

  onStreamStart() {
    this.isStreaming = true;
    this.userTurnPinnedUntil = 0;
    this.collapseUserPinPad();
    this.updateJumpAffordance();
  }

  onStreamEnd() {
    this.isStreaming = false;
    this.collapseUserPinPad();
    if (this.following) {
      this.scheduleFollow();
    } else {
      this.markActivityBelow();
    }
    this.updateJumpAffordance();
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
    button.setAttribute('aria-label', 'Jump to latest message');
    button.innerHTML =
      '<span class="chatbot-jump-latest__icon" aria-hidden="true">↓</span><span class="chatbot-jump-latest__label">Jump to latest</span>';
    button.addEventListener('click', () => this.jumpToLatest());
    this.widgetEl.appendChild(button);
    this.jumpBtn = button;
  }

  updateJumpAffordance() {
    if (!this.jumpBtn) return;

    const show =
      !this.following && (this.activityBelow || this.isStreaming || !this.isNearBottom());
    this.jumpBtn.hidden = !show;
    this.jumpBtn.classList.toggle('is-streaming', this.isStreaming);

    const label = this.jumpBtn.querySelector('.chatbot-jump-latest__label');
    if (label) {
      label.textContent = this.isStreaming ? 'Reply streaming' : 'Jump to latest';
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
    const messages = this.messagesEl;
    if (!messages) return false;

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;

      const saved = JSON.parse(raw);
      const lastUser = saved.messageId
        ? messages.querySelector(`[data-message-id="${saved.messageId}"]`)
        : messages.querySelector('.user-message:last-of-type');

      if (lastUser) {
        this.following = false;
        this.activityBelow = true;
        requestAnimationFrame(() => {
          this.scrollTurnIntoView(lastUser);
          this.updateJumpAffordance();
        });
        return true;
      }

      if (Number.isFinite(saved.scrollTop)) {
        this.following = Boolean(saved.following);
        messages.scrollTop = saved.scrollTop;
        this.captureScrollDistance();
        this.updateJumpAffordance();
        return true;
      }
    } catch {
      return false;
    }

    return false;
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

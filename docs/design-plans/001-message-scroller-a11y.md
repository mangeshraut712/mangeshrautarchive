# MessageScroller a11y parity (vanilla)

Written against: `aaf4a758`

## Why

shadcn `MessageScrollerContent` sets `role="log"` and `aria-relevant="additions"` so screen readers announce streamed messages. AssistMe only has `aria-live="polite"` on `#chatbot-messages` (`src/index.html`). Jump-to-latest should leave the tab order when already at bottom (shadcn pattern).

## Evidence

- Current: `<div id="chatbot-messages" aria-live="polite">` in `src/index.html`
- Engine already has Jump button: `src/js/utils/chat-scroll-engine.js` `createJumpButton` / `updateJumpAffordance`
- Stream busy state exists in UI (`chatbot.js` `setComposerBusy`) but is not mirrored onto the log region

## Scope

**In:**

- `src/index.html` (chatbot messages attributes only)
- `src/js/utils/chat-scroll-engine.js`
- `src/js/modules/chatbot.js` (set `aria-busy` on messages during stream)

**Out:**

- React / shadcn install
- Rewriting scroll math (follow/pin already correct)

## Conventions to match

- Vanilla ESM, 2-space indent, single quotes
- Prefer `hidden` + `tabindex` for affordances (existing jump button pattern)

## Steps

1. In `src/index.html`, change messages container to:

```html
<div
  id="chatbot-messages"
  role="log"
  aria-live="polite"
  aria-relevant="additions"
  aria-busy="false"
></div>
```

2. In `ChatScrollEngine.updateJumpAffordance`, when `show` is false set `tabindex="-1"`; when true remove tabindex or set `"0"`. Keep `hidden` as today.

3. In `ChatScrollEngine.onStreamStart` / `onStreamEnd`, set `this.messagesEl.setAttribute('aria-busy', 'true'|'false')`.

4. In `AppleIntelligenceChatbot` stream start/end paths that call `onStreamStart`/`onStreamEnd`, do not double-toggle if engine owns it — engine only.

## Verification

```bash
node --check src/js/utils/chat-scroll-engine.js
npm test -- tests/unit/ 2>/dev/null | tail -20
```

Manual:

- VoiceOver/TalkBack: new assistant chunks announced
- Tab through composer while scrolled up: Jump button focusable; at bottom: not in tab order
- During stream: `#chatbot-messages[aria-busy="true"]`

## Status

**DONE** (executed)

## Done criteria

- Attributes present in HTML
- Jump button `tabindex="-1"` when `hidden`
- `aria-busy` flips with stream lifecycle

## Stop conditions

- Stop if another module also sets `role` on `#chatbot-messages` and conflicts — report instead of stacking roles.

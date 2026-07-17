# scroll-fade + text shimmer (shadcn utilities → vanilla CSS)

Written against: `aaf4a758`

## Why

shadcn 2026-06 adds `scroll-fade` (edge fades on scroll containers) and `shimmer` (text shimmer for “Thinking…” / streaming markers). AssistMe has bar shimmer (`.thinking-shimmer-bar`) but no edge fades on `#chatbot-messages`, and stage label is static color.

## Evidence

- Messages: `#chatbot-messages` in `src/assets/css/ai-assistant.css` (~L418)
- Thinking label: `.thinking-stage` (~L2200) — no shimmer text treatment
- Reduced motion already used elsewhere in `wwdc26-liquid-glass.css`

## Scope

**In:** `src/assets/css/ai-assistant.css` (and optional dark overrides in same file)  
**Out:** Tailwind classes in HTML; new npm deps

## Target CSS (copy exactly)

Add under AssistMe section in `ai-assistant.css`:

```css
/* shadcn-inspired scroll-fade — mask edges when content overflows */
#chatbot-messages.chat-scroll-fade {
  --chat-fade-size: 18px;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--chat-fade-size),
    #000 calc(100% - var(--chat-fade-size)),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--chat-fade-size),
    #000 calc(100% - var(--chat-fade-size)),
    transparent 100%
  );
}

/* At bottom: fade only top edge */
#chatbot-messages.chat-scroll-fade[data-fade='bottom'] {
  mask-image: linear-gradient(to bottom, transparent 0, #000 var(--chat-fade-size), #000 100%);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--chat-fade-size),
    #000 100%
  );
}

/* At top: fade only bottom edge */
#chatbot-messages.chat-scroll-fade[data-fade='top'] {
  mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 calc(100% - var(--chat-fade-size)),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 calc(100% - var(--chat-fade-size)),
    transparent 100%
  );
}

.chat-text-shimmer {
  background: linear-gradient(
    90deg,
    currentColor 0%,
    color-mix(in srgb, currentColor 35%, transparent) 45%,
    currentColor 90%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: chatTextShimmer 1.6s linear infinite;
}

@keyframes chatTextShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-text-shimmer {
    animation: none;
    color: inherit;
    background: none;
  }
  #chatbot-messages.chat-scroll-fade {
    mask-image: none;
    -webkit-mask-image: none;
  }
}
```

## Steps

1. Add CSS above to `ai-assistant.css`.
2. In `ChatScrollEngine.bind()`, add class `chat-scroll-fade` to `messagesEl`.
3. On scroll / follow updates, set `data-fade`:
   - near bottom → `bottom`
   - near top (scrollTop < 24) → `top`
   - else → omit attribute or `both` (default CSS with both fades)
4. In `chatbot.js` thinking indicator markup, add class `chat-text-shimmer` to `.thinking-stage` while stages are thinking/generating/streaming; remove on hide.

## Verification

Manual: scroll AssistMe transcript — soft fades at edges; Thinking label shimmers; with macOS Reduce Motion, shimmer and masks disable.

```bash
npm run lint:css
```

## Done criteria

- Class present on `#chatbot-messages`
- `data-fade` updates with scroll position
- `.thinking-stage.chat-text-shimmer` during thinking
- Reduced-motion disables both

## Stop conditions

- If mask breaks sticky jump button visibility on Safari, gate `chat-scroll-fade` behind `@supports (-webkit-mask-image: linear-gradient(#000, #000))` and report.

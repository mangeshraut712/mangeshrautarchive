# Fix typingBounce `scale(0)` (animation)

Written against: `aaf4a758`

## Why

Emil Kowalski / improve-animations: never `scale(0)` — nothing appears from nothing. Target `scale(0.92–0.97)` + opacity. `typingBounce` in AssistMe uses `scale(0)`.

## Evidence

```322:331:src/assets/css/ai-assistant.css
@keyframes typingBounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}
```

## Scope

**In:** `src/assets/css/ai-assistant.css` only (and reduced-motion if missing for `.typing-dot`)  
**Out:** Reworking thinking-brain pulse (separate; optional follow-up)

## Target keyframes (exact)

```css
@keyframes typingBounce {
  0%,
  80%,
  100% {
    transform: scale(0.92);
    opacity: 0.35;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing-dot {
    animation: none;
    opacity: 0.7;
    transform: none;
  }
}
```

Duration stays `1.4s` (status indicator, occasional — OK). Easing remains `ease-in-out` for on-element pulse.

## Steps

1. Replace `typingBounce` keyframes as above.
2. Add reduced-motion rule if not already covering `.typing-dot`.
3. Feel-check: open AssistMe offline/local thinking or any UI still using `.typing-dot`.

## Verification

- Visual: dots never vanish to zero size
- Reduce Motion: static dots

```bash
npm run lint:css
```

## Done criteria

- No `scale(0)` in `typingBounce`
- Reduced-motion disables bounce

## Stop conditions

- If `.typing-dot` is unused dead CSS, delete the keyframes block instead of fixing — confirm with ripgrep first (`rg typing-dot src`).

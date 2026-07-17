# AssistMe ← shadcn 2026-06 chat UX

Written against: `aaf4a758`  
Source inspiration: [shadcn/ui 2026-06 Chat Components](https://ui.shadcn.com/docs/changelog/2026-06-chat-components)  
Constraint: **vanilla HTML/CSS/JS only** — do **not** install React, `@ai-sdk/react`, or `npx shadcn@latest`.

## Hard constraint (executor)

`AGENTS.md` forbids React/Vue/Angular/Svelte runtimes and Tailwind utility classes in HTML. Translate shadcn primitives into existing AssistMe CSS/JS owners:

| shadcn                 | AssistMe owner                                             |
| ---------------------- | ---------------------------------------------------------- |
| MessageScroller        | `src/js/utils/chat-scroll-engine.js` + `#chatbot-messages` |
| Message / Bubble       | `.message` / `.message-content` in `ai-assistant.css`      |
| Attachment             | attach preview + `.attachment-thumbs`                      |
| Marker                 | agentic chips + new `.chat-marker`                         |
| scroll-fade / shimmer  | new CSS utilities in `ai-assistant.css`                    |
| InputGroup + Plus menu | `#chatbot-form` / `.input-wrapper`                         |

## Findings index (vetted)

| #   | Severity | Category        | Location                                                      | Finding                                                                                                                      |
| --- | -------- | --------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | HIGH     | a11y / scroller | `src/index.html` `#chatbot-messages`; `chat-scroll-engine.js` | Missing MessageScroller a11y: `role="log"`, `aria-relevant="additions"`, stream `aria-busy`, jump btn `tabindex` when hidden |
| 2   | MEDIUM   | UX polish       | `ai-assistant.css` `#chatbot-messages`                        | No scroll-aware edge fades (`scroll-fade`)                                                                                   |
| 3   | MEDIUM   | UX polish       | `.thinking-stage`                                             | Bar shimmer only — missing text shimmer for live status                                                                      |
| 4   | MEDIUM   | composer UX     | `#chatbot-form`                                               | Flat attach/writing/voice vs shadcn Plus → dropdown (Attach / Create image / Site search)                                    |
| 5   | MEDIUM   | composition     | attach + agentic chips                                        | Attachment not a card with actions; no Marker for tool/streaming separators                                                  |
| 6   | HIGH     | animation       | `ai-assistant.css:322-331`                                    | `typingBounce` uses `scale(0)` — feel-breaking                                                                               |

## improve-react

**Not applicable.** This is not a React codebase. Do not run React Doctor or add shadcn React packages.

## Recommended order

1. `001-message-scroller-a11y.md`
2. `002-scroll-fade-and-text-shimmer.md`
3. `006-typing-scale-zero-fix.md` (can parallel with 002)
4. `003-composer-plus-menu.md`
5. `004-attachment-and-marker.md`

## Status

| Plan                      | Status |
| ------------------------- | ------ |
| 001 MessageScroller a11y  | DONE   |
| 002 scroll-fade + shimmer | DONE   |
| 003 Composer plus menu    | DONE   |
| 004 Attachment + Marker   | DONE   |
| 006 typing scale(0)       | DONE   |

## Verification baseline (all plans)

```bash
npm run lint
npm test
# Manual: open AssistMe at http://127.0.0.1:4000 — stream a reply, scroll up, use Jump to latest
```

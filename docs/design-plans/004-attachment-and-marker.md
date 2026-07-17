# Attachment card + Marker rows (Bubble companions)

Written against: `aaf4a758`

## Why

shadcn `Attachment` = media + metadata + actions with separately clickable controls. `Marker` = streaming / tool / date separators. AssistMe has thin attach preview text and emoji agentic chips without a consistent marker system.

## Evidence

- `addAttachmentPreviewMessage` / `renderAttachPreview` in `src/js/modules/chatbot.js`
- Agentic chip: `showAgenticChip` → `.agentic-action-chip`
- Thinking indicator already acts as a streaming marker but uses different styling

## Scope

**In:** `chatbot.js` markup helpers, `ai-assistant.css`  
**Out:** File uploads beyond images; backend changes

## Design decision

1. **Attachment:** When images are pending or shown on a user turn, render a compact card:

```html
<figure class="chat-attachment">
  <img … />
  <figcaption class="chat-attachment-meta">
    <span class="chat-attachment-name">image.png</span>
    <button type="button" class="chat-attachment-remove">Remove</button>
  </figcaption>
</figure>
```

Remove must not trigger bubble click handlers (`stopPropagation`).

2. **Marker:** Introduce `.chat-marker` for:
   - Agentic action start (`data-kind="tool"`)
   - Streaming status when thinking shows (`data-kind="status"`) — optional unify later
   - Optional date break if conversation spans midnight (nice-to-have; skip if no timestamps)

Refactor `showAgenticChip` to use:

```html
<div class="chat-marker" data-kind="tool" role="status">
  <span class="chat-marker-label">Agent: Navigate</span>
</div>
```

Keep existing fade-out timing.

## CSS targets

- Border-radius 14px, glass background matching `.thinking-content`
- Attachment image max 120px thumb; caption 11–12px
- Marker: centered or full-width subtle separator, not a chat bubble

## Verification

- Attach image → card with Remove clears `pendingImages`
- Trigger “go to projects” agentic phrase → marker appears, not a user bubble
- Dark mode contrast OK

## Done criteria

- Attachment card used for pending + in-thread thumbs
- Agentic actions use `.chat-marker`
- No new React components

## Stop conditions

- Stop if agentic chip E2E selectors depend on `.agentic-action-chip` class name — keep that class as an alias on the marker (`class="chat-marker agentic-action-chip"`).

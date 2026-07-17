# Composer Plus menu (InputGroup pattern → vanilla)

Written against: `aaf4a758`

## Why

shadcn chat demo uses `InputGroup` + Plus dropdown: Add Photos & Files, Create Image, Deep Research, Web Search. AssistMe exposes attach / writing / voice as separate icon buttons crowding the composer.

## Evidence

- Composer: `src/index.html` `#chatbot-form` / `#chatbot-input-wrapper`
- Attach already wired: `#chatbot-attach-btn` + `#chatbot-attach-input` in `chatbot.js` `handleAttachFiles`
- Image gen / site search via welcome chips + `rich-media.js` intents

## Scope

**In:** `src/index.html` (composer markup), `src/js/modules/chatbot.js`, `src/assets/css/ai-assistant.css` (+ wwdc liquid glass button size list if needed)  
**Out:** Removing Writing Tools or voice buttons; React dropdowns

## Design decision

Add one **Plus** control that opens a small popover (same pattern as `.writing-tools-popover`). Keep Send + Voice visible. Move Attach into the menu; add Create Image and Search this site actions that call existing `ask()` prompts.

## Steps

1. HTML: insert before attach (or replace attach button visibility):

```html
<button
  type="button"
  id="chatbot-plus-btn"
  class="chatbot-plus-btn"
  aria-label="Add to message"
  aria-expanded="false"
  aria-haspopup="menu"
>
  <i class="fas fa-plus" aria-hidden="true"></i>
</button>
```

Hide the standalone attach button from the bar (`hidden` or remove from visual row) but keep `#chatbot-attach-input`.

2. JS: `togglePlusMenu()` mirroring `toggleWritingTools()` — menu items:
   - Attach image → `attachInput.click()`
   - Create image → `ask('Generate an image of …')` with a short default prompt or focus input with placeholder hint
   - Search this site → reuse existing welcome Search prompt string from `addWelcomeMessage`
   - (Optional) Writing Tools → call `toggleWritingTools()`

3. Close menu on outside click / Escape (copy writing-tools close pattern).

4. CSS: match `.chatbot-writing-btn` sizing (44px in liquid glass); popover above composer, Apple glass tokens (`--apple-blue`, blur).

## Verification

- Keyboard: Enter/Space on Plus opens; Escape closes; menu items are buttons with roles
- Attach still uploads image for vision
- Create image produces Pollinations-enhanced reply (client preprocess)

```bash
node --check src/js/modules/chatbot.js
```

## Done criteria

- Plus menu works without React
- Attach / Create image / Search reachable from menu
- Composer not wider than before on mobile (wrap or hide writing into menu if needed)

## Stop conditions

- If mobile width < 360px and 5 icons still overflow, put Writing Tools inside Plus and stop further visual redesign.

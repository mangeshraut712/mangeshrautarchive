# Portfolio design system

Updated November 24, 2026. This replaces the former gradient, glow, metallic-shine,
and heavy-display styling. The user-approved reference is the clean design-rules
image supplied in this conversation. Apple-style clarity, system typography, and
functional continuity remain the goal.

## 1. Visual contract

- No UI gradients, glow, decorative shine, floating ornaments, or bounce.
- Use sentence case. Preserve proper nouns, acronyms, source titles, and code.
- Use regular (400) and medium (500) text. Semantic emphasis still uses `strong`.
  Icon-font weights are glyph requirements and are not text styling.
- Remove redundant eyebrow labels. Necessary chart titles and status information
  remain readable, unembellished text.
- No decorative pills or icons inside decorative rounded boxes. Functional tabs,
  buttons, toggles, avatars, and status information remain available.
- Flatten nested cards into rows or groups. Retain a container only when it clarifies
  a distinct task or interactive item.
- Shadows belong only to floating surfaces such as dialogs, menus, tooltips, and
  navigation overlays. Static cards, images, and action buttons do not cast shadows.
- Preserve original media, QR pixels and white margins, chart meanings, real data,
  accessible names, keyboard behavior, and all existing actions.

## 1.1 Motion

Use `--ui-motion-fast` (180ms) for interactions and `--ui-motion-enter` (240ms) for
entry. Use ease-out, no bounce or spring overshoot. Decorative loops are retired except the user-requested Skills, Dream Companies, and Dream Cars discovery rails. These use continuous linear motion, pause on hover/focus, an explicit pause button, and static scrollable content under system or in-site reduced motion.
Loading indicators repeat at a readable cadence (1s spinners). Music artwork rotates over 8s and equalizer bars alternate over 700–900ms only during playback. These functional loops are exempt from the 240ms entrance limit. Both system and in-site reduced motion stop music visuals immediately; JavaScript transforms also reset when the preference changes.

## 1.2 Spacing and shape

Use the existing 8pt spacing rhythm. Preserve established responsive layouts and
safe-area padding. Keep 44px effective touch targets. Use 12px button corners and
restrained 18px outer card corners where grouping helps; nested groups use spacing
and separators instead of additional cards. Icon-only functional controls may be
circular, with an accessible label and visible keyboard focus.

## 2. Semantic tokens and typography

`src/assets/css/foundation.css` owns the presentation contract and its semantic
`--ui-*` tokens: surface, muted surface, text, secondary text, accent, on-accent,
border, weights, motion, and floating shadow. Literal colors belong in token
definitions; components consume semantic variables. Existing system/status and
brand tokens retain their meaning. Page and card headings use the theme accent (Apple blue), while body copy keeps neutral text colors. Social glyphs preserve their brand color on hover/focus; monochrome marks adapt to the theme. Light surfaces, including formerly muted surfaces, are solid white and dark surfaces solid black. Borders and spacing distinguish groups.

Keep the existing SF Pro/system font stack and fluid sizes. Establish hierarchy
through size, spacing, and medium weight, not bold text. Body text must retain
4.5:1 contrast; large text and meaningful controls must retain 3:1. Links and focus
rings use the accessible theme accent. Never lowercase names, acronyms, or code
with a global text-transform.

## 3. Controls

Primary actions use a flat accent fill and contrasting text. Secondary actions use
a plain surface or outline. Filters and tabs express selection through fill,
underline, text, and ARIA state. Preserve disclosures, icon-only control labels,
focus entry/restoration, Escape handling, and form error messaging.

## 4. Content surfaces

Use the original portrait and credited publisher/project images. Keep article
reading width, contents navigation, source links, dates, tables, code copy actions,
and image provenance. Preserve terminal code contrast and syntax semantics.
Flatten decorative metadata containers without hiding useful information.

## 5. Ownership and cascade

Load `foundation.css` first on every rendered page, including generated journal
and case-study pages. Its first named cascade layer protects global invariants
from deferred legacy styles, including legacy important declarations. Component
styles own layout and state; retired gradients, glow, heavy weights, and static
shadows are removed at their source. Do not append competing style patches.

Coding agent: GPT-6 / Codex. Purpose: apply the user-approved clean portfolio design
while preserving behavior. Exact model variant, reasoning mode, and token usage:
unavailable.

## 6. Mobile Responsiveness & Viewport Standards (iPhone 17 Pro Max & Apple HIG)

1. **Zero Horizontal Overflow**: `document.documentElement.scrollWidth <= window.innerWidth` across all pages (`index.html`, `systems.html`, `monitor.html`, `travel.html`, `uses.html`, `changelog.html`, `404.html`) and scroll offsets.
2. **Safe-Area Insets & Dynamic Island**: All top navigation bars and full-screen overlays account for `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` with proper spacing so content never collides with hardware cutouts.
3. **Card & Grid Decongestion**:
   - On screens $\le 640\text{px}$, avoid forced multi-column cards that squeeze horizontal text.
   - Timelines (`experience.css`, `education.css`): Maintain a clean `padding-left: 58px` / `70px` with a 40px icon centered on the vertical spine line to prevent strike-through artifacts across card text.
   - Telemetry Panels (`monitor-apple-redesign.css`): Stack control center metrics into structured 2-row tiles (`label row` top, `value row` bottom).
   - Keynote Statistics (`systems.css`): Sized as a compact 2-column grid with full-width CI status badges and horizontally scrollable pill rails.
4. **Touch Target Accessibility**: All interactive buttons, chips, links, and switches must satisfy minimum dimensions of $44 \times 44\text{px}$ (or $\ge 40\text{px}$ with tap padding).

---

### Floating mobile controls

Keep Accessibility, Share, Chat, and Back to Top in a bottom row at widths up to 768px and one vertical column at the safe-area-aware right edge on larger screens. Use at least 44-pixel targets with visible gaps. On desktop, pack the remaining controls down when Back to Top is hidden. Accessibility tools and the Liquid Glass sheet open beside the stack, with viewport-bounded vertical scrolling; they must remain reachable on small portrait and landscape screens.

## 7. Interactive Micro-Experiences & Widgets

### Year Progress Widget (`#calendar-widget .year-progress-widget`)

- **Location**: Rendered dynamically below the Events & Reminders heading in `src/js/modules/calendar.js`.
- **Aesthetic**: Compact year and remaining-day labels with a native progress bar, Apple blue fill, and coordinated light/dark text. Progress uses elapsed calendar days and accounts for leap years.

### Share dialog

Keep the QR code, copy/download actions, and platform choices clearly labeled.
Use a flat surface with a floating-dialog shadow; no decorative scanner, glow,
particle effects, or tilt. Preserve keyboard dismissal and focus restoration.

### Navigation and deferred map controls

Keep the complete site menu available on laptop and desktop widths even when the section rail scrolls. Preserve dialog focus entry, Escape dismissal, and focus restoration. Positioned controls use a layout wrapper so shared button transforms cannot move them outside the viewport. The Travel map prompt remains reachable before loading and after a failed download; the places list stays usable. Article and case-study evidence links own their accessible colors, outside the global link accent override. Scrollable code examples accept keyboard focus.

### AssistMe response and input behavior

- Keep the chat window and composer inside the visible mobile viewport in portrait and landscape.
- Respect active text composition before treating Enter as Send; Shift+Enter inserts a line break.
- Preserve failed drafts and attachments when the composer is empty, and count completed replies.
- Give icon-only response actions explicit accessible labels. Collapsed Details must be hidden from
  assistive technology, and its button must expose the expanded state.
- Mark inferred token usage and throughput as estimates. Keep local response provenance distinct
  from cloud model metadata, and avoid inferring project capabilities from repository names.

---

## 8. Design QA Checklist

Use this checklist before shipping any visual change. Each item maps to a documented
section in this specification.

### Pre-commit visual checks

- [ ] **Typography**: System font stack, fluid sizes, and regular/medium weights match §2
- [ ] **Color tokens**: All colors reference CSS custom properties, not hardcoded hex
- [ ] **Theme parity**: Component renders correctly in light, dark, and high-contrast
- [ ] **Button tier**: Primary, secondary, and selected controls follow §3
- [ ] **Card surfaces**: Solid white/black through `--bg-primary`, no gray fills
- [ ] **Border radius**: Matches §1.2 scale (18px cards, 12px buttons, functional segmented controls)
- [ ] **Spacing**: Paddings and margins align to 8pt grid (§1.2)
- [ ] **Motion**: Transitions use documented curves and durations (§1.1)
- [ ] **Reduce-motion**: `prefers-reduced-motion` override present for all animations
- [ ] **Contrast**: WCAG AA ratios verified (≥4.5:1 body, ≥3.0:1 large text)
- [ ] **Touch targets**: All interactive elements ≥ 44×44px effective area
- [ ] **Zero overflow**: `scrollWidth ≤ innerWidth` at 375px, 768px, and 1440px
- [ ] **Close buttons**: Existing visible close control inside a 44px hit area

### Hero music card

Use a compact rectangular grid with circular artwork on the left, track and artist in the
middle, listening status beneath them, and preview / Apple Music / Spotify controls at the
upper right. Use 80px artwork on desktop and 64px on mobile. Visible control circles are
32px with 22px service symbols (18px play triangle); preserve 44px hit areas and a compact
preview timeline.
Artwork rotation follows local audio preview playback; Last.fm listening status alone does
not rotate it. Pause rotation when playback pauses or ends, and disable it under reduced motion.

### Browser tab icons

Tab icons follow the operating-system color scheme independently of the in-page theme toggle.
`src/js/core/favicon.js` selects a PNG with an explicit contrasting background and listens for system changes. Standalone
pages and generated article/case-study heads use the same icon pair. The legacy ICO/PNG fallback
uses a white mark on a black tile; the no-JavaScript SVG adapts through its own media query.

### Viewport verification matrix

| Page             | 375px | 430px | 768px | 1024px | 1440px |
| :--------------- | :---: | :---: | :---: | :----: | :----: |
| `index.html`     |   ☐   |   ☐   |   ☐   |   ☐    |   ☐    |
| `systems.html`   |   ☐   |   ☐   |   ☐   |   ☐    |   ☐    |
| `monitor.html`   |   ☐   |   ☐   |   ☐   |   ☐    |   ☐    |
| `travel.html`    |   ☐   |   ☐   |   ☐   |   ☐    |   ☐    |
| `uses.html`      |   ☐   |   ☐   |   ☐   |   ☐    |   ☐    |
| `changelog.html` |   ☐   |   ☐   |   ☐   |   ☐    |   ☐    |
| `404.html`       |   ☐   |   ☐   |   ☐   |   ☐    |   ☐    |

### Agent design skills

Some developer environments install three design audit skills under the ignored `.agents/skills/` directory. They are optional local tools, not files supplied by this repository. When absent, apply the tracked checklist above directly:

| Skill                    | Purpose                                                      |
| :----------------------- | :----------------------------------------------------------- |
| `apple-design-critique`  | Full visual critique against HIG and this spec               |
| `responsive-audit`       | Multi-viewport overflow, touch-target, and layout audit      |
| `animation-motion-audit` | Motion timing, easing, performance, and reduce-motion review |

### AssistMe viewport and response layout

- Desktop chat starts 12px below the navigation height and uses the remaining viewport above its launcher. Remove fixed 620px height caps; the transcript scrolls inside the window while the composer remains reachable.
- Mobile chat fits the available viewport below navigation with safe-area clearance. Header controls have a minimum 44px target.
- Response details remain collapsed until requested. Model names come from the answering service and appear once in Details. General questions do not receive unrelated portfolio shortcut chips.

### AssistMe multimodal attachments and routing details

- Use one attachment rail for image, audio, video, PDF, and text files. Non-image files use readable
  file names and Apple Blue icons; images retain previews. Keep Remove reachable at mobile widths.
- Show the answering model and actual source links in collapsed Details. Routing, billing, and token telemetry stay out of the public interface.
- Never show provider errors or reasoning traces as answer prose. A failed attachment gets a clear
  processing notice rather than a portfolio answer. Cloud speech readiness requires availability
  evidence; a configured key alone is insufficient.

### Journal and article reading experience

The standalone journal uses Apple Newsroom and Apple Machine Learning Research as design references:
restrained system typography, explicit metadata, clear discovery controls, and credited media.
Article text has a maximum 720px measure with 19px desktop / 18px mobile body copy.
Contents collapse on small screens; their links have 44px targets. Archive search and topic filters
combine across all 22 articles, including the featured story, with newest/oldest/title sorting
and a resettable empty state. Reading progress measures only the article body. Author links,
RSS, and canonical-link copying remain separate from source citations. Existing evidence dates
are preserved; presentation changes do not imply fresh factual verification.

Coding agent: GPT-6 / Codex desktop. Purpose: journal presentation and reader navigation.
Exact model variant, reasoning mode, and token usage: unavailable.

### Journal evidence and editorial depth

Content revisions preserve the reader layout above. Give each article a concrete worked example,
a useful comparison table, visible publisher-image attribution, and links to the primary evidence.
Label hypothetical quantities and vendor-reported results; do not imply a personal benchmark or
hands-on trial that was not performed. Keep archive issue dates, original publication dates, and
editorial review dates distinct. Refresh the reading estimate after editing the body, and let the
shared renderer regenerate the contents links from the actual headings.

The November 9 review covers all 20 articles; its [evidence ledger](qa/blog-content-review-2026-11-09.md)
records the source-to-claim mapping and media retrieval limitations. A successful source fetch does
not independently validate a publisher's performance claim. Original media retain their proportions,
credit, and provenance; diagrams created for explanation are labeled conceptual.

Coding agent: GPT-6 / Codex desktop. Purpose: researched article content and evidence transparency.
Exact model variant, reasoning mode, and token usage: unavailable.

### Public screenshot evidence

README captures belong in `docs/screenshots/`, outside the production asset tree. Use `node scripts/qa/capture-readme-screenshots.mjs` with Chrome installed. The script visits the real site at 375px, 768px, and 1440px in both themes, enables reduced motion, verifies page-level horizontal overflow, and records URLs and the source revision. Inspect the actual images before publishing. The manifest is evidence for these captured states, not every interaction or browser.

### Narrow-screen utility controls

At widths up to 768px, shared accessibility, sharing, chat, and back-to-top controls use one bottom row, preserving 44px circles and safe-area insets. Content receives bottom clearance and anchor scrolling reserves space for the controls. Accessibility options open above the row; desktop retains the vertical stack. Do not position a tall stack over article text or Contact clocks.

Article workflows beginning with numbered Markdown items render as native ordered lists. Keep their starting number, inline emphasis, and paragraph spacing; do not collapse sequential instructions into a prose paragraph.

### Public Monitor status view

The Monitor opens with grouped service availability and retains technical diagnostics in secondary tabs. Use scoped `portfolio-status.css` styles, 44px controls, semantic service disclosures, and text labels alongside status colors. Empty observation bars mean no recorded check; never manufacture historical uptime. Unknown or stale probes must not render as operational. Dark-theme accent text uses a brighter Apple Blue for AA contrast.

Persistent availability uses 90 daily bars with UTC details, sampled uptime, and separate check coverage. Missing days stay empty. Keep incident confirmation and recovery timestamps visible, distinguish live probes from stored incidents, and show history-fetch errors without replacing saved records. Disclosures remain expanded during refresh; hidden pagination controls must override shared button display rules.

### Work showcase data and interaction

The Projects & contributions surface uses the existing centered medium-weight section header, then a restrained editorial milestone with verified external merged PRs, three source-linked contribution stories, and a searchable merge ledger. Projects, Hackathons, and Bug Bounties are mutually exclusive streams within the existing Projects destination. Original-project discovery excludes forks and profile infrastructure; hackathon context links to repository evidence and does not imply an award or accepted submission. The Bug Bounties stream distinguishes verified public disclosures from ordinary security fixes and makes no unverified payout claim. The wider GitHub statistics and contribution graph follow the curated work; unknown activity starts as an em dash rather than a fabricated number.

Public work snapshots refresh through the gated Pages pipeline every six hours. New original repositories tagged `hackathon`, `hackathons`, or `portfolio-hackathon` enter Hackathons; untagged, uncurated builds enter Projects. Stable repository IDs and normalized PR identities prevent duplicate cards and ledger rows.

Catalog provenance and freshness sit beside an explicit refresh action. Missing activity is an em dash; legitimate zero remains zero. Contributor and recent-commit totals identify the loaded subset instead of implying a complete portfolio total. Activity hydration follows visible cards. Repository previews trap keyboard focus and restore it on dismissal; contribution cells use arrow-key navigation with one tab entry. Compact showcase controls retain 44px targets in both themes. See [verification](qa/project-showcase-2026-11-10.md).

### Support payment QR selector

The Support card keeps One-Time, Monthly, and QR Codes as its primary modes. Inside QR Codes,
a labeled native selector switches between UPI, Zelle, and Cash App, showing one 176px code.
Desktop and tablet place payment guidance beside the code; narrow phones stack the guidance
below it. Preserve the supplied QR pixels and sufficient white scanning margins. Full-size
view uses a native dialog with a 32px red close circle inside a 44px hit target, Escape dismissal,
and focus restoration. Keep the selector at least 44px tall and support both themes.

Coding agent: GPT-6 / Codex. Purpose: compact payment selection and a clean enlarged QR viewer.
Exact model variant, reasoning mode, and token usage: unavailable.

### Public calendar and compact chat

Hide Panchang unless all daily fields match today and the official source. Keep sync timestamps, browser-storage implementation notes, and owner sign-in links out of the public calendar. AssistMe shows a single set of response actions; model and source details expand on demand. No public routing, billing, or token telemetry. The launcher hides while chat is open and the composer uses one focus ring.

# Mobile Home Spacing and Utility Dock Design

## Goal

Restore an Apple-style rhythm to the mobile Home hero without breaking the established centered identity, action order, solid surfaces, or desktop layout. Move the floating Accessibility, Share, and AssistMe controls from the centered bottom row into a vertical bottom-right dock.

## Root cause

The final mobile hero stylesheet currently collapses both the layout wrapper and text block to `0.5rem` gaps. A later final-authority theme block independently replaces the desktop right-side FAB stack with a centered mobile row. The mobile E2E suite asserts that centered row, so the undesired behavior is encoded in both CSS and tests rather than caused by a stale deployment.

## Considered approaches

1. **Adaptive vertical rhythm and right dock (selected).** Use larger group-level gaps on normal phone heights, preserve the first-viewport composition where it fits, and allow natural scrolling on short phones. Keep the controls in one fixed bottom-right column.
2. **Strict one-viewport scaling.** Reduce fonts, controls, and gaps until every device fits. This repeats the cramped appearance and weakens accessibility.
3. **Always-scroll mobile hero.** Use generous fixed spacing at every height. This is simple but introduces unnecessary scrolling and excess empty space on tall phones.

## Approved layout

- Keep the existing centered order: portrait; name and identity; title and rotating role; badges; music card; description; View Projects; Download Resume.
- Replace the uniform compact gap with deliberate group-level spacing. Identity elements remain closely related, while the title, role, insights, description, and actions receive clearer separation.
- Keep the hero within the usable first viewport on standard modern phones when the content fits naturally.
- On short viewports, align the hero from the top with safe padding and allow normal document scrolling instead of compressing content.
- Preserve full-width mobile actions, with View Projects above Download Resume.
- Keep the About section in normal flow below Home.

## Utility dock

- Accessibility, Share, and AssistMe use 44-by-44-pixel circular controls in one fixed vertical column at the bottom-right.
- The dock respects right and bottom safe-area insets and uses a consistent 10-pixel visual gap.
- When Back to Top becomes visible, it occupies the next slot above the three persistent controls.
- Dock controls remain outside the hero reading path and must not overlap hero actions or text.
- Opening the resume menu temporarily hides the dock, preserving the existing collision-avoidance behavior.
- Solid Apple blue surfaces and white glyphs remain unchanged in both themes.

## Responsive behavior

- The mobile rule applies at 768 pixels and below.
- Standard-height phones use balanced vertical centering and responsive gaps.
- Short-height phones use top alignment and scrolling without shrinking tap targets or body text.
- Desktop and tablet rules above the mobile breakpoint remain unchanged.
- No horizontal overflow is permitted.

## Verification

- Replace the centered-row E2E assertions with vertical-column, right-edge, bottom-inset, and inter-control-gap assertions.
- Add assertions for meaningful group spacing and no overlap between the fixed dock and Home content.
- Verify the standard 500-by-862 viewport remains balanced and the short-phone fixture scrolls naturally.
- Verify View Projects stays above Download Resume and the resume menu still hides the dock while open.
- Run the focused mobile Playwright tests on Pixel 7 Chrome and iPhone 14 Safari, then ESLint, Stylelint, Prettier, Vitest, production build, and the security scan.

## Scope

Change only the final Home hero layout owner, the final utility-dock rules, and their focused regression tests. Do not alter page content, navigation, desktop composition, APIs, or unrelated sections.

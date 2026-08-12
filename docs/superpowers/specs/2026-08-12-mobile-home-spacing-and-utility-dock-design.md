# Mobile Home Spacing and Utility Dock Design

## Goal

Restore an Apple-style hierarchy and rhythm to the mobile Home hero without breaking the established centered identity, action order, solid surfaces, or desktop layout. Use a top-balanced composition with restrained image, heading, text, card, and control sizes. Keep Accessibility, Share, and AssistMe in a vertical bottom-right dock.

## Root cause

The first correction fixed the horizontal utility row and increased the uniform wrapper gaps, but browser measurements exposed a second problem: geometric centering does not create visual balance. At 390 by 844 pixels, the hero leaves roughly 111 pixels between the navigation and portrait, then packs a 558-pixel content stack into the middle of the viewport. The music card consumes about 88 pixels, the portrait is 76 pixels, the name is approximately 30 pixels, and internal gaps vary from 5 to 16 pixels. The result technically fits while still feeling oversized, uneven, and crowded near the actions and utility dock.

## Considered approaches

1. **Top-balanced proportional composition (selected).** Start the hero a controlled distance below navigation, use a restrained type and image scale, reduce secondary-card dominance, and follow an 8-pixel/12-pixel rhythm. This preserves readability while preventing both the large top void and lower-page crowding.
2. **Strict centered scaling.** Keep geometric centering and shrink every component until the composition appears balanced. This retains the current structural problem and makes text and tap targets less accessible.
3. **Two-zone hero.** Separate identity from description/actions into distinct visual panels. This creates unnecessary card nesting and moves away from the requested simple Apple presentation.

## Approved layout

- Keep the existing horizontally centered order: portrait; name and identity; title and rotating role; badges; music card; description; View Projects; Download Resume.
- Top-align the composition within Home using approximately 40 to 48 pixels of space below the navigation instead of centering the complete stack in the remaining viewport.
- Size the portrait at 68 pixels on standard phones. Preserve the circular crop, single 2-pixel Apple-blue ring, and restrained shadow.
- Size the name at approximately 28 pixels with tight Apple-style tracking and a compact verified badge. Keep it on one line at 390 pixels and above.
- Keep the pronoun and pronunciation controls in one centered row with 34-to-36-pixel heights.
- Use approximately 16 pixels for the job title and 20-to-22 pixels for the highlighted rotating role. Retain the existing copy and solid blue emphasis.
- Keep the two insight badges at 36-to-38-pixel heights, with reduced horizontal padding so they read as secondary metadata.
- Reduce the music card from approximately 88 pixels to 62-to-66 pixels. Use 42-to-44-pixel artwork, one compact status line, one title line, and one artist line without clipping.
- Keep the three description lines at approximately 13 pixels with 18-to-19-pixel line height. Preserve blue emphasis but reduce the visual weight relative to the identity.
- Use a consistent 8-pixel/12-pixel spacing rhythm. Identity elements remain closely related; major groups receive 12 pixels; action separation remains 8 pixels.
- Keep Home within the usable first viewport on standard modern phones. On short viewports, use the same component sizes and allow natural document scrolling instead of compressing typography or tap targets.
- Keep the mobile action rail clear of the utility dock, with View Projects above Download Resume and 46-to-48-pixel control heights.
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
- Standard-height phones use the top-balanced proportional composition and do not expose the About section in the first viewport.
- Short-height phones use the same top alignment and scroll naturally without shrinking tap targets or body text.
- Desktop and tablet rules above the mobile breakpoint remain unchanged.
- No horizontal overflow is permitted.

## Verification

- Replace the centered-row E2E assertions with vertical-column, right-edge, bottom-inset, and inter-control-gap assertions.
- Add assertions for the image, name, title, role, music-card, description, and action size ranges defined above.
- Add assertions for the 8-pixel/12-pixel rhythm, controlled navigation-to-portrait offset, and no overlap between the fixed dock and Home content.
- Verify the standard 390-by-844 and 500-by-862 viewports fit the complete Home composition while the short-phone fixture scrolls naturally.
- Verify View Projects stays above Download Resume and the resume menu still hides the dock while open.
- Run the focused mobile Playwright tests on Pixel 7 Chrome and iPhone 14 Safari, then ESLint, Stylelint, Prettier, Vitest, production build, and the security scan.

## Scope

Change only the final Home hero layout owner, the final utility-dock rules if required for collision clearance, resume-menu positioning if required to preserve bottom placement, and focused regression tests. Do not alter page copy, navigation, desktop composition, APIs, or unrelated sections.

# Centered Home Hero Design

## Goal

Restore the homepage to a simple, center-aligned Apple-style presentation that fits entirely within the first usable viewport while keeping the About section below the fold. Remove the apparent duplicate Namaste launch and make the resume edition menu use the open space beneath its button.

## Considered approaches

1. **Centered vertical hero (selected).** Place the portrait above the identity and supporting content, keep every block centered, and size vertical gaps responsively. This matches the approved reference, reads clearly in both themes, and gives the About section a deterministic boundary below the first viewport.
2. **Centered two-column hero.** Keep the portrait beside the text while centering the overall block. This uses wide screens efficiently, but it does not match the requested previous layout and makes the visual center depend on copy length.
3. **Breakpoint-dependent desktop compositions.** Use a vertical layout on medium screens and a two-column layout on very wide screens. This adds layout branches without serving the requested single, consistent presentation.

## Approved layout

- The Home section occupies at least the usable viewport below the fixed navigation.
- A single narrow content column is horizontally centered.
- The order is portrait, name and identity, title and rotating role, insight badges, music card, description, and actions.
- Vertical spacing uses compact responsive values so the full Home composition fits common desktop and laptop viewports without exposing the About heading.
- Mobile remains a centered stack with full-width actions where required, without horizontal overflow.
- The About section stays in normal document flow and starts only after Home's viewport boundary; it is not hidden or merged into Home.

## Launch behavior

- Keep one `#launch-intro` and one Hindi `नमस्ते` SVG.
- Apply the initial path state in critical inline CSS so the full SVG cannot flash before the deferred animation stylesheet loads.
- Display only the large final geometry and play the launch at most once per session.
- Preserve reduced-motion and automation bypass behavior.

## Resume menu

- The menu always opens below the Download Resume button.
- The page scrolls naturally if a short viewport cannot show the complete menu; the menu must not cover the hero content above the button.
- Preserve focus management, keyboard navigation, download behavior, accessibility attributes, and dual-host-safe URLs.
- Use a solid white menu in light mode and solid black menu in dark mode, with a clear border and no grey or translucent panel fill.

## Visual language

- Page and elevated surfaces use solid `#ffffff` in light mode and solid `#000000` in dark mode.
- Apple blue remains the primary action and accent color.
- Secondary controls use the page background plus a subtle neutral border; grey is limited to text and borders, not surface backgrounds.
- Shadows remain restrained and are not used to simulate glass or grey elevation.

## Verification

- Unit contract: one launch element, critical hidden path state, centered single-column desktop layout, viewport-sized Home boundary, and bottom-only resume placement.
- Browser contract: at desktop and mobile sizes, Home has no horizontal overflow; all hero blocks are centered; About begins at or below the viewport bottom; and the open resume menu appears below its toggle.
- Run the focused unit and Playwright tests first, then the repository lint/unit gate and production build.

## Scope

Only the homepage hero, launch-intro critical state, and resume-menu placement/surfaces are changed. Other page sections, API behavior, content, and navigation remain unchanged.

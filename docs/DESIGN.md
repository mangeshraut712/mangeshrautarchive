# DESIGN.md — Apple Human Interface Portfolio Design System

> **Standard:** Apple Human Interface Guidelines (HIG) + Liquid Glass Design Language (2026)  
> **Source of Truth:** `docs/DESIGN.md` & `src/assets/css/`  
> **Rule for Agents & Contributors:** Read and follow this specification before creating, updating, or modifying any page, card, section, button, theme, or component.

---

## 1. Design Philosophy

The portfolio follows authentic **Apple Design Principles**:

1. **Clarity & Content First**: Typography and hierarchy guide the eye effortlessly. Text is crisp with high contrast (WCAG AA compliant, ≥ 4.5:1 for body, ≥ 3.0:1 for large text).
2. **Authentic Apple Colors & Gradients**: Vibrant Apple system colors with polished depth (Apple Blue `#0071e3`, Apple Red `#ff3b30`, Apple Green `#34c759`, Apple Purple `#af52de`). Primary CTAs feature vibrant Apple linear gradients (`135deg, #0077ed 0%, #0071e3 50%, #005bb5 100%`) paired with specular metallic sweep sheen animations.
3. **Restrained Depth & Glassmorphism**: Frosted translucency (`backdrop-filter: blur(20px)`), subtle 1px border highlights (`rgba(255, 255, 255, 0.15)` in dark, `rgba(0, 0, 0, 0.08)` in light), and soft ambient shadows.
4. **Physicality & Tactile Feedback**: Micro-interactions use cubic-bezier curves (`cubic-bezier(0.16, 1, 0.3, 1)` or `scale(0.98)` on press).
5. **Zero Cliché Anti-Patterns**:
   - 🚫 **NO raw horizontal overflow** or layout shift.
   - 🚫 **NO low-contrast text** (e.g. white text on light backgrounds or faint gray comments in code blocks).

---

## 2. Design Tokens & Palette

### System Color Palette

| Token                               | Light Mode Value                                | Dark Mode Value              | Usage                                                              |
| :---------------------------------- | :---------------------------------------------- | :--------------------------- | :----------------------------------------------------------------- |
| `--apple-blue` (Primary CTA)        | `#0071e3` (Hover: `#0077ed`, Active: `#0062c4`) | `#0071e3` / `#0a84ff`        | Primary action buttons, active tabs, active chips, key links, FABs |
| `--apple-red` (Destructive / Close) | `#ff3b30` (Hover: `#ff453a`, Active: `#d70015`) | `#ff3b30` (Hover: `#ff453a`) | All modal close buttons, stop buttons, error indicators            |
| `--apple-green` (Success)           | `#34c759` (Hover: `#30d158`)                    | `#30d158` / `#34c759`        | Live statuses, success copy toasts, online badges                  |
| `--apple-purple` (Accent / AI)      | `#5856d6` / `#af52de` (Tinted text: `#4338ca`)  | `#bf5af2` / `#5e5ce6`        | Agentic AI features, Liquid Glass tinted badges                    |
| `--apple-orange` (Warning)          | `#ff9500`                                       | `#ff9f0a`                    | Notice tags, warning badges, highlighted tokens                    |

### Surfaces & Backgrounds

| Token / Surface                   | Light Mode (Solid White)                    | Dark Mode (Solid Black)                            | High-Contrast Mode                          |
| :-------------------------------- | :------------------------------------------ | :------------------------------------------------- | :------------------------------------------ |
| **Canvas Background**             | `#ffffff` (Solid Pure White)                | `#000000` (Solid Pure Black)                       | `#ffffff` / `#000000`                       |
| **Secondary Background / Card**   | `#ffffff` (Solid Pure White)                | `#000000` (Solid Pure Black)                       | `#ffffff` / `#000000` with 2px solid border |
| **Tertiary / Grouped Background** | `#ffffff` (Solid Pure White)                | `#000000` (Solid Pure Black)                       | `#000000` / `#ffffff`                       |
| **Elevated Glass Card**           | `#ffffff` with subtle border `#e5e5ea`      | `#000000` with subtle border `#2c2c2e`             | Solid `#ffffff` / `#000000`                 |
| **Terminal / Code Block**         | `#1c1c1e` (macOS Dark Terminal)             | `#000000` (1px border `rgba(255, 255, 255, 0.12)`) | Solid `#000000` with white monospace text   |
| **Border Sub-surface**            | `1px solid #e5e5ea` (`rgba(0, 0, 0, 0.08)`) | `1px solid #2c2c2e` (`rgba(255, 255, 255, 0.12)`)  | `2px solid #000000` / `#ffffff`             |

### Typography Hierarchy

| Level                  | Font Family                                                       | Size                  | Weight           | Line Height     | Tracking   |
| :--------------------- | :---------------------------------------------------------------- | :-------------------- | :--------------- | :-------------- | :--------- |
| **Hero Title / H1**    | `-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif` | `2.5rem` – `3.75rem`  | `700` (Bold)     | `1.08` – `1.15` | `-0.025em` |
| **Section Title / H2** | `'SF Pro Display', sans-serif`                                    | `1.75rem` – `2.25rem` | `700` (Bold)     | `1.2`           | `-0.02em`  |
| **Card Header / H3**   | `'SF Pro Display', sans-serif`                                    | `1.25rem` – `1.5rem`  | `600` (Semibold) | `1.3`           | `-0.015em` |
| **Subhead / H4**       | `'SF Pro Text', sans-serif`                                       | `1.05rem` – `1.15rem` | `600` (Semibold) | `1.4`           | `-0.01em`  |
| **Body Text**          | `'SF Pro Text', sans-serif`                                       | `1rem` (`16px`)       | `400` (Regular)  | `1.65`          | `-0.005em` |
| **Caption / Meta**     | `'SF Pro Text', sans-serif`                                       | `0.85rem` – `0.9rem`  | `500` (Medium)   | `1.4`           | `0`        |
| **Code / Monospace**   | `SFMono-Regular, Consolas, Menlo, monospace`                      | `0.88rem` – `0.9rem`  | `500` / `600`    | `1.65`          | `0`        |

---

## 3. Standard 6-Tier Component & Button Hierarchy

The design system enforces a strictly unified 6-tier button architecture across all 7 pages (`index.html`, `systems.html`, `monitor.html`, `travel.html`, `uses.html`, `changelog.html`, `404.html`):

### Tier 1: Primary Action CTAs (`.btn-primary`, `.hero-cta-primary`, `.btn-resume`, `.contact-send-btn`, `.apple-submit-btn`, `.newsletter-submit-btn`, `.btn-demo`, `.project-action-btn.btn-demo`, `.projects-view-all-btn`, `.engineering-open-btn`, `.publication-read-btn`, `.error-btn--primary`, `.dictation-dock-btn.is-primary`)

- **Visual Style**: Vibrant Apple Blue Gradient (`linear-gradient(135deg, #0077ed 0%, #0071e3 50%, #005bb5 100%)`) with specular metallic sweep animation (`@keyframes appleBtnShine`) and glowing drop shadow.
- **Specifications**:
  - `min-height: 48px; padding: 0.75rem 1.6rem; border-radius: 12px;` (or `9999px` for pill CTA)
  - `background-image: linear-gradient(135deg, #0077ed 0%, #0071e3 50%, #005bb5 100%) !important;`
  - `color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;`
  - `border: 1px solid rgba(255, 255, 255, 0.25) !important;`
  - `box-shadow: 0 4px 16px rgba(0, 113, 227, 0.38), 0 2px 4px rgba(0, 0, 0, 0.08) !important;`
- **States**:
  - **Hover**: `background-image: linear-gradient(135deg, #0080ff 0%, #0071e3 50%, #0066cc 100%) !important; transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 24px rgba(0, 113, 227, 0.48), 0 3px 8px rgba(0, 0, 0, 0.12) !important;`
  - **Active / Press**: `transform: scale(0.97);`
  - **Shine Animation**: Specular translucent sweep on `::before` pseudo-element with 4.5s loop (`@keyframes appleBtnShine`).

### Tier 2: Secondary & Frosted Glass Action Buttons (`.btn-secondary`, `.button-secondary`, `.apple-btn-secondary`, `.hero-cta-secondary`, `.btn-glass`, `.btn-github`, `.btn-ar`, `.error-btn--secondary`)

- **Specifications**:
  - `min-height: 48px; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600;`
  - `backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`
- **Light Mode**:
  - `background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 247, 0.8) 100%);`
  - `color: #1d1d1f !important; -webkit-text-fill-color: #1d1d1f !important;`
  - `border: 1px solid rgba(0, 0, 0, 0.14); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);`
  - **Hover**: `color: #0071e3; border-color: #0071e3; background-color: rgba(0, 113, 227, 0.06); box-shadow: 0 6px 18px rgba(0, 113, 227, 0.18); transform: translateY(-2px) scale(1.02);`
- **Dark Mode**:
  - `background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%);`
  - `color: #f5f5f7 !important; -webkit-text-fill-color: #f5f5f7 !important;`
  - `border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);`
  - **Hover**: `color: #2997ff; border-color: #2997ff; background-color: rgba(41, 151, 255, 0.14); box-shadow: 0 6px 18px rgba(41, 151, 255, 0.25); transform: translateY(-2px) scale(1.02);`

### Tier 3: Filter Chips, Segmented Tabs & Category Pills (`.proj-filter-btn`, `.project-lens-chip`, `.about-tab-btn`, `.systems-arch-tab`, `.systems-filter-chip`, `.country-pill`, `.travel-filter-chip`, `.travel-action`, `.travel-advanced-toggle`, `.uses-filter-chip`, `.uses-control-tile`, `.changelog-chip`, `.changelog-filters-toggle`, `.log-tab-btn`, `.monitor-filter-btn`, `.skills-radar-pill`, `.share-mirror-tab`)

- **Specifications**: `min-height: 38px; border-radius: 9999px; font-size: 0.88rem; font-weight: 580;`
- **Inactive State**:
  - Light Mode: `background-image: linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%); color: #1d1d1f; border: 1px solid rgba(0, 0, 0, 0.14); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);`
  - Dark Mode: `background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%); color: #f5f5f7; border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);`
  - Hover: subtle elevation lift `translateY(-1px)`, border colored with Apple Blue (`#0071e3` / `#2997ff`).
- **Active State (`.active`, `.is-active`, `[aria-selected="true"]`, `[aria-pressed="true"]`)**:
  - `background-image: linear-gradient(135deg, #0077ed 0%, #0071e3 50%, #005bb5 100%) !important;`
  - `color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;`
  - `border: 1px solid rgba(255, 255, 255, 0.25) !important;`
  - `box-shadow: 0 3px 12px rgba(0, 113, 227, 0.4) !important;`

### Tier 4: Disclosure / Preview / "View More" Buttons (`.section-preview-btn`, `.skills-radar-toggle-btn`, `.arch-tree-toggle-btn`, `.blog-view-more-btn`, `.view-more-btn`, `.btn-view-more`, `.systems-view-more-btn`, `.travel-view-more-btn`, `.uses-view-more-btn`, `.engineering-open-btn`)

- **Specifications**: `min-height: 46px; border-radius: 9999px; padding: 0.65rem 1.6rem; font-size: 0.92rem; font-weight: 600;`
- **Rest State**: Frosted surface with Apple Blue outline and text.
- **Hover State**: Vibrant Apple Blue gradient fill with pure white text and glowing shadow.

### Tier 5: Floating Action Buttons (FABs) & System Controls (`#chatbot-toggle`, `#go-to-top`, `#website-share-toggle`, `.a11y-toolbar__main`, `.travel-nav__projection`, `.travel-nav__theme`, `.travel-nav__panel`, `.monitor-page-nav__theme`, `.error-theme-btn`)

- **Dimensions**: `48px × 48px` circular (`border-radius: 50%`).
- **Color**: Solid Apple Blue gradient or frosted glass with Apple Blue hover.
- **Shadow**: `0 4px 16px rgba(0, 113, 227, 0.35)`.

### Tier 6: Circular Red Close Buttons (`.apple-close-btn`, `.shortcuts-modal__close`, `.blog-modal-close`, `.publication-modal-close`, `#search-close`, `#close-menu-btn`, `.photo-gallery-close`, `.website-share-close`, `.chatbot-close-btn`, `.blessing-modal-close`)

- **Dimensions**: `32px × 32px` (Min: `32px`, Max: `36px`)
- **Shape**: `border-radius: 50% !important;`
- **Color**: `background: #ff3b30 !important; color: #ffffff !important;`
- **Icon**: Clean SVG cross vector or FontAwesome `xmark` (centered, white).
- **Hover**: `background: #ff453a !important; transform: scale(1.08) !important; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.45) !important;`
- **Active**: `transform: scale(0.94) !important;`

---

## 4. Cards, Containers, & Code Blocks

### 1. Apple Glass Cards (`.bento-card`, `.project-card`, `.blog-card`)

- **Light Mode**: `background: #ffffff; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 18px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);`
- **Dark Mode**: `background: #1c1c1e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 18px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);`
- **Hover**: Subtle lift `translateY(-3px)`, enhanced border luminescence.

### 2. Code Blocks (`.article-code-wrap`, `.article-code-block`)

- **Container**: Dark charcoal terminal `#1c1c1e` (Light Mode) / `#000000` (Dark Mode) with 1px border `#2c2c2e`.
- **Header Bar (`.article-code-header`)**: `#252528` (Light) / `#141416` (Dark) with uppercase monospace language tag `#a1a1a6` and solid Apple Blue `#0071e3` copy button.
- **Code Content (`pre`, `code`)**: Always transparent background with crisp, high-contrast `#f5f5f7 !important; -webkit-text-fill-color: #f5f5f7 !important; font-family: SFMono-Regular, Consolas, Menlo, monospace; font-size: 0.88rem; line-height: 1.65;`.
- **Strict Theme Guard**: Global light mode rules (`html:not(.dark)`) must NEVER force `pre` or `code` inside terminal containers to `background: #ffffff`.
- **Inline Code (`.article-inline-code`)**:
  - Light Mode: `background: #f2f2f7; border: 1px solid #d1d1d6; color: #0071e3; font-weight: 600;`
  - Dark Mode: `background: #1c1c1e; border: 1px solid #3a3a3c; color: #ff9f0a;`

### 3. Author Byline & Profile Avatar Standard

- **Avatar Image**: Always use Mangesh Raut's personal portrait (`assets/images/profile.webp` / `assets/images/profile-mobile.webp`), NEVER generic icons (`profile-icon.webp`), placeholder logos, or abstract symbols.
- **Byline Typography**: Author name in bold `#1d1d1f` (Dark: `#f5f5f7`), date & read-time metadata in `#6e6e73` (Dark: `#a1a1a6`).

### 4. Blog & Longform Article Typography System

- **Kicker (`.article-kicker`)**: Apple Blue `#0071e3` (`#2997ff` in dark), `0.8rem`, `750` weight, uppercase with `0.06em` tracking.
- **Title (`.article-title`)**: Heavy Display `-apple-system, BlinkMacSystemFont, 'SF Pro Display'`, `clamp(1.85rem, 4.5vw, 2.75rem)`, `800` weight, `#1d1d1f` (Dark: `#f5f5f7`), line height `1.12`.
- **Reader Promise (`.article-promise`)**: `#515154` (Dark: `#a1a1a6`), `1.05rem` – `1.18rem`, line height `1.55`.
- **Body Text (`.article-body`, `.article-p`)**: SF Pro Text, `1.0625rem` (`17px`), line height `1.75`, color `#1d1d1f` (Dark: `#f5f5f7`).
- **Section Headings (`h2`, `h3`)**: SF Pro Display, bold `700`, `#1d1d1f` (Dark: `#f5f5f7`), with subtle 1px border underline on `h2`.
- **Callouts (`.article-callout`)**: Light tinted backgrounds (Tip: Green, Architecture: Purple, Info: Blue) with 1px border and high-contrast dark text `#1d1d1f` in light mode.
- **Tables (`.article-table`)**: Clean Apple Developer table style with `#f2f2f7` headers (Dark: `#2c2c2e`), 1px borders, and hover row highlights.

### About Section (`#about`)

- **Layout**: One two-column block — graduation photo + a single information card. No extra chapter cards or highlight grids below.
- **Hierarchy**: Section title `About` → lede → Full Story / Quick Summary segmented control inside the card.
- **Full Story**: Five narrative paragraphs in the card, then compact milestone pills (not duplicate cards). Body `#3c3c43` / Dark `#d2d2d7`.
- **Quick Summary**: The same facts as a 2-column bento inside the same card (1-column ≤700px). Do not repeat those tiles outside the tab.
- **Visibility**: Active tab uses Apple Blue with white text; inactive tabs keep high-contrast labels in both themes.

---

## 5. CSS Cascade & File Organization

CSS files in `src/assets/css/` are layered systematically:

1. **Foundation & Variables**: `variables.css`, `apple-design-system.css`, `base.css`
2. **Page Styles**: `index.css`, `systems.css`, `monitor.css`, `travel-atlas.css`, `uses.css`, `changelog.css`, `404.css`, `blog.css`, `about.css`
3. **Feature Modules**: `ai-assistant.css`, `share-widget.css`, `accessibility.css`
4. **Design Overrides**: `apple-premium-overrides.css`, `premium-enhancements.css`, `theme-solid-surfaces.css`, `sitewide-design-system.css`

**Cascade Guidelines**:

- When adding or modifying styles, prefer using standard CSS custom properties (`var(--apple-blue)`, `var(--apple-bg)`, etc.).
- Avoid redundant `!important` declarations except where overriding third-party resets or legacy rules.
- Test across both Light Mode (`html:not(.dark)`) and Dark Mode (`html.dark`), as well as High-Contrast mode (`html.high-contrast`).

---

## 6. Mobile Responsiveness & Viewport Standards (iPhone 17 Pro Max & Apple HIG)

1. **Zero Horizontal Overflow**: `document.documentElement.scrollWidth <= window.innerWidth` across all pages (`index.html`, `systems.html`, `monitor.html`, `travel.html`, `uses.html`, `changelog.html`, `404.html`) and scroll offsets.
2. **Safe-Area Insets & Dynamic Island**: All top navigation bars and full-screen overlays account for `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` with proper spacing so content never collides with hardware cutouts.
3. **Card & Grid Decongestion**:
   - On screens $\le 640\text{px}$, avoid forced multi-column cards that squeeze horizontal text.
   - Timelines (`experience.css`, `education.css`): Maintain a clean `padding-left: 58px` / `70px` with a 40px icon centered on the vertical spine line to prevent strike-through artifacts across card text.
   - Telemetry Panels (`monitor-apple-redesign.css`): Stack control center metrics into structured 2-row tiles (`label row` top, `value row` bottom).
   - Keynote Statistics (`systems.css`): Sized as a compact 2-column grid with full-width CI status badges and horizontally scrollable pill rails.
4. **Touch Target Accessibility**: All interactive buttons, chips, links, and switches must satisfy minimum dimensions of $44 \times 44\text{px}$ (or $\ge 40\text{px}$ with tap padding).

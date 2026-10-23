# Visual Design Language & Component System

> **Standard**: Apple Human Interface Guidelines (HIG) Web Realization  
> **Detailed Specification**: [`docs/DESIGN.md`](docs/DESIGN.md)  
> **Core Principle**: Vibrant Apple Blue (`#0071e3`), specular metallic shine, authentic glassmorphism, zero layout congestion, and zero horizontal overflow.

---

## 1. Aesthetic Vibe & Philosophy

The portfolio’s aesthetic reflects modern Apple operating systems (macOS Tahoe & iOS 18+ HIG):

- **Clarity & Purpose**: Uncluttered layouts with generous whitespace, crisp typographic hierarchy, and intuitive information architecture.
- **Authentic Glassmorphism**: Multi-layered backdrop blurs (`backdrop-filter: blur(20px)`), frosted translucency, and hairline borders (`rgba(255, 255, 255, 0.12)` / `rgba(0, 0, 0, 0.08)`).
- **Tactile Specular Polish**: Primary call-to-actions and hero elements feature a specular metallic sheen animation that sweeps across the gradient on hover or focus.
- **Fluid & Motion-Aware**: High-frame-rate spring-like transitions (cubic-bezier easing) paired with strict `prefers-reduced-motion` compliance.

---

## 2. Color Palette & Design Tokens

### 2.1 Accent & Status Colors

| Role                      | Token                 | Light Mode Value | Dark Mode Value | Usage                                                           |
| :------------------------ | :-------------------- | :--------------- | :-------------- | :-------------------------------------------------------------- |
| **Primary Accent**        | `--apple-blue`        | `#0071e3`        | `#0a84ff`       | Interactive links, primary buttons, focus rings, brand badges   |
| **Primary Hover**         | `--apple-blue-hover`  | `#0077ed`        | `#409cff`       | Button hover state                                              |
| **Primary Active**        | `--apple-blue-active` | `#0062c4`        | `#006edb`       | Button active / pressed state                                   |
| **Destructive / Dismiss** | `--apple-red`         | `#ff3b30`        | `#ff453a`       | Unified circular close button, disconnect actions, error states |
| **Success / Online**      | `--apple-green`       | `#34c759`        | `#30d158`       | Live server status indicator, active toggle switches            |
| **Warning / Notice**      | `--apple-orange`      | `#ff9500`        | `#ff9f0a`       | Stale cache flags, rate limit warnings                          |
| **Informational**         | `--apple-purple`      | `#af52de`        | `#bf5af2`       | Model capability pills, AI agent highlights                     |

### 2.2 Neutral & Surface Hierarchy

```css
/* Light Mode (Solid Crisp White Foundation) */
:root,
[data-theme='light'] {
  --apple-bg: #ffffff;
  --apple-bg-secondary: #f5f5f7;
  --apple-bg-tertiary: #e8e8ed;
  --apple-card-bg: rgba(255, 255, 255, 0.82);
  --apple-card-border: rgba(0, 0, 0, 0.08);
  --apple-text: #1d1d1f;
  --apple-text-secondary: #86868b;
  --apple-text-tertiary: #a1a1a6;
  --apple-divider: rgba(0, 0, 0, 0.06);
}

/* Dark Mode (Solid Pitch Black Foundation) */
[data-theme='dark'] {
  --apple-bg: #000000;
  --apple-bg-secondary: #1c1c1e;
  --apple-bg-tertiary: #2c2c2e;
  --apple-card-bg: rgba(28, 28, 30, 0.85);
  --apple-card-border: rgba(255, 255, 255, 0.12);
  --apple-text: #f5f5f7;
  --apple-text-secondary: #86868b;
  --apple-text-tertiary: #6e6e73;
  --apple-divider: rgba(255, 255, 255, 0.08);
}
```

---

## 3. Typography & Font Hierarchy

- **System Font Stacks**:
  - **Headings (Display)**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;`
  - **Body Text**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;`
  - **Monospace / Code**: `"SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;`

| Element                 | Size        | Weight         | Line Height | Tracking |
| :---------------------- | :---------- | :------------- | :---------- | :------- |
| **Hero Title (h1)**     | 48px – 64px | 700 (Bold)     | 1.08        | -0.025em |
| **Section Header (h2)** | 32px – 40px | 600 (Semibold) | 1.15        | -0.020em |
| **Card Header (h3)**    | 20px – 24px | 600 (Semibold) | 1.25        | -0.015em |
| **Body Regular**        | 16px – 17px | 400 (Regular)  | 1.47        | -0.010em |
| **Caption / Meta**      | 12px – 13px | 500 (Medium)   | 1.35        | 0.000em  |

---

## 4. Key UI Components & Signatures

### 4.1 Unified Circular Red Close Button

- **Geometry**: Strict circular container (`width: 32px; height: 32px; border-radius: 50%`).
- **Color**: Solid Apple Red background (`background-color: var(--apple-red); color: #ffffff`).
- **Dismiss Icon**: Centered white SVG cross or FontAwesome `fa-xmark`.
- **Placement**: Pinned to the top-right corner of modals, drawer headers, and interactive floating sheets.

### 4.2 Dynamic Island Navigation

- Floating, pill-shaped navbar centered at the top of the viewport.
- Frosted glassmorphism background (`backdrop-filter: blur(24px)`).
- Morphing shape adjustments when mobile hamburger or sub-menus activate.
- Zero horizontal displacement; all items stay bounded inside the viewport.

### 4.3 Grouped Inset Cards

- Derived from iOS/macOS System Settings.
- Rounded corners (`border-radius: 16px`), subtle hairline borders, and inset dividers.
- Used across the AssistMe Privacy Dashboard, Projects Showcase, and Monitor Vitals.

### 4.4 Specular Metallic Shine Animation

Applied to primary action buttons and featured cards:

```css
.specular-shine {
  position: relative;
  overflow: hidden;
}
.specular-shine::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    60deg,
    transparent 20%,
    rgba(255, 255, 255, 0.25) 45%,
    rgba(255, 255, 255, 0.45) 50%,
    rgba(255, 255, 255, 0.25) 55%,
    transparent 80%
  );
  transform: translateX(-100%);
  transition: transform 0.75s ease-in-out;
}
.specular-shine:hover::after {
  transform: translateX(100%);
}
```

---

## 5. Responsive Design & Accessibility QA

- **Zero Horizontal Overflow**: Every page must maintain `max-width: 100vw; overflow-x: hidden`.
- **Touch Target Floor**: Minimum interactive dimension is **44 × 44px** for buttons, tabs, links, and switches.
- **Focus Rings**: High-contrast, 2px solid Apple Blue ring with 2px offset (`outline: 2px solid var(--apple-blue); outline-offset: 2px`).
- **Motion Reduction**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

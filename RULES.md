# Engineering Rules & Agent Guardrails

> **Standard**: Core operating protocol for human engineers and autonomous AI agents.  
> **Source of Truth**: Layered with [`AGENTS.md`](AGENTS.md) and [`docs/BEST_PRACTICES.md`](docs/BEST_PRACTICES.md).

---

## 1. Absolute Guardrails: What the AI Must NEVER Do

1. **NEVER install or import UI framework runtimes**:
   - Strictly forbidden: React, Next.js, Vue, Nuxt, Svelte, Angular, Gatsby, or any React-based auditing tool.
   - The frontend is 100% native vanilla HTML, vanilla CSS, and vanilla ES modules.
2. **NEVER insert Tailwind utility classes directly into HTML markup**:
   - Forbidden: `<div class="flex items-center justify-between p-4 bg-blue-500">`.
   - Tailwind v4 is used solely to generate utility CSS; all markup must use semantic class names, styled in `src/assets/css/*.css`.
3. **NEVER commit secrets, credentials, or `.env` files**:
   - Forbidden: Hardcoded API keys, JWT secrets, OAuth client secrets, or personal phone numbers.
   - All external keys belong in serverless environment variables only.
4. **NEVER add `<footer>` elements to `systems.html` or `monitor.html`**:
   - These two surfaces are full-height app-like diagnostic views and must not have page footer elements.
5. **NEVER use inline styles**:
   - Avoid `style="..."` in HTML. Use CSS classes or CSS custom properties.
6. **NEVER use TypeScript or JSX**:
   - This repository is vanilla JavaScript (ESM). Keep files named `.js` or `.mjs`.
7. **NEVER allow horizontal scroll overflow**:
   - Zero horizontal overflow on any viewport width from 375px mobile to 1440px+ desktop.
8. **NEVER fabricate attribution or metrics**:
   - Never guess active AI model variants, reasoning tokens, or latency numbers. Record `unavailable` if not exposed by runtime.
9. **NEVER run broad, destructive process kills**:
   - Forbidden: `pkill node` or killing processes you do not own.

---

## 2. Mandatory Rules: What the AI Must ALWAYS Do

1. **Always use CSS custom properties**:
   - Theme variables (`var(--apple-blue)`, `var(--apple-bg)`, `var(--apple-text)`, etc.) must be used for colors.
2. **Always include `.js` extension in ES module imports**:
   - Required: `import { helper } from './utils.js';` (never omit `.js`).
3. **Always run the full quality gate before pushing**:
   - `npm run check` (ESLint + Stylelint + Oxlint + Prettier)
   - `npm test` (FastAPI pytest + Worker tests + critical Playwright journeys)
   - `npm run security-check` (0 secret leaks)
   - `npm run build` (Clean production bundle build)
4. **Always ensure multi-platform package-lock resilience**:
   - Ensure foreign platform optional dependencies (`@esbuild/linux-*`, `@tailwindcss/oxide-linux-*`, `@img/sharp-linux-*`, `@oxlint/binding-linux-*`) are preserved in `package-lock.json` so headless Linux CI runners can build successfully.
5. **Always update changelog entries for shipped releases**:
   - Add a typed entry to `src/js/data/changelog-entries.js` detailing features, fixes, and active model attribution.
6. **Always verify remote CI to 100% green**:
   - Never consider a task complete until GitHub Actions runs (`CI → Deploy to GitHub Pages`, `Push on main`, `Deploy AssistMe Chat Worker`) pass with green checkmarks.

---

## 3. Language & Code Style Conventions

### 3.1 JavaScript (ES Modules)

- **Module format**: Vanilla ECMAScript modules (`"type": "module"` in `package.json`).
- **Formatting**: 2-space indentation, single quotes, semicolons, trailing commas (ES5 style), 100-character line width.
- **Naming**: `camelCase` for functions and variables, `PascalCase` for classes and constructors, `UPPER_SNAKE_CASE` for constants.
- **Type Checking**: Validated via JSDoc and `jsconfig.json`. Do not introduce TypeScript syntax.

### 3.2 Vanilla CSS & Styling

- **Tokens**: All colors, shadows, and blurs reference custom properties defined in `src/assets/css/critical-tokens.css` and `src/assets/css/sitewide-design-system.css`.
- **Glassmorphism**: Combine translucent background colors with `backdrop-filter: blur(20px)` and `-webkit-backdrop-filter: blur(20px)`.
- **Touch Targets**: Minimum interactive dimensions must be `44px × 44px`.

### 3.3 Python (FastAPI Backend)

- **Formatting**: PEP 8 standard, 4-space indentation, 120-character maximum line length.
- **Validation**: Pydantic v2 schemas for all incoming payloads and outgoing API responses.
- **Async Concurrency**: Use `asyncio.gather()` for parallel I/O and external checks; never block the async event loop with synchronous network calls.
- **Dead Code Scanner**: Keep vulture allowlists updated in `config/vulture.toml`.

---

## 4. Multi-IDE & Multi-Model Attribution Policy

When committing changes, record the active coding environment and model family in the commit message, `README.md` (Section 5.1), and `src/js/data/changelog-entries.js`:

| Environment                | Supported Attribution String                  |
| :------------------------- | :-------------------------------------------- |
| **Google Antigravity IDE** | `Gemini 3.8 Flash, in Google Antigravity IDE` |
| **OpenAI Codex**           | `GPT-6 / Codex, in Codex desktop`             |
| **Claude Code**            | `Claude Opus 4.6, in Claude Code CLI`         |
| **Cursor IDE**             | `Claude 3.7 Sonnet / Cursor, in Cursor IDE`   |
| **GitHub Copilot**         | `GitHub Copilot, in VS Code`                  |

_Note_: Keep the coding agent that authored repository changes strictly distinct from the runtime chatbot model configured in `api/model_router.py` or `workers/assistme-chat/wrangler.toml`.

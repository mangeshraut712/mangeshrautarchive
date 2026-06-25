# Copilot Instructions — mangeshrautarchive

## Project Overview

mangeshrautarchive is Mangesh Raut's Agentic Full-Stack Portfolio.
The frontend is **vanilla HTML/CSS/JavaScript** (ES modules) — there is NO React,
NO TypeScript, and NO UI frameworks. The backend is **Python 3.12+ FastAPI** with
OpenRouter API (grok-4.3) for AI features.

## Language & Module Rules

- **JavaScript**: Always use ES module syntax (`import` / `export`).
  Never use CommonJS (`require`, `module.exports`).
- **No TypeScript**: Write plain `.js` files. Use JSDoc `@param` / `@returns`
  comments for type documentation where helpful.
- **No Frameworks**: Do not suggest React, Angular, Vue, Svelte, or any
  component framework. Use vanilla DOM APIs (`document.querySelector`,
  `addEventListener`, `createElement`, template literals for HTML).
- **Python**: Use Python 3.12+ syntax. Prefer `async def` for FastAPI endpoints.
  Use standard type hints and Pydantic v2 models for request/response schemas.

## Indentation & Formatting

| Language   | Indent   | Style                     |
| ---------- | -------- | ------------------------- |
| JavaScript | 2 spaces | Single quotes, semicolons |
| HTML       | 2 spaces | Lowercase attributes      |
| CSS        | 2 spaces | BEM-like class naming     |
| Python     | 4 spaces | PEP 8, Black-compatible   |

## Design System

- **Apple design language**: Clean whitespace, rounded corners, subtle shadows.
- **Typography**: SF Pro Display for headings, SF Pro Text for body copy.
  Declare via CSS `font-family` with system fallbacks.
- **Theming**: All colors use CSS custom properties (`--color-primary`, etc.).
  Dark mode toggled via `.dark` class on `<html>`.
- **No Tailwind in HTML**: Tailwind v4 is used for utility generation only.
  Component styles live in vanilla `.css` files with custom properties.

## File Structure Conventions

- `src/` — Frontend source (HTML, CSS, JS)
- `api/` — Python FastAPI backend
- `tests/` — All test files (unit, API, E2E)
- `public/` — Static assets served directly
- `scripts/` — Build and dev tooling

## Testing

- **Unit tests**: Vitest with jsdom environment for DOM-related tests.
- **API tests**: pytest with `httpx.AsyncClient` as the test transport.
- **E2E tests**: Playwright across 15 browser configurations.
- Follow the **Arrange-Act-Assert** (AAA) pattern in every test.
- Never write flaky time-dependent assertions; use deterministic waits.

## Security — Non-Negotiable

- **Never** hardcode API keys, secrets, or credentials in source files.
- Always read secrets from environment variables (`process.env` / `os.environ`).
- Never commit `.env` files — they are git-ignored.
- Never expose OpenRouter API keys or any backend secret to the client bundle.

## Git Commits

- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
- Keep commits atomic — one logical change per commit.

## Build Tooling

- **esbuild** for JS bundling (ESM output, tree-shaking enabled).
- **Tailwind CSS v4** for utility class generation (build step only).
- **Node 22.x** runtime — leverage native ESM and modern APIs.

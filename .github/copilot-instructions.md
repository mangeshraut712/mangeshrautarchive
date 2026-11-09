# Copilot Instructions — mangeshrautarchive

Use [AGENTS.md](../AGENTS.md) as the shared source of truth for this repository. It contains the
canonical architecture, commands, guardrails, verification requirements, and multi-agent attribution
rules used across GitHub Copilot, Google Antigravity, Codex, Claude Code, and Cursor.

## Copilot Code Generation Directives

- **Frontend is Vanilla Only**: Write plain vanilla HTML5, vanilla CSS, and ES modules (`.js` files with explicit `.js` import paths).
  **Never** generate React, Next.js, Vue, Angular, Svelte, or TypeScript code.
- **Design System**: Strictly follow [docs/DESIGN.md](../docs/DESIGN.md) — Apple Human Interface Guidelines,
  Apple system CSS tokens (`var(--apple-blue)`, `var(--apple-red)`, etc.), glassmorphism, and solid background fallbacks.
  Tailwind CSS v4 is used for build-time utility generation only; **never** insert Tailwind utility classes directly into HTML markup.
- **Backend**: Python 3.12+ FastAPI with Pydantic v2 models and type hints (`api/routes/`).
- **Testing**:
  - API tests: pytest (`npm run test:api`)
  - Browser tests: critical/Desktop Chrome through `test:e2e:critical` and `test:e2e:chrome`; all 16 configured projects through `npm run test:e2e:all`
  - Do **not** generate Vitest, Jest, Mocha, or Cypress tests.
- **Security**: Never hardcode API keys, tokens, or credentials. Server secrets belong strictly in server-side FastAPI / Cloudflare Worker code and are never exposed to browser bundles.
- **Quality Gates**: Follow the release checklist in [AGENTS.md](../AGENTS.md), including the complete `npm test` command, build, and Tester Army gate.

Do not duplicate general project rules here. Update [AGENTS.md](../AGENTS.md) when shared guidance changes.

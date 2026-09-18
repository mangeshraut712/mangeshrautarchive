# GEMINI.md — Google IDE entry point

Use [AGENTS.md](AGENTS.md) as the shared source of truth for this repository. It contains the
architecture, commands, guardrails, verification requirements, and model-attribution rules used
across Google Antigravity, Codex, Claude Code, Cursor, and GitHub Copilot.

When working from a Google IDE:

- Follow [docs/DESIGN.md](docs/DESIGN.md) for every visual change and inspect the rendered page at
  representative desktop and mobile widths in light, dark, and high-contrast modes.
- Record the IDE and exposed model family for a shipped change. Record the exact variant, reasoning
  mode, and token usage only when the runtime exposes them; otherwise use `unavailable`.
- Keep the coding agent separate from the portfolio chatbot runtime configured in
  `api/model_router.py`.

Do not duplicate general project rules here. Update `AGENTS.md` when shared guidance changes.

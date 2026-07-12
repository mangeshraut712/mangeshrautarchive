# Config

Shared tool configuration that is **not** required at the repository root.

| File               | Tool                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| `doctor.config.js` | React Doctor / deslop ignore rules (re-exported from root `doctor.config.js`) |
| `vulture.toml`     | Python dead-code scan (`npm run lint:dead-code`)                              |

Root-level configs that must remain at `/` (package managers / CLIs hard-code paths):

- `eslint.config.js`, `.prettierrc`, `.stylelintrc.json`
- `vitest.config.js`, `playwright.config.js`
- `vercel.json`, `middleware.js`
- `pyproject.toml`, `ruff.toml`, `.flake8`

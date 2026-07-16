# Config

Shared tool configuration that is **not** required at the repository root.

| File           | Tool                                             |
| -------------- | ------------------------------------------------ |
| `vulture.toml` | Python dead-code scan (`npm run lint:dead-code`) |

Root-level configs that must remain at `/` (package managers / CLIs hard-code paths):

- `eslint.config.js`, `.prettierrc`, `.stylelintrc.json`
- `vitest.config.js`, `playwright.config.js`
- `vercel.json`, `middleware.js`
- `pyproject.toml`, `ruff.toml`, `.flake8`

## Repo doctor

Stack and layout health lives in `scripts/utils/repo-doctor.mjs` (not React Doctor).

```bash
npm run doctor          # node range, stack guard, root allow-list, Vercel/Python hygiene
npm run doctor:strict   # warnings become failures
npm run doctor:stack    # check-node + doctor
npm run doctor:full     # live env / production API parity probe
```

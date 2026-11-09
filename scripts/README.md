# Scripts

Node/Python tooling that is **not** part of the browser runtime.

| Directory         | Purpose                                                     | Invoked by                                 |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------ |
| **build/**        | Production bundle, blog/case pages, image optimize, clean   | `npm run build`, `prebuild`, `clean`       |
| **deployment/**   | Lighthouse gates, secret scan, deploy/env parity            | CI, `verify:deploy-sync`, `security-check` |
| **utils/**        | Local dev servers, `check-node`, serve-dist, flake8/vulture | `npm run dev`, `check-node`, `lint:python` |
| **qa/**           | Browser FPS / device audits                                 | `qa:browser:ci`, manual QA                 |
| **integrations/** | OAuth setup, OpenRouter connectivity tests                  | Manual / ops                               |
| **offline/**      | Offline travel data builders                                | Manual data refresh                        |

Prefer adding new automation here instead of dumping scripts at the repo root.

## README screenshots

`node scripts/qa/capture-readme-screenshots.mjs` captures seven live surfaces at 375px, 768px, and 1440px in both themes using installed Chrome. It writes optimized WebP files and provenance to `docs/screenshots/`; no production assets or CSS are changed. Set `SCREENSHOT_BASE_URL` to a local built site when reviewing unshipped UI. Browser processes close even on failure.

`utils/proxy-target.mjs` constructs local development API targets from a configured origin and validated request path. Keep redirect handling explicit at every network sink.

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

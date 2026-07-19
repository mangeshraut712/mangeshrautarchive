# Security Policy

> **Last updated:** 2026-07-19 (July 2026)

## Supported Versions

| Version / surface                                                                                  | Supported                                                      |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `main` (latest)                                                                                    | ✅ Fully supported                                             |
| [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive) | ✅ GitHub Pages (active public mirror)                         |
| [mangeshraut.pro](https://mangeshraut.pro)                                                         | ✅ Primary hostname (Vercel) when production deploy is enabled |

Only the latest commit on `main` receives security fixes. Older tags or forks are not supported.

## Reporting a Vulnerability

Please report security issues **privately**. Do **not** open a public GitHub issue or discussion for vulnerabilities.

### Preferred channels (in order)

1. **GitHub private advisory** — [Report a vulnerability](https://github.com/mangeshraut712/mangeshrautarchive/security/advisories/new)
2. **Email** (include a clear subject like `SECURITY: short summary`):
   - [mangeshraut712@gmail.com](mailto:mangeshraut712@gmail.com)
   - [mbr63@drexel.edu](mailto:mbr63@drexel.edu)
   - [mbr63drexel@gmail.com](mailto:mbr63drexel@gmail.com)

### What to include

- Description of the issue and affected URL(s) / endpoint(s)
- Steps to reproduce (PoC if available)
- Potential impact (confidentiality, integrity, availability)
- Your contact details and any disclosure timeline preferences

### Response targets (July 2026)

| Step                      | Target                                |
| ------------------------- | ------------------------------------- |
| Acknowledgment            | Within **48 hours**                   |
| Initial triage / severity | Within **5 business days**            |
| Fix or mitigation plan    | As soon as practical for the severity |

We follow coordinated disclosure. Please give us a reasonable window to ship a fix before public discussion.

Machine-readable contact details also live in RFC 9116 [`security.txt`](https://mangeshraut712.github.io/mangeshrautarchive/.well-known/security.txt) (and `/security.txt`).

## Security Measures

This portfolio implements these practices on `main` as of July 2026:

- **Content Security Policy (CSP)** — strict CSP headers with reporting where configured
- **HSTS** — Strict-Transport-Security (production hosts)
- **Automated secret scanning** — `npm run security-check` blocks exposed API keys before commit
- **Dependency hygiene** — `npm audit` in CI; Dependabot monitors known CVEs
- **Server-side secrets only** — OpenRouter and other provider keys stay on FastAPI / edge workers; never shipped to browsers
- **Input sanitization** — chatbot and user-facing inputs are sanitized before processing
- **GitHub Pages `.nojekyll`** — so `/.well-known/security.txt` and other agent discovery files publish correctly

## Scope

**In scope**

- Public site surfaces above (Pages + Vercel when live)
- FastAPI `/api/*` routes and Cloudflare AssistMe chat worker endpoints used by the portfolio
- Client-side XSS / secret leakage / auth flaws in this repository’s code

**Out of scope**

- Third-party platforms (OpenRouter, Vercel, GitHub, Cloudflare account compromise unrelated to this repo)
- Social engineering / phishing against personal accounts
- Volumetric denial-of-service
- Issues only present on outdated forks or local misconfiguration

## License

This project is released under the [MIT License](LICENSE) (Copyright 2025–2026 Mangesh Raut).

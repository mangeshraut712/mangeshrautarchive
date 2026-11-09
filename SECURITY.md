# Security Policy

> **Last updated:** 2026-11-09

## Supported Versions

| Version / surface                                                                                  | Supported                                                  |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `main` (latest)                                                                                    | ✅ Fully supported                                         |
| [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive) | ✅ GitHub Pages (primary public frontend)                  |
| [mangeshraut.pro](https://mangeshraut.pro)                                                         | ✅ Optional Vercel hostname; deployment currently disabled |

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

### Response targets

| Step                      | Target                                |
| ------------------------- | ------------------------------------- |
| Acknowledgment            | Within **48 hours**                   |
| Initial triage / severity | Within **5 business days**            |
| Fix or mitigation plan    | As soon as practical for the severity |

We follow coordinated disclosure. Please give us a reasonable window to ship a fix before public discussion.

Machine-readable contact details also live in RFC 9116 [`security.txt`](https://mangeshraut712.github.io/mangeshrautarchive/.well-known/security.txt) (and `/security.txt`).

## Security Measures

Controls are implemented in the repository and depend on the serving runtime. Review the actual deployed responses when assessing a host:

- **Browser and transport policies** — HTML CSP and API response headers are configured by their respective runtimes. GitHub Pages controls its own HTTP response headers; optional backend policies are not evidence of identical headers on every host.
- **Secret-pattern checks** — `npm run security-check` checks repository patterns before commit. Passing it is not proof that every possible secret format has been detected.
- **Dependency hygiene** — dependency manifests and lockfiles are reviewed with security alerts and CI. Updates require behavioral validation, including transitive overrides.
- **Server-side secrets only** — OpenRouter and other provider keys stay on FastAPI / edge workers; never shipped to browsers
- **Input boundaries** — rich HTML passes through sanitization; route-specific validation, CORS, and server-side credential handling remain necessary. The development proxy fixes the upstream origin, rejects non-API paths, and does not automatically follow upstream redirects.
- **CodeQL** — GitHub default setup analyzes JavaScript/TypeScript, Python, and Actions. Check both configuration health and open alerts after a release; a successful analysis job does not mean there are no findings.
- **Outbound analytics** — checkout and social destinations are classified using parsed HTTPS hostnames, not substrings embedded in a URL.
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

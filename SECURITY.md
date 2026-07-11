# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅ Fully supported |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue.
2. Email **[mangeshraut712@gmail.com](mailto:mangeshraut712@gmail.com)** with:
   - A description of the vulnerability
   - Steps to reproduce it
   - Potential impact assessment
3. You will receive an acknowledgment within **48 hours**.
4. A fix will be developed and deployed as soon as possible.

## Security Measures

This project implements the following security practices:

- **Content Security Policy (CSP)** — strict CSP headers with reporting
- **HSTS** — Strict-Transport-Security with preload
- **Automated scanning** — `npm run security-check` scans for exposed API keys on every commit
- **Dependency auditing** — `npm audit` runs in CI pipeline; Dependabot monitors for known vulnerabilities
- **No client-side secrets** — all API keys are server-side only (FastAPI proxy)
- **Input sanitization** — all user input to the chatbot is sanitized before processing

## Scope

The following are in scope for security reports:

- **[mangeshraut.pro](https://mangeshraut.pro)** — primary Vercel deployment
- **[mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive)** — GitHub Pages mirror
- API endpoints at `/api/*`

Out of scope:

- Third-party services (OpenRouter, Vercel infrastructure, GitHub infrastructure)
- Social engineering attacks
- Denial of service attacks

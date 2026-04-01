# Mangesh Raut Portfolio

Personal portfolio site for [mangeshraut.pro](https://mangeshraut.pro), built to showcase software engineering work, projects, writing, and an AI-assisted contact experience.

## Overview

This repository contains the source for a production portfolio with:

- A fast, static frontend in HTML, CSS, Tailwind, and vanilla JavaScript
- A FastAPI backend for AI and API-powered features
- A live GitHub-powered projects showcase
- An interactive canvas game hidden in the portfolio
- Automated quality checks for linting, testing, accessibility, and Lighthouse

## Features

- **AssistMe AI assistant** with chat, streaming responses, and site actions
- **Project showcase** that pulls repository data and activity from GitHub
- **Debug Runner** canvas mini-game for an interactive easter egg
- **Responsive portfolio sections** for experience, education, writing, certifications, and contact
- **Quality gates** using Playwright, Vitest, ESLint, Stylelint, and Lighthouse

## Tech Stack

- **Frontend:** HTML5, CSS3, Tailwind CSS, vanilla JavaScript
- **Backend:** Python, FastAPI
- **Tooling:** Node.js, npm, Playwright, Vitest, ESLint, Stylelint, Prettier
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Python 3.12+

### Install

```bash
npm ci
pip install -r requirements.txt
```

### Run locally

```bash
npm run dev
```

This starts:

- Frontend dev server via `scripts/local-server.js`
- FastAPI backend on port `8000`

## Useful Scripts

```bash
npm run dev                  # run frontend and backend locally
npm run build                # copy production-ready frontend assets to dist/
npm run lint                 # run ESLint
npm run lint:css             # run Stylelint
npm test                     # run Vitest
npm run qa:smoke             # desktop smoke test with Playwright
npm run qa:smoke:mobile      # mobile smoke test with Playwright
npm run qa:a11y              # accessibility checks
npm run qa:lighthouse:desktop
npm run qa:lighthouse:mobile
npm run qa:prod-ready        # security, lint, tests, and QA gates
```

## Project Structure

```text
mangeshrautarchive/
├── api/           # FastAPI backend
├── docs/          # project documentation
├── scripts/       # build, local server, and QA helpers
├── src/           # frontend source
│   ├── assets/    # images, CSS, files
│   └── js/        # application modules
├── tests/e2e/     # Playwright tests
├── package.json
├── requirements.txt
└── vercel.json
```

## Quality and Testing

The repository includes checks for:

- JavaScript linting with ESLint
- CSS linting with Stylelint
- Unit tests with Vitest
- Browser smoke and accessibility tests with Playwright
- Desktop and mobile Lighthouse gates

## Deployment

The site is deployed on Vercel.

- Frontend source lives in [`src/`](src)
- Backend entrypoint lives in [`api/index.py`](api/index.py)
- Deployment config lives in [`vercel.json`](vercel.json)

## Links

- Live site: [mangeshraut.pro](https://mangeshraut.pro)
- GitHub: [mangeshraut712](https://github.com/mangeshraut712)
- LinkedIn: [mangeshraut71298](https://www.linkedin.com/in/mangeshraut71298/)

## Notes

- Keep secrets out of the frontend. Use environment variables for backend-only credentials.
- The README is intentionally concise and focused on the repository, not the full portfolio content.

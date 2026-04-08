<div align="center">

# 🚀 Mangesh Raut — AI-Powered Portfolio

### _Next-Generation Developer Portfolio with Intelligent AI Assistant_

[![Live Portfolio](https://img.shields.io/badge/🌐_Live-mangeshraut.pro-0071e3?style=for-the-badge&logoColor=white)](https://mangeshraut.pro)
[![GitHub](https://img.shields.io/badge/GitHub-Pages-181717?style=for-the-badge&logo=github)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**[View Live Demo](https://mangeshraut.pro)** • **[Features](#-key-features)** • **[Tech Stack](#️-tech-stack)** • **[Quick Start](#-quick-start)**

---

<img src="https://img.shields.io/badge/Built_with-❤️_in_Philadelphia-ff6b6b?style=flat-square" alt="Built with love" />

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Key Features](#-key-features)
- [Live Demos](#-live-demos)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Scripts](#-available-scripts)
- [Quality Gates](#-quality--performance-gates)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🌟 About

This is my **personal portfolio website** — not just a static resume, but an **interactive product-style portfolio** that showcases modern full-stack development. It combines an AI assistant, live GitHub activity, a system monitor dashboard, a curated media shelf, and a polished Apple-inspired UI.

Built with **Python FastAPI** backend, **vanilla JavaScript** frontend, and deployed on multiple platforms for maximum reliability and performance.

<div align="center">

### 💡 Project Highlights

|                  🧠 AI Assistant                   |      📺 Currently Card       |      📊 Live Data      |        🎨 Premium UI         |
| :------------------------------------------------: | :--------------------------: | :--------------------: | :--------------------------: |
| Real-time streaming chatbot with context awareness | Shows, Music, Books tracking | GitHub API integration | Apple-inspired glassmorphism |

</div>

### 🔄 Recent Changes

- **Synchronize portfolio deployments and monitoring UI**
- **Fix Playwright webServer to use dev:frontend only**
- **Resolve Python syntax issues and update media library data**
- **Synchronize URLs across all deployment environments**
- **Fix GitHub Actions qa:smoke port timeout issue**
- **Fix GitHub Pages deployment and custom domain**
- **Restore circular music card design**
- **Fix API docs page error handling and logging**
- **Implement cache busting for updated website version**
- **Update music card to iOS 26.4 rectangular design with theme-aware colors**

## ✨ Key Features

### 🧠 AssistMe — Intelligent AI Assistant

<details>
<summary><b>🤖 Click to explore AI capabilities</b></summary>

<br/>

The centerpiece of this portfolio is **AssistMe**, an AI-powered chatbot that goes beyond simple Q&A:

- **🔄 Real-Time Streaming** — Watch responses appear character-by-character like ChatGPT
- **💾 Conversation Memory** — Maintains context across multiple questions and answers
- **🎤 Voice Input** — Speak your questions using the Web Speech API
- **🔊 Voice Output** — Hear responses via built-in text-to-speech
- **🎯 Agentic Actions** — The AI can actually control the website:
  - Toggle between dark and light themes
  - Download my resume PDF
  - Navigate to specific portfolio sections
  - Show/hide UI elements on command
- **📊 Live Metadata** — See AI model info, token count, and response latency
- **🛡️ Privacy Dashboard** — Complete control over your conversation data
- **📴 Offline Mode** — Smart fallback responses when the API is unavailable

**Technology:** OpenRouter-backed multi-model chat (default: Grok 4.1 Fast), with configurable model selection and local fallback responses when remote AI is unavailable.

</details>

### 📺 Currently Card

<details>
<summary><b>📱 Click to explore Currently features</b></summary>

<br/>

A curated media shelf with locally shipped artwork and stable runtime behavior:

- **Shows & Movies Tab** — 30+ titles with direct streaming platform links
  - Indian TV: Taarak Mehta, CID, Mahabharat, Scam 1992, Mirzapur, The Family Man
  - International: Breaking Bad, Money Heist, Narcos, Squid Game, Stranger Things, Crash Landing on You
  - Movies: KGF, RRR, Dangal, Vikram, Jailer, Kantara, Baahubali, Pushpa, Avengers, and more
- **Music Tab** — Last.fm integration showing Now Playing and recent tracks
  - Real-time Spotify sync via Last.fm API
  - Album art display with direct Spotify links
- **Books Tab** — 9 curated titles with author names
  - Steve Jobs, Atomic Habits, The Ramayana, Bhagavad Gita, Holy Bible
  - Dune, The Lord of the Rings
  - Marathi literature: Mrityunjay, Shyamchi Aai
- **Streaming Links** — Direct links to Netflix, Prime Video, Disney+, SonyLIV, and more
- **🖼️ Curated Local Poster Assets** — Fixed show/movie/book artwork ships with the site, avoiding runtime poster mismatches
- **📈 Engagement Analytics** — Real-time user interaction tracking (`media_click`) synced seamlessly with Vercel Web Analytics

</details>

### 🎮 Debug Runner — Interactive Canvas Game

<details>
<summary><b>🕹️ Click to explore game features</b></summary>

<br/>

A fully functional **HTML5 Canvas** retro-style arcade game built from scratch:

- ⚡ **60 FPS Performance** — Smooth animations with optimized rendering
- 📱 **Mobile Touch Controls** — Play on any device with responsive touch input
- 🎯 **Score Tracking** — Local storage persists your high scores
- 🎨 **Pixel Art Graphics** — Retro aesthetic with custom sprite sheets
- 🏆 **Progressive Difficulty** — Game gets harder as you advance

**Location:** Navigate to the "Game" section in the portfolio to discover this hidden easter egg!

</details>

### 📊 Live GitHub Integration

<details>
<summary><b>💻 Click to explore GitHub features</b></summary>

<br/>

Real-time project showcase that automatically stays current:

- 🔄 **Auto-Updating** — Fetches latest repositories from GitHub API on every visit
- 🔍 **Showcase Ranking** — Excludes forks/profile repos and ranks by quality + activity signals
- 📈 **Live Statistics** — Real-time star counts, fork counts, and primary languages
- 🎨 **Beautiful Cards** — Compact Apple 2026 design with smooth hover animations
- 🔖 **Dynamic Tags** — Topic badges automatically pulled from repository metadata
- ⚡ **Intelligent Caching** — 10-minute client + server cache window to reduce API pressure
- 🛡️ **Backend Proxy First** — Uses `/api/github/repos/public` + `/api/github/proxy` before direct GitHub fallback
- 📱 **Mobile-Safe Layout** — Projects toolbar and cards are constrained to viewport widths on phones
- 🔎 **Fuzzy Search** — Project search supports close matches (for typo-tolerant lookup)
- 🕒 **Compact Update Chip** — Updated labels use `relative + absolute` format (example: `3w ago · Feb 4, 2026`)
- 🗺️ **Spatial Modal** — Interactive project detail modal with repo stats and activity timeline

**Implementation:** Custom JavaScript module with GitHub REST API integration

</details>

### 📈 System Monitor

<details>
<summary><b>🩺 Click to explore monitor features</b></summary>

<br/>

A first-class monitor page that matches the main site shell and surfaces live backend state:

- **Live Health Checks** — Backend resource and integration health
- **Endpoint Metrics** — Success rate, response times, and recent API status
- **Service Integrations** — OpenRouter, GitHub, Last.fm, and analytics status cards
- **Event Log** — Resolved and unresolved operational events
- **Shared Apple Shell** — Same navbar, theme toggle, glass surfaces, and spacing language as the homepage

</details>

### 🎨 Premium Design System

<details>
<summary><b>🖌️ Click to explore design details</b></summary>

<br/>

**Apple 2026 Design System:**

- 🎯 **CSS Layers Architecture** — Modern cascade management for 2026
- 🔮 **Glassmorphism 2026** — Advanced frosted glass effects with backdrop blur
- 📱 **Container Queries** — Component-level responsive design
- 🌈 **Neural gradient animations** — Smooth, GPU-accelerated effects
- 🌓 **Automatic dark/light theme** — Based on system preferences
- 📐 **Mobile-first design** — Breakpoints at 640px, 768px, 1024px, 1280px
- ♿ **WCAG 2.2 AA** — Full keyboard navigation accessibility
- ⚡ **Performance optimized** — GPU acceleration, content visibility

**Typography:**

- **Display Font:** SF Pro Display — Apple's premium typeface
- **Text Font:** SF Pro Text — Optimized for readability
- **Monospace:** SF Mono / JetBrains Mono for code

**Color System:**

- Light mode: Clean whites with Apple blue accents
- Dark mode: Deep blacks with vibrant highlights
- Consistent spacing grid (4px base unit)

**Components:**

- Apple Cards with hover lift effects
- Primary, secondary, ghost buttons
- Glass cards with backdrop blur
- Tags and form inputs
- Smooth scroll animations

</details>

---

## 🌐 Live Demo

🚀 **[mangeshraut.pro](https://mangeshraut.pro)** — Main portfolio with custom domain

_Alternative deployments: [GitHub Pages](https://mangeshraut712.github.io/mangeshrautarchive/) | [Vercel](https://mangeshrautarchive.vercel.app)_

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-2C2D72?style=for-the-badge&logo=gunicorn&logoColor=white)

### AI & Intelligence

![OpenRouter](https://img.shields.io/badge/OpenRouter-Multi--Model-0EA5E9?style=for-the-badge)
![xAI](https://img.shields.io/badge/xAI-Grok-111111?style=for-the-badge)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-D97706?style=for-the-badge)

### DevOps & Tools

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

**Key Technologies:**

- Frontend: HTML5, CSS3, ES6+ JavaScript, Tailwind CSS 4.0
- Backend: Python 3.12+, FastAPI 0.115, Uvicorn 0.34, Pydantic 2.10
- AI: OpenRouter API with xAI Grok and Anthropic Claude models
- Testing: Playwright, Vitest, Lighthouse
- Deployment: Vercel, GitHub Pages, Docker

---

## 🚀 Quick Start

### Prerequisites

Make sure you have these installed before starting:

- **Node.js** 18+ and **npm** 9+
- **Python** 3.12+
- **Git** for version control
- 🔑 **OpenRouter API Key** (optional, for AI chatbot features)
- 🐙 **GitHub Token** (optional, recommended to avoid GitHub API rate limits)
- 🖼️ **TMDB / Google Books Keys** (optional, only needed if you want to use backend poster lookup endpoints)

### Installation Steps

```bash
# 1️⃣ Clone the repository
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

# 2️⃣ Install Node.js dependencies
npm ci

# 3️⃣ Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# 4️⃣ Install Python dependencies
pip install -r requirements.txt

# 5️⃣ Set up environment variables
cp .env.example .env
# Edit .env and add any keys you want:
# - OPENROUTER_API_KEY for AI features
# - GITHUB_TOKEN or GITHUB_PAT for higher GitHub API limits
# - TMDB_API_KEY / GOOGLE_BOOKS_API_KEY only if you want the optional backend poster lookup endpoints

# 6️⃣ Start the development servers
npm run dev
```

This will start:

- **Frontend** on `http://localhost:4000`
- **Backend API** on `http://localhost:8001`

### Alternative: Run Servers Separately

```bash
# Frontend only (port 4000)
npm run dev:frontend

# Backend only (port 8001)
npm run dev:backend
```

### Production Build

```bash
# Build optimized production assets
npm run build

# Serve the built dist/ directory locally
npm run serve:dist

# Rebuild Tailwind CSS only
npm run build:css
```

---

## 📂 Project Structure

```text
mangeshrautarchive/
├── api/                        # FastAPI backend + serverless handlers
│   ├── integrations/           # External connector helpers
│   └── legacy/                 # Legacy JS handlers kept for compatibility
├── src/                        # Frontend source
│   ├── assets/                 # CSS, images, icons, downloadable files
│   │   └── images/currently/   # Curated local artwork for the Currently card
│   └── js/
│       ├── core/               # App bootstrap + orchestration
│       ├── modules/            # Feature modules
│       ├── services/           # Shared runtime services
│       ├── components/         # Reusable UI components
│       └── utils/              # Small focused helpers
├── scripts/                    # Build/dev/QA/security scripts
│   └── shell/                  # Shell wrappers for local workflows
├── tests/e2e/                  # Playwright smoke + a11y + post-deploy checks
├── .github/workflows/          # CI/CD and monitoring workflows
├── package.json                # Node scripts/dependencies
├── package-lock.json           # Reproducible npm installs (required by npm ci)
├── .dockerignore               # Pruned Docker build context
└── requirements.txt            # Python dependencies
```

### Structure Rules

- Keep startup wiring in `src/js/core/bootstrap.js`.
- Add product behavior under `src/js/modules/*`.
- Keep shared primitives in `src/js/services/*` and UI pieces in `src/js/components/*`.
- Keep generated output (`dist/`, `artifacts/`, `test-results/`) out of commits.

---

## 📜 Available Scripts

| Command                         | Description                              |
| ------------------------------- | ---------------------------------------- |
| `npm run dev`                   | 🚀 Start full stack (frontend + backend) |
| `npm run dev:frontend`          | 🎨 Start frontend only (port 4000)       |
| `npm run dev:backend`           | 🔧 Start backend only (port 8001)        |
| `npm run build`                 | 📦 Build production assets               |
| `npm run serve:dist`            | 🌐 Serve built assets locally            |
| `npm run lint`                  | 🔍 Run ESLint checks                     |
| `npm run lint:fix`              | ✨ Auto-fix linting issues               |
| `npm run test`                  | 🧪 Run Vitest tests                      |
| `npm run qa:smoke`              | 🌐 Playwright smoke tests                |
| `npm run qa:a11y`               | ♿ Accessibility checks                  |
| `npm run qa:lighthouse:desktop` | ⚡ Lighthouse desktop perf               |
| `npm run qa:lighthouse:mobile`  | 📱 Lighthouse mobile perf                |
| `npm run qa:prod-ready`         | 🛡️ Full pre-release checks               |
| `npm run clean`                 | 🧽 Remove build artifacts                |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the [issues page](https://github.com/mangeshraut712/mangeshrautarchive/issues).

### How to Contribute

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style Guidelines

- Follow existing code formatting
- Run `npm run lint:fix` before committing
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation for new features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You're free to use this code for your own portfolio, but please:

- Give appropriate credit
- Don't claim it as entirely your own work
- Modify it to make it unique to you

---

## 🙏 Acknowledgments

Built with open-source tools: FastAPI, Tailwind CSS, OpenRouter, xAI, Anthropic, Last.fm, and more.

---

<div align="center">

### ⭐ If you found this project helpful, please give it a star!

**Connect:** [Portfolio](https://mangeshraut.pro) • [LinkedIn](https://linkedin.com/in/mangeshraut71298) • [GitHub](https://github.com/mangeshraut712) • [Snapchat](https://snapchat.com/t/nk1K673G) • [Email](mailto:mbr63@drexel.edu)

---

**© 2026 Mangesh Raut • Built with ❤️ in Pennsylvania**

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

</div>

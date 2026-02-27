<div align="center">

# 🚀 Mangesh Raut — AI-Powered Portfolio

### *Next-Generation Developer Portfolio with Intelligent AI Assistant*

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
- [Engineering Docs](#-engineering-docs)
- [Scripts](#-available-scripts)
- [Quality Gates](#-quality--performance-gates)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-connect-with-me)

---

## 🌟 About

This is my **personal portfolio website** — not just a static resume, but an **intelligent, interactive experience** that showcases modern full-stack development. It features a real-time AI chatbot assistant, live GitHub integration, an interactive canvas game, and a premium glassmorphism UI design.

Built with **Python FastAPI** backend, **vanilla JavaScript** frontend, and deployed on multiple platforms for maximum reliability and performance.

<div align="center">

### 💡 Project Highlights

| 🧠 AI Assistant | 🎮 Hidden Game | 📊 Live Data | 🎨 Premium UI |
|:---------------:|:--------------:|:------------:|:-------------:|
| Real-time streaming chatbot with context awareness | Debug Runner - Canvas game | GitHub API integration | Apple-inspired glassmorphism |

</div>

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

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
- 🔍 **Smart Filtering** — Automatically excludes forked repos, sorts by last updated
- 📈 **Live Statistics** — Real-time star counts, fork counts, and primary languages
- 🎨 **Beautiful Cards** — Glassmorphism design with smooth hover animations
- 🔖 **Dynamic Tags** — Topic badges automatically pulled from repository metadata
- ⚡ **Intelligent Caching** — 10-minute client + server cache window to reduce API pressure
- 🛡️ **Backend Proxy First** — Uses `/api/github/repos/public` first, then direct GitHub API fallback

**Implementation:** Custom JavaScript module with GitHub REST API integration

</details>

### 🎨 Premium Design System

<details>
<summary><b>🖌️ Click to explore design details</b></summary>

<br/>

**Apple-Inspired Glassmorphism:**
- ✨ Frosted glass effects with advanced backdrop blur
- 🌈 Neural network-style gradient animations
- 🎭 Buttery-smooth 60fps CSS transitions
- 🌓 Automatic dark/light theme based on system preferences
- 📐 Mobile-first responsive design (breakpoints at 640px, 768px, 1024px)
- ♿ **WCAG 2.2 AA** accessibility compliance with full keyboard navigation

**Typography Choices:**
- **Primary Font:** Inter (Google Fonts) — Modern, highly readable
- **Display Font:** SF Pro Display — Apple's premium typeface
- **Monospace:** SF Mono / JetBrains Mono for code snippets

**Color System:**
- Light mode: Clean whites with subtle blue accents
- Dark mode: Deep blacks with vibrant neon highlights
- Consistent 8px spacing grid throughout

</details>

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

## 🌐 Live Demos

### Primary Website
🚀 **[mangeshraut.pro](https://mangeshraut.pro)** — Main portfolio (custom domain)

### Alternative Deployments
- 📄 **[GitHub Pages](https://mangeshraut712.github.io/mangeshrautarchive/)** — Static mirror
- ⚡ **[Vercel](https://mangeshrautarchive.vercel.app)** — Edge deployment

> **Note:** All deployments are identical in functionality. The custom domain offers the best performance and SEO.

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

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
![xAI](https://img.shields.io/badge/xAI-Grok_4.1_Fast-111111?style=for-the-badge)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude_3.5_Sonnet-D97706?style=for-the-badge)

### DevOps & Tools

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

### Detailed Stack

**Frontend Architecture:**
```
├── HTML5 — Semantic markup with SEO optimization
├── CSS3 — 30+ modular stylesheets (108KB core styles)
├── JavaScript ES2024+ — 34 modular files (core + modules + services + components)
├── Tailwind CSS 4.x — Utility-first styling system
├── Prism.js — Syntax highlighting for code blocks
├── Font Awesome 6.x — Comprehensive icon library
└── Web Speech API — Voice input/output capabilities
```

**Backend Architecture:**
```python
├── Python 3.12+ — Modern Python with type hints
├── FastAPI — High-performance async web framework
├── Uvicorn — Lightning-fast ASGI server
├── httpx — Async HTTP client for API calls
├── Pydantic — Data validation and settings management
└── python-dotenv — Environment configuration
```

**AI Integration:**
```
├── OpenRouter API — Multi-model AI gateway
├── Default Model — x-ai/grok-4.1-fast (configurable via OPENROUTER_MODEL)
├── Alternate Models — x-ai/grok-2-1212 and anthropic/claude-3.5-sonnet
├── Streaming NDJSON — Real-time response delivery
└── Local fallback + session memory — resilient behavior when API is unavailable
```

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

## 🚀 Quick Start

### Prerequisites

Make sure you have these installed before starting:

- **Node.js** 20+ and **npm** 10+
- **Python** 3.12+
- **Git** for version control
- 🔑 **OpenRouter API Key** (optional, for AI chatbot features)

### Installation Steps

```bash
# 1️⃣ Clone the repository
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

# 2️⃣ Install Node.js dependencies
npm ci

# 3️⃣ Install Python dependencies
pip install -r requirements.txt

# 4️⃣ Set up environment variables
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY (if you want AI features)

# 5️⃣ Start the development servers
npm run dev
```

This will start:
- **Frontend** on `http://localhost:3000`
- **Backend API** on `http://localhost:8000`

### Alternative: Run Servers Separately

```bash
# Frontend only (port 3000)
npm run dev:frontend

# Backend only (port 8000)
npm run dev:backend
```

### Production Build

```bash
# Build optimized production assets
npm run build

# Rebuild Tailwind CSS only
npm run build:css
```

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

## 📂 Project Structure

Detailed conventions live in [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md).

```text
mangeshrautarchive/
├── api/                        # FastAPI backend + serverless handlers
├── src/                        # Frontend source
│   ├── assets/                 # CSS, images, icons, downloadable files
│   └── js/
│       ├── core/               # App bootstrap + orchestration
│       ├── modules/            # Feature modules
│       ├── services/           # Shared runtime services
│       ├── components/         # Reusable UI components
│       └── utils/              # Small focused helpers
├── scripts/                    # Build/dev/QA/security scripts
├── tests/e2e/                  # Playwright smoke + a11y + post-deploy checks
├── docs/
│   ├── README.md               # Documentation index
│   ├── PROJECT_STRUCTURE.md    # Folder and ownership conventions
│   └── testing/                # Chrome QA runbooks/templates
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

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

## 🧭 Engineering Docs

- `docs/README.md` — Documentation index
- `docs/PROJECT_STRUCTURE.md` — Source layout and ownership rules
- `docs/testing/CHROME_QA_RUNBOOK.md` — Chrome environment + release verification flow
- `docs/testing/CHROME_TEST_MATRIX.md` — Functional/perf/security/usability checklist
- `docs/testing/RELEASE_TEST_REPORT_TEMPLATE.md` — Release sign-off template
- `docs/testing/POST_DEPLOYMENT_FEEDBACK_LOOP.md` — Post-release intake + triage loop

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start full stack (frontend + backend) |
| `npm run dev:frontend` | 🎨 Start frontend server only (port 3000) |
| `npm run dev:backend` | 🔧 Start Python backend only (port 8000) |
| `npm run build` | 📦 Build production assets |
| `npm run build:css` | 🎨 Compile Tailwind CSS |
| `npm run lint` | 🔍 Run ESLint code quality checks |
| `npm run lint:fix` | ✨ Auto-fix linting issues |
| `npm run lint:css` | 🧹 Run Stylelint across CSS |
| `npm run check` | ✅ Run JS lint + tests |
| `npm test` | 🧪 Run Vitest test suite |
| `npm run qa:smoke` | 🌐 Playwright smoke tests on Chrome |
| `npm run qa:smoke:mobile` | 📱 Playwright smoke tests on Mobile Chrome emulation |
| `npm run qa:a11y` | ♿ Axe accessibility baseline on Chrome |
| `npm run qa:lighthouse:desktop` | ⚡ Lighthouse desktop gate |
| `npm run qa:lighthouse:mobile` | 📱 Lighthouse mobile gate |
| `npm run qa:postdeploy` | 🧪 Smoke + a11y check against deployed URL (`PLAYWRIGHT_BASE_URL`) |
| `npm run qa:chrome` | 🧭 Full Chrome QA gate (smoke + a11y + perf) |
| `npm run qa:prod-ready` | 🛡️ Full pre-release gate |
| `npm run optimize-images` | 🖼️ Optimize image assets |
| `npm run security-check` | 🔒 Scan for exposed secrets |
| `npm run audit:css-duplicates` | 🔎 Report exact duplicate CSS rule blocks |
| `npm run clean` | 🧽 Remove generated build/test artifacts and Python caches |

Chrome QA runbook and report template:
- `docs/testing/CHROME_QA_RUNBOOK.md`
- `docs/testing/CHROME_TEST_MATRIX.md`
- `docs/testing/RELEASE_TEST_REPORT_TEMPLATE.md`
- `docs/testing/POST_DEPLOYMENT_FEEDBACK_LOOP.md`
- `docs/testing/README.md`

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

## 🧪 Quality & Performance Gates

Release readiness is validated by executable gates (not static README snapshots):

- `npm run qa:smoke`
- `npm run qa:a11y`
- `npm run qa:lighthouse:desktop`
- `npm run qa:lighthouse:mobile`
- `npm run qa:chrome`
- `npm run qa:prod-ready`

Current configured Lighthouse release floor:

- Desktop: Perf/A11y/Best Practices/SEO `>= 90`
- Mobile: Perf/A11y/Best Practices/SEO `>= 90`

### Performance Practices

- ✅ **Lazy Loading** — Images and components load on-demand
- ✅ **Code Splitting** — Modular JavaScript architecture
- ✅ **Asset Optimization** — WebP images, minified CSS/JS
- ✅ **CDN Delivery** — Static assets served via edge network
- ✅ **Caching Strategy** — Service worker with smart cache-first approach
- ✅ **Zero Layout Shift** — Proper image dimensions and placeholders

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

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

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You're free to use this code for your own portfolio, but please:
- Give appropriate credit
- Don't claim it as entirely your own work
- Modify it to make it unique to you

---

## 💬 Connect with Me

<div align="center">

### **Mangesh Raut**

*Software Engineer | Full-Stack Developer | AI/ML Enthusiast*

[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-mangeshraut.pro-0071e3?style=for-the-badge)](https://mangeshraut.pro)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/mangeshraut71298)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/mangeshraut712)
[![Email](https://img.shields.io/badge/Email-Contact-EA4335?style=for-the-badge&logo=gmail)](mailto:mbr63@drexel.edu)

**Current Position:** Software Engineer @ Customized Energy Solutions  
**Education:** M.S. Computer Science @ Drexel University (Completed 2025)  
**Location:** Philadelphia, PA, USA 🇺🇸

</div>

---

## 🙏 Acknowledgments

Built with amazing open-source tools:

- **FastAPI** — Modern Python web framework
- **Tailwind CSS** — Utility-first CSS framework
- **Font Awesome** — Icon library
- **Prism.js** — Syntax highlighting
- **OpenRouter** — AI model gateway
- **xAI & Google** — For incredible AI models

---

<div align="center">

### ⭐ If you found this project helpful, please give it a star!

---

**© 2026 Mangesh Raut • Built with ❤️ in Philadelphia**

[↑ Back to Top](#-mangesh-raut--ai-powered-portfolio)

</div>

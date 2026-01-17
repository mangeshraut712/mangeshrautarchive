<div align="center">

# 🚀 Mangesh Raut — AI-Powered Portfolio

**Next-Generation Software Engineer Portfolio with Neural AI Assistant**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-mangeshraut.pro-0071e3?style=for-the-badge)](https://mangeshraut.pro)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://mangeshrautarchive.vercel.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Active-181717?style=for-the-badge&logo=github)](https://mangeshraut712.github.io/mangeshrautarchive/)

*A premium full-stack portfolio featuring AssistMe AI, glassmorphism design, and 2026-grade user experience*

</div>

---

## ✨ Highlights

| Feature | Technology | Description |
|---------|-----------|-------------|
| 🧠 **AssistMe AI** | Grok 4.1 Fast via OpenRouter | Real-time streaming AI assistant with conversation memory |
| 🎨 **Premium UI** | Apple-inspired glassmorphism | Fluid animations, dark/light themes, responsive design |
| 🎮 **Debug Runner** | Canvas-based game | Interactive retro game with touch controls |
| 📊 **Live GitHub** | GitHub API integration | Real-time project stats with commit activity |
| 🎯 **Accessibility** | WCAG 2.2 compliant | Full keyboard navigation, screen reader support |
| ⚡ **Performance** | Lighthouse 95+ | Optimized assets, lazy loading, CDN delivery |

---

## 🛠️ Tech Stack

### Frontend
```
├── HTML5 + Semantic Markup
├── CSS3 + Tailwind CSS 4.x
├── JavaScript ES2024+ (Modules)
├── Prism.js (Syntax Highlighting)
├── Font Awesome 6.x (Icons)
└── Web Speech API (Voice Input)
```

### Backend
```
├── Python 3.12+
├── FastAPI (ASGI Framework)
├── Uvicorn (ASGI Server)
├── httpx (Async HTTP Client)
├── Pydantic (Data Validation)
└── OpenRouter API (AI Gateway)
```

### AI & Intelligence
```
├── Grok 4.1 Fast (Primary Model)
├── Gemini 2.0 Flash (Fallback)
├── Claude 3.5 Sonnet (Fallback)
├── Streaming Responses (NDJSON)
├── Conversation Memory
└── Agentic Actions System
```

### DevOps & Tooling
```
├── Node.js 20+ / npm 10+
├── Vitest (Testing)
├── ESLint + Stylelint (Linting)
├── Sharp (Image Optimization)
├── Docker (Containerization)
├── Vercel / Cloud Run (Deployment)
└── GitHub Actions (CI/CD)
```

---

## 📂 Project Structure

```
mangeshrautarchive/
├── 📁 api/                         # Backend API
│   ├── index.py                    # FastAPI main application
│   ├── memory_manager.py           # Conversation memory system
│   └── integrations/               # External service connectors
│       └── github_connector.py     # GitHub API integration
│
├── 📁 src/                         # Frontend source
│   ├── index.html                  # Main entry point
│   ├── 📁 assets/
│   │   ├── 📁 css/                 # Stylesheets (30+ organized files)
│   │   │   ├── style.css           # Core styles (108KB)
│   │   │   ├── ai-assistant.css    # Chatbot UI (34KB)
│   │   │   ├── sitewide-design-system.css
│   │   │   └── ...
│   │   ├── 📁 images/              # Optimized assets
│   │   └── 📁 files/               # Downloadable resources
│   │
│   └── 📁 js/                      # JavaScript modules
│       ├── 📁 core/                # Core functionality
│       │   ├── script.js           # Main application
│       │   ├── chat.js             # AI integration
│       │   ├── config.js           # Configuration
│       │   └── modern-input.js     # Input handling
│       │
│       ├── 📁 modules/             # Feature modules (22 files)
│       │   ├── chatbot.js          # AssistMe AI chatbot
│       │   ├── agentic-actions.js  # AI action handlers
│       │   ├── debug-runner.js     # Game engine
│       │   ├── privacy-dashboard.js # Privacy controls
│       │   ├── accessibility.js    # A11y features
│       │   ├── github-projects.js  # GitHub integration
│       │   └── ...
│       │
│       └── 📁 utils/               # Utility functions
│
├── 📁 scripts/                     # Build & dev scripts
│   ├── build.js                    # Asset builder
│   ├── local-server.js             # Development server
│   ├── optimize-images.js          # Image optimization
│   └── security-check.js           # Secrets scanner
│
├── 📄 package.json                 # Node.js dependencies
├── 📄 requirements.txt             # Python dependencies
├── 📄 vercel.json                  # Vercel deployment config
├── 📄 Dockerfile                   # Container config
└── 📄 .env.example                 # Environment template
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and **npm** 10+
- **Python** 3.12+
- **OpenRouter API Key** (optional, for full AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

# Install dependencies
npm install
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

### Development

```bash
# Run full stack (frontend + backend)
npm run dev

# Or run separately
npm run dev:frontend    # Starts frontend on port 3000
npm run dev:backend     # Starts FastAPI on port 8000
```

### Production Build

```bash
npm run build           # Build all assets
npm run build:css       # Rebuild Tailwind CSS only
```

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start full development stack |
| `npm run dev:frontend` | Start frontend server only |
| `npm run dev:backend` | Start Python backend only |
| `npm run build` | Build production assets |
| `npm run build:css` | Compile Tailwind CSS |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run test` | Run Vitest test suite |
| `npm run optimize-images` | Optimize image assets |
| `npm run security-check` | Scan for secrets/credentials |

---

## 🌐 Live Deployments

| Platform | URL | Status |
|----------|-----|--------|
| **Production** | [mangeshraut.pro](https://mangeshraut.pro) | Primary |
| **Vercel** | [mangeshrautarchive.vercel.app](https://mangeshrautarchive.vercel.app) | Frontend + API |
| **GitHub Pages** | [mangeshraut712.github.io](https://mangeshraut712.github.io/mangeshrautarchive/) | Static Mirror |
| **Cloud Run** | [mangesh-portfolio-api](https://mangesh-portfolio-api-q3kdyzhwba-uc.a.run.app) | Container |

---

## 🧠 AssistMe AI Features

The portfolio includes **AssistMe**, a premium AI assistant powered by Grok 4.1 Fast:

- **🔄 Real-time Streaming** — Responses stream character-by-character
- **💾 Conversation Memory** — Context-aware multi-turn conversations
- **🎤 Voice Input** — Web Speech API integration
- **🔊 Voice Output** — Text-to-speech for responses
- **🎯 Agentic Actions** — Theme toggle, PDF download, navigation
- **📊 Live Metadata** — Model info, tokens, latency display
- **🛡️ Privacy Dashboard** — Full data control for users
- **📴 Offline Fallback** — Local intelligence when disconnected

---

## 🎨 Design System

The portfolio implements a comprehensive design system:

- **Apple-Inspired Glassmorphism** — Frosted glass effects with blur
- **Premium Typography** — Inter, SF Pro Display fonts
- **Fluid Animations** — 60fps CSS transitions and keyframes
- **Dark/Light Themes** — System preference detection
- **Responsive Grid** — Mobile-first, breakpoint-optimized
- **Micro-interactions** — Hover states, loading indicators

---

## 📱 Features By Section

| Section | Features |
|---------|----------|
| **Hero** | Profile showcase, resume download, animated background |
| **About** | Bio, philosophy, social links |
| **Experience** | Timeline view, achievement metrics |
| **Skills** | Category badges, proficiency indicators |
| **Projects** | GitHub integration, filtering, live stats |
| **Education** | Degree timeline, certifications |
| **Publications** | Research papers, blog posts |
| **Awards** | Achievements, recognitions |
| **Contact** | Firebase form, social icons, location |
| **Game** | Debug Runner canvas game with touch controls |

---

## 🔒 Security & Privacy

- **No tracking cookies** — Privacy-first design
- **CORS configured** — Secure cross-origin requests
- **Rate limiting** — 20 requests/minute per IP
- **Input validation** — Pydantic schemas on backend
- **Secrets scanning** — Automated credential detection
- **HTTPS only** — All deployments use TLS

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

<div align="center">

**Mangesh Raut**  
*Software Engineer | Full-Stack Developer | AI/ML Engineer*

[![Website](https://img.shields.io/badge/Website-mangeshraut.pro-0071e3?style=flat-square&logo=safari)](https://mangeshraut.pro)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-mangeshraut71298-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/mangeshraut71298)
[![GitHub](https://img.shields.io/badge/GitHub-mangeshraut712-181717?style=flat-square&logo=github)](https://github.com/mangeshraut712)
[![Email](https://img.shields.io/badge/Email-mbr63@drexel.edu-EA4335?style=flat-square&logo=gmail)](mailto:mbr63@drexel.edu)

</div>

---

<div align="center">

*Built with ❤️ in Philadelphia, PA — January 2026*

</div>

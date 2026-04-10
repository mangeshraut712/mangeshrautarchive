<div align="center">

<img src="https://mangeshraut.pro/assets/images/home-screenshot.webp" alt="Mangesh Raut Portfolio Homepage" width="100%" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);" />

<h1 style="font-size: 3rem; font-weight: 700; margin: 1rem 0; color: #1d1d1f;">Mangesh Raut</h1>
<h2 style="font-size: 1.5rem; font-weight: 400; margin: 0.5rem 0; color: #86868b;">AI-Powered Interactive Portfolio</h2>

<p style="font-size: 1.125rem; max-width: 600px; margin: 1rem auto; color: #86868b;">
  Experience the future of developer portfolios with real-time AI conversations, live GitHub data, immersive design, and cutting-edge web technologies.
</p>

<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 2rem 0;">
  <a href="https://mangeshraut.pro" style="background: linear-gradient(135deg, #0071e3, #40a9ff); color: white; padding: 0.75rem 1.5rem; border-radius: 25px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 16px rgba(0,113,227,0.3); transition: all 0.2s;">
    🌐 View Live Demo
  </a>
  <a href="https://github.com/mangeshraut712/mangeshrautarchive" style="background: #f5f5f7; color: #1d1d1f; padding: 0.75rem 1.5rem; border-radius: 25px; text-decoration: none; font-weight: 600; border: 1px solid #d2d2d7; transition: all 0.2s;">
    📖 View Source
  </a>
</div>

[![Live Portfolio](https://img.shields.io/badge/🌐_Live_Demo-mangeshraut.pro-0071e3?style=for-the-badge&logo=vercel&logoColor=white)](https://mangeshraut.pro)
[![GitHub Pages](https://img.shields.io/badge/📄_GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/mangeshraut712/mangeshrautarchive/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/mangeshraut712/mangeshrautarchive/actions)

</div>

---

## ✨ Features Showcase

<div align="center">

| 🎯 AI Assistant                            | 📊 Live Data                                   | 🎨 Premium Design                         | 🎮 Interactive Games                         |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| Real-time streaming chatbot with voice I/O | GitHub stats, Last.fm music, system monitoring | Apple-inspired glassmorphism & animations | Canvas-based arcade game with touch controls |

</div>

### 🤖 AI-Powered Assistant

<details>
<summary style="cursor: pointer; font-size: 1.25rem; font-weight: 600; margin: 1rem 0;"><b>💬 Click to explore AssistMe features</b></summary>
<br/>
<div style="background: linear-gradient(135deg, #f5f5f7, #ffffff); padding: 1.5rem; border-radius: 16px; border: 1px solid #e5e5e7;">
  <p style="margin: 0 0 1rem 0;"><strong>AssistMe</strong> is a fully functional AI companion that can:</p>
  <ul style="margin: 0;">
    <li>🔄 Stream responses in real-time like ChatGPT</li>
    <li>💾 Maintain conversation context</li>
    <li>🎤 Accept voice input and provide voice output</li>
    <li>🎯 Control website elements (themes, navigation, downloads)</li>
    <li>📊 Display live metadata and privacy controls</li>
  </ul>
  <p style="margin: 1rem 0 0 0;"><em>Powered by xAI Grok and Anthropic Claude via OpenRouter</em></p>
</div>
</details>

### 📺 Currently Card

<details>
<summary style="cursor: pointer; font-size: 1.25rem; font-weight: 600; margin: 1rem 0;"><b>🎬 Click to see media preferences</b></summary>
<br/>
<div style="background: linear-gradient(135deg, #f5f5f7, #ffffff); padding: 1.5rem; border-radius: 16px; border: 1px solid #e5e5e7;">
  <p style="margin: 0 0 1rem 0;">Curated shelves featuring:</p>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
    <div style="text-align: center;">
      <span style="font-size: 2rem;">📺</span>
      <p style="margin: 0.5rem 0;"><strong>Shows & Movies</strong><br/>30+ titles with streaming links</p>
    </div>
    <div style="text-align: center;">
      <span style="font-size: 2rem;">🎵</span>
      <p style="margin: 0.5rem 0;"><strong>Music</strong><br/>Last.fm integration</p>
    </div>
    <div style="text-align: center;">
      <span style="font-size: 2rem;">📚</span>
      <p style="margin: 0.5rem 0;"><strong>Books</strong><br/>Personal favorites</p>
    </div>
  </div>
</div>
</details>

### 📊 Live GitHub Showcase

<details>
<summary style="cursor: pointer; font-size: 1.25rem; font-weight: 600; margin: 1rem 0;"><b>💻 Click to explore GitHub integration</b></summary>
<br/>
<div style="background: linear-gradient(135deg, #f5f5f7, #ffffff); padding: 1.5rem; border-radius: 16px; border: 1px solid #e5e5e7;">
  <p style="margin: 0 0 1rem 0;">Dynamic project showcase with:</p>
  <ul style="margin: 0;">
    <li>🔄 Auto-updating repository data</li>
    <li>📈 Live star, fork, and language stats</li>
    <li>🎨 Apple 2026 design cards</li>
    <li>🔍 Fuzzy search and filtering</li>
    <li>🗺️ Interactive project modals</li>
  </ul>
</div>
</details>

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "🌐 Frontend (ES6+ Modules)"
        A[Vanilla JavaScript] --> B[Tailwind CSS v4]
        A --> C[Apple-inspired Design System]
        A --> D[Web APIs Integration]
    end

    subgraph "🖥️ Backend (Python Async)"
        E[FastAPI + Uvicorn] --> F[Pydantic Models]
        E --> G[httpx Client]
        E --> H[WebSocket Support]
    end

    subgraph "🤖 AI & Data Layer"
        I[OpenRouter API] --> J[xAI Grok + Claude]
        K[GitHub REST API] --> E
        L[Last.fm API] --> E
    end

    subgraph "🚀 Deployment"
        M[Vercel Edge] --> N[CDN & Functions]
        O[GitHub Pages] --> P[Static Hosting]
        Q[Custom Domain] --> R[mangeshraut.pro]
    end

    A --> E
    E --> I
    A -.-> M
    A -.-> O
    A -.-> Q
```

---

## 🛠️ Technology Stack

<div align="center">

### Frontend Technologies

<a href="https://html.spec.whatwg.org/" target="_blank"><img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/></a>
<a href="https://www.w3.org/TR/CSS/" target="_blank"><img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/></a>
<a href="https://tc39.es/ecma262/" target="_blank"><img src="https://img.shields.io/badge/JavaScript-ES2026+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/></a>
<a href="https://tailwindcss.com/" target="_blank"><img src="https://img.shields.io/badge/Tailwind_CSS-4.0.9-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/></a>

### Backend & APIs

<a href="https://www.python.org/" target="_blank"><img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/></a>
<a href="https://fastapi.tiangolo.com/" target="_blank"><img src="https://img.shields.io/badge/FastAPI-0.120+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/></a>
<a href="https://www.uvicorn.org/" target="_blank"><img src="https://img.shields.io/badge/Uvicorn-0.35+-2C2D72?style=for-the-badge&logo=gunicorn&logoColor=white" alt="Uvicorn"/></a>

### AI & Intelligence

<a href="https://openrouter.ai/" target="_blank"><img src="https://img.shields.io/badge/OpenRouter-API-0EA5E9?style=for-the-badge" alt="OpenRouter"/></a>
<a href="https://x.ai/" target="_blank"><img src="https://img.shields.io/badge/xAI-Grok_4.1-111111?style=for-the-badge&logo=xai&logoColor=white" alt="xAI Grok"/></a>
<a href="https://anthropic.com/" target="_blank"><img src="https://img.shields.io/badge/Anthropic-Claude_4-D97706?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic Claude"/></a>

### Quality & Testing

<a href="https://playwright.dev/" target="_blank"><img src="https://img.shields.io/badge/Playwright-1.58+-45BA4B?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright"/></a>
<a href="https://lighthouse.dev/" target="_blank"><img src="https://img.shields.io/badge/Lighthouse-13+-F44B21?style=for-the-badge&logo=lighthouse&logoColor=white" alt="Lighthouse"/></a>
<a href="https://eslint.org/" target="_blank"><img src="https://img.shields.io/badge/ESLint-9+-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint"/></a>

### Deployment & Hosting

<a href="https://vercel.com/" target="_blank"><img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/></a>
<a href="https://pages.github.com/" target="_blank"><img src="https://img.shields.io/badge/GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages"/></a>

</div>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- Python 3.13+
- Git

### Installation

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
npm ci
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
npm run dev
```

🎯 **Access:**

- Frontend: `http://localhost:4000`
- Backend API: `http://localhost:8001`

---

## 📂 Project Structure

```
mangeshrautarchive/
├── api/                          # FastAPI backend
│   ├── integrations/             # External API clients
│   ├── monitoring/               # Health checks
│   └── index.py                  # API routes
├── src/                          # Frontend source
│   ├── assets/
│   │   ├── css/                  # Stylesheets
│   │   ├── images/               # Optimized media
│   │   └── icons/                # SVG icons
│   ├── js/
│   │   ├── core/                 # Bootstrap
│   │   ├── modules/              # Features
│   │   └── services/             # Utilities
│   └── index.html                # Main page
├── tests/                        # Test suites
├── scripts/                      # Build tools
├── .github/workflows/            # CI/CD
└── package.json                  # Dependencies
```

---

## 📜 Available Scripts

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `npm run dev`      | Start full stack development |
| `npm run build`    | Build production assets      |
| `npm run test`     | Run unit tests               |
| `npm run qa:smoke` | End-to-end smoke tests       |
| `npm run qa:a11y`  | Accessibility checks         |
| `npm run lint`     | Code quality checks          |

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

## 🌟 Connect & Support

<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 2rem 0;">
  <a href="https://linkedin.com/in/mangeshraut71298" style="color: #0077b5;"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mangeshraut712" style="color: #333;"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/></a>
  <a href="mailto:mbr63@drexel.edu" style="color: #ea4335;"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/></a>
</div>

<p style="color: #86868b; font-size: 0.875rem;">© 2026 Mangesh Raut • Crafted with ❤️ in Pennsylvania</p>

</div>

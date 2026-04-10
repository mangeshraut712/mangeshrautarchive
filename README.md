# Mangesh Raut Portfolio

[![Live Demo](https://img.shields.io/badge/Live_Demo-mangeshraut.pro-0071e3?style=flat-square&logo=vercel&logoColor=white)](https://mangeshraut.pro)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-181717?style=flat-square&logo=github&logoColor=white)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A premium, interactive portfolio crafted with Apple-inspired design principles for 2026. Features AI-powered conversations, real-time data integrations, and advanced web technologies.

## Key Features

- **AI Assistant**: Intelligent chatbot with voice I/O and contextual memory
- **Live Data Integration**: Real-time GitHub statistics and Last.fm music tracking
- **Interactive Experiences**: Canvas-based game, dynamic media shelf, and responsive design
- **System Monitoring**: Backend health checks and deployment status
- **Accessibility**: WCAG 2.2 AA compliant with full keyboard navigation
- **Performance Optimized**: Lighthouse scores exceeding 90 on core metrics

## Technology Stack

### Frontend

- HTML5, CSS3, ES6+ JavaScript
- Tailwind CSS, Apple-inspired design system
- Web APIs: Speech, Canvas, Local Storage

### Backend

- Python 3.12+ with FastAPI
- Uvicorn ASGI server
- OpenRouter AI integration

### Quality Assurance

- Playwright E2E testing
- Lighthouse performance audits
- ESLint and Stylelint

### Deployment

- Vercel for API and hosting
- GitHub Pages for static fallback
- Docker containerization

## Quick Setup

### Prerequisites

- Node.js 22+
- Python 3.12+
- Git

### Installation

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
npm ci
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Add API keys if desired
npm run dev
```

Visit `http://localhost:4000` for the frontend and `http://localhost:8001` for the API.

## Project Architecture

```
mangeshrautarchive/
├── api/              # FastAPI backend and integrations
├── src/              # Frontend source files
│   ├── assets/       # Styles, images, and media
│   └── js/           # Modular JavaScript architecture
│       ├── core/     # Bootstrap and configuration
│       ├── modules/  # Feature implementations
│       └── services/ # Shared utilities
├── scripts/          # Build and quality scripts
├── tests/            # End-to-end tests
└── dist/             # Production build output
```

## Links

- [Live Portfolio](https://mangeshraut.pro) - Primary deployment
- [GitHub Pages](https://mangeshraut712.github.io/mangeshrautarchive/) - Static version
- [System Monitor](https://mangeshraut.pro/monitor.html) - Backend health dashboard
- [LinkedIn](https://linkedin.com/in/mangeshraut71298)
- [GitHub](https://github.com/mangeshraut712)

## License

MIT License - see [LICENSE](LICENSE) for details.

© 2026 Mangesh Raut. Crafted in Pennsylvania with precision and innovation.

# 🚀 Mangesh Raut Portfolio - Modern 2025 Edition

A sleek, AI-powered portfolio website featuring dynamic GitHub integration, intelligent chatbot, and cutting-edge web technologies. Built with a hybrid architecture combining the speed of static hosting with the power of serverless Python APIs.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://mangeshraut.pro)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?style=for-the-badge&logo=github)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![Vercel Backend](https://img.shields.io/badge/Backend-FastAPI-000000?style=for-the-badge&logo=fastapi)](https://mangeshrautarchive.vercel.app/api/health)
[![AI Powered](https://img.shields.io/badge/AI-OpenRouter-blueviolet?style=for-the-badge&logo=openai)](https://openrouter.ai/)

---

## ✨ Key Features

### 🤖 **AI-Powered Chatbot** ("AssistMe")
- **Advanced AI Engine**: Powered by **Google Gemini 2.0 Flash** via OpenRouter API.
- **Intelligent Capabilities**:
  - **Portfolio Expert**: Answers questions about experience, skills, and education contextually.
  - **Math & Logic**: Solves complex calculations and technical queries.
  - **General Knowledge**: Provides information on world topics, history, and science.
  - **Entertainment**: Tells jokes and engages in casual conversation.
- **Robust Architecture**:
  - **FastAPI Backend**: High-performance Python API on Vercel.
  - **Smart Fallbacks**: Graceful degradation to offline mode if API is unavailable.
  - **Response Metadata**: Displays model used, confidence score, and processing time.

### 🎨 **Premium UI/UX Design**
- **Modern Dark Mode**: **OLED-optimized solid black** (`#000000`) card backgrounds for maximum contrast and battery efficiency.
- **Glassmorphism**: Subtle transparency and blur effects for a modern feel.
- **Responsive Layouts**: Mobile-first design using CSS Grid and Flexbox.
- **Smooth Animations**: Hardware-accelerated transitions and micro-interactions.

### 📊 **Dynamic GitHub Integration**
- **Live Projects**: Automatically fetches and displays your latest repositories.
- **Smart Filtering**: Filter projects by language (Python, Java, JavaScript) or search by name.
- **Real-time Stats**: Displays live star counts, forks, and repository descriptions.
- **Performance Caching**: Client-side caching to minimize API rate limits.

### 📬 **Secure Contact System**
- **Firebase Integration**: Direct-to-database message submission.
- **Real-time Validation**: Instant feedback on form fields.
- **Security Rules**: Write-only access ensures user data privacy.

---

## 🛠️ Technology Stack

### Frontend (Static)
- **HTML5**: Semantic structure.
- **CSS3**: Custom properties, Flexbox, Grid, and responsive media queries.
- **JavaScript (ES2024)**: Modern syntax, Modules, Async/Await.
- **Hosting**: GitHub Pages (Global CDN).

### Backend (Serverless)
- **Python FastAPI**: High-performance web framework for the Chatbot API.
- **Vercel**: Serverless function deployment and edge routing.
- **OpenRouter API**: Unified interface for LLM access.
- **Firebase Firestore**: NoSQL database for contact form messages.

### DevOps & Tools
- **Git & GitHub**: Version control and source code management.
- **GitHub Actions**: Automated CI/CD pipelines.
- **Vercel CLI**: Deployment and environment management.
- **npm**: Dependency management.

---

## 📁 Project Structure

```
mangeshrautarchive/
├── src/                     # Frontend Source Code
│   ├── index.html           # Main Entry Point
│   ├── assets/              # Static Assets
│   │   ├── css/             # Stylesheets (Modular CSS)
│   │   │   ├── style.css    # Global Styles
│   │   │   ├── dark-mode-cards.css # Dark Mode Overrides
│   │   │   └── ...
│   │   ├── images/          # Images & Icons
│   │   └── files/           # Downloads (Resume)
│   └── js/                  # JavaScript Modules
│       ├── core/            # Core Logic (Chat, Config)
│       ├── modules/         # Feature Modules (GitHub, Skills)
│       └── utils/           # Utilities (Theme, Scroll)
├── api/                     # Backend Source Code
│   ├── index.py             # FastAPI Application Entry Point
│   └── ...
├── vercel.json              # Vercel Routing Configuration
├── requirements.txt         # Python Dependencies
├── package.json             # Node.js Dependencies
└── README.md                # Project Documentation
```

---

## 🚀 Deployment & Setup

### 1. Hybrid Deployment Architecture
This project uses a hybrid approach:
- **Frontend**: Hosted on **GitHub Pages** (served from `src/` or `docs/`).
- **Backend**: Hosted on **Vercel** (serves `/api/*` endpoints).

### 2. Vercel Configuration (Backend)
The `vercel.json` file configures rewrites to route API requests to the Python backend while serving static files correctly.

**Environment Variables (Required in Vercel):**
- `OPENROUTER_API_KEY`: Your OpenRouter API Key.
- `OPENROUTER_SITE_URL`: Your site URL (e.g., `https://mangeshraut.pro`).
- `OPENROUTER_SITE_TITLE`: Your site title.

### 3. Local Development
To run the full stack locally:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/mangeshraut712/mangeshrautarchive.git
    cd mangeshrautarchive
    ```

2.  **Install Dependencies**:
    ```bash
    npm install          # Frontend tools
    pip install -r requirements.txt  # Backend dependencies
    ```

3.  **Run the Server**:
    ```bash
    # Runs FastAPI server on localhost:8000
    uvicorn api.index:app --reload
    ```

4.  **Access the App**:
    Open `http://localhost:8000` in your browser.

---

## 🔗 Live Links

| Service | URL | Description |
|---------|-----|-------------|
| **Custom Domain** | [mangeshraut.pro](https://mangeshraut.pro) | Primary production URL |
| **Vercel App** | [mangeshrautarchive.vercel.app](https://mangeshrautarchive.vercel.app/) | Backend & Alternative Frontend |
| **GitHub Pages** | [mangeshraut712.github.io](https://mangeshraut712.github.io/mangeshrautarchive/) | Static Frontend Mirror |
| **API Health** | [API Status](https://mangeshrautarchive.vercel.app/api/health) | Check Backend Status |

---

## 🎯 Performance & Optimization
- **Lighthouse Score**: Consistently scores **95+** on Performance, Accessibility, and SEO.
- **Zero-Bundle**: Uses native ES Modules for faster load times and no build step for dev.
- **Efficient Caching**: API responses are cached to reduce latency and API costs.

---

## 📄 License
Licensed under the **MIT License**. Feel free to use this code for your own portfolio!

---

## 👨‍💻 Author
**Mangesh Raut**
- **Portfolio**: [mangeshraut.pro](https://mangeshraut.pro)
- **GitHub**: [@mangeshraut712](https://github.com/mangeshraut712)
- **LinkedIn**: [Mangesh Raut](https://linkedin.com/in/mangeshraut71298)

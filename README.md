# 🚀 Antigravity - Premium AI Engineering Portfolio 2026

> **Antigravity** is more than a portfolio; it's a technical partner designed for the **Google AI 2026 Challenge**. 
> Powered by Google Gemini 2.0 Flash, it represents the next generation of agentic engineering showcases.

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![AI](https://img.shields.io/badge/AI-Google%20Gemini%202.0%20Flash-blue)]()
[![Challenge](https://img.shields.io/badge/Challenge-Google%20AI%202026-yellow)]()
[![Branding](https://img.shields.io/badge/Persona-Antigravity-orange)]()

## 🌟 Live Deployments

- **Primary Submission (Google Cloud Run)**: [Antigravity Intelligence Live](https://mangesh-portfolio-api-q3kdyzhwba-uc.a.run.app)
- **Frontend Mirror (Vercel)**: [mangeshrautarchive.vercel.app](https://mangeshrautarchive.vercel.app)
- **Static Mirror (GitHub Pages)**: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)

*All deployments are natively integrated with the Gemini 2.0 Flash technical partner backend.*

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Chatbot System](#-ai-chatbot-system)
- [Deployment](#-deployment)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🎨 **Premium UI/UX**
- ✅ **Apple-Inspired Design** - Modern, clean, professional aesthetic
- ✅ **Dark/Light Mode** - Seamless theme switching with system preference detection
- ✅ **Responsive Layout** - Perfect on desktop, tablet, and mobile
- ✅ **Smooth Animations** - 60fps GPU-accelerated transitions
- ✅ **Accessibility** - WCAG 2.1 AA compliant, keyboard navigation

### 🤖 **Antigravity Intelligence**
- ✅ **Google Gemini 2.0 Flash** - Elite performance and technical depth
- ✅ **Antigravity Persona** - Precise, visionary, and architectural technical partner
- ✅ **Real-Time Streaming** - Token-by-token response display
- ✅ **Voice Input (S2R)** - Speech-to-text with visual feedback
- ✅ **Portfolio Memory** - Session-based conversation history
- ✅ **Engineering Win Focus** - Deep dives into architectural decisions
- ✅ **Mobile Full-Screen** - Immersive chat experience on mobile
- ✅ **Metadata Display** - Model info, tokens, latency, cost tracking
- ✅ **Copy & Speak** - Text-to-speech and clipboard integration
- ✅ **Theme Aware** - Adapts to light/dark mode automatically

### 🎯 **Core Sections**
- 📝 **About** - Professional summary and introduction
- 💼 **Experience** - Work history with achievements
- 🛠️ **Skills** - Technology stack visualization
- 🚀 **Projects** - GitHub integration with live data
- 🎓 **Education** - Academic background
- 📚 **Publications** - Research papers and articles
- 🏆 **Awards** - Certifications and honors
- 📱 **Contact** - Email form with backend integration
- 📅 **Calendar** - Birthday celebration easter egg

### ⚡ **Performance**
- 🎯 **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- ⚡ **First Contentful Paint**: < 1.2s
- 📦 **Code Splitting**: Modular ES6 modules
- 🗜️ **Compression**: GZip for API responses
- 💾 **Lazy Loading**: Images and non-critical resources
- 🚀 **CDN**: Static assets via Vercel Edge Network

---

## 🏗️ Architecture

### **Frontend → Backend → AI Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Deployment Options:                                            │
│  • mangeshraut.pro (Custom Domain)                              │
│  • mangeshrautarchive.vercel.app (Vercel)                       │
│  • mangeshraut712.github.io/mangeshrautarchive (GitHub Pages)   │
│  • localhost:3000 (Development)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    API Calls to Vercel Backend
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI on Google Cloud Run (Python 3.11)                      │
│  • Endpoint: /api/chat                                          │
│  • High-Performance GZip Compression                            │
│  • Intelligent Session Memory & Rate Limiting                   │
└─────────────────────────────────────────────────────────────────┘
                               ↓
                   Native Google AI SDK Calls
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                          AI LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Google Generative AI (Gemini)                                  │
│  • Model: gemini-2.0-flash-exp (Fast & Precise)                │
│  • Persona: Antigravity Technical Partner                       │
│  • Knowledge: Deeply embedded Portfolio Technical Context        │
└─────────────────────────────────────────────────────────────────┘
```

### **Key Design Decisions**

1. **Universal Backend**: All frontends (Vercel, GitHub Pages, localhost) call the same Vercel backend
2. **Serverless**: FastAPI runs on Vercel's Python runtime (auto-scaling, zero maintenance)
3. **Streaming**: Real-time token delivery for better UX
4. **Security**: API key stored in Vercel environment variables, never exposed to frontend
5. **Fallback**: Graceful degradation if API is unavailable

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 20+ (for developer tools)
- Python 3.11+ (for technical backend)
- Google AI API Key ([Google AI Studio](https://aistudio.google.com/))

### **1. Clone Repository**
```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
```

### **2. Install Dependencies**
```bash
npm install
pip install -r requirements.txt
```

### **3. Configure Environment**
Create `.env` file:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8080
VERCEL_ENV=development
```

### **4. Run Development Server**

**Option A: Frontend Only (calls Vercel backend)**
```bash
npm run dev
# Visit: http://localhost:3000
```

**Option B: Full Stack (local backend)**
```bash
# Terminal 1: Backend
python3 -m uvicorn api.index:app --reload --port 8000

# Terminal 2: Frontend
npm run dev
# Visit: http://localhost:3000
```

---

## 🤖 AI Chatbot System

### **Features**

#### **1. Streaming Responses**
- Token-by-token display as AI generates response
- Visual typing indicator with animated cursor
- Smooth scroll to keep latest content visible

#### **2. Portfolio Intelligence**
The chatbot has deep knowledge of:
- **Personal Info**: Name, contact, location
- **Experience**: Current role at Customized Energy Solutions, previous positions
- **Skills**: Java, Python, Spring Boot, AWS, Angular, React, ML/AI
- **Projects**: Energy analytics, blogging platform, face recognition
- **Education**: MS Computer Science (Drexel), BE, Diploma
- **Achievements**: 40% efficiency gains, 100+ users, 95% accuracy

#### **3. Conversation Memory**
- Remembers last 10 messages per session
- 1-hour session timeout
- Context-aware responses

#### **4. Voice Input (Speech-to-Text)**
- Click microphone button or press `Space` to start
- Real-time transcription display
- Automatic send on completion
- Browser compatibility: Chrome, Edge, Safari

Each response provides elite technical transparency:
- 🤖 **Agent**: Antigravity Intelligence
- 🧠 **Engine**: gemini-2.0-flash-exp
- 📂 **Context**: Portfolio Knowledge Base
- ⏱️ **Latency**: Millisecond-precision heartbeat
- 🔢 **Tokens**: Full prompt/completion transparency

### **Chatbot Configuration**

Edit `src/js/core/config.js`:
```javascript
export const chat = {
    defaultGreeting: "👋 Hello! I'm AssistMe...",
    model: 'x-ai/grok-4.1-fast',
    streaming: true,
    temperature: 0.7,
    maxTokens: 2000
};
```

Edit `api/index.py` for system prompt:
```python
SYSTEM_PROMPT = f"""You are AssistMe, an advanced AI assistant for Mangesh Raut's portfolio...
{json.dumps(PORTFOLIO_DATA, indent=2)}
"""
```

---

## 🌐 Deployment

### **Google Cloud Run (Recommended for Challenge)**

This project is optimized for the **Google AI "New Year, New You" Portfolio Challenge**.

1. **Prerequisites**
   - Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
   - Login: `gcloud auth login`
   - Set project: `gcloud config set project [YOUR_PROJECT_ID]`

2. **Deploy using Script**
   ```bash
   chmod +x deploy-cloud-run.sh
   ./deploy-cloud-run.sh
   ```

3. **Set Environment Variables**
   Go to Google Cloud Console → Cloud Run → Your Service → Edit & Deploy New Revision:
   - `GOOGLE_API_KEY`: Your Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### **Vercel (Alternative)**

### **GitHub Pages (Secondary)**

GitHub Pages serves the frontend only. It calls the Vercel backend for AI functionality.

1. **Enable GitHub Pages**
   - Repository Settings → Pages
   - Source: `main` branch, `/` (root)

2. **Update CNAME** (if using custom domain)
   ```
   mangeshraut.pro
   ```

3. **Push Changes**
   ```bash
   git push origin main
   ```

### **Custom Domain Setup**

1. **Vercel**:
   - Dashboard → Project → Settings → Domains
   - Add `mangeshraut.pro`
   - Update DNS records as instructed

2. **GitHub Pages**:
   - Add `CNAME` file with domain
   - Configure DNS A records to GitHub IPs

---

## ⚙️ Configuration

### **Frontend Configuration**

**API Base URL** (`src/js/core/chat.js`):
```javascript
// Auto-detects environment:
// - localhost:8000 → local backend
// - All others → Vercel backend (https://mangeshrautarchive.vercel.app)
```

**Theme** (`src/js/utils/theme.js`):
```javascript
// Auto-detects system preference
// User can toggle via navbar button
```

### **Backend Configuration**

**CORS** (`api/index.py`):
```python
origins = [
    "https://mangeshraut712.github.io",
    "https://mangeshraut.pro",
    "https://mangeshrautarchive.vercel.app",
    "http://localhost:3000",
    # ... more
]
```

**Rate Limiting**:
```python
RATE_LIMIT_REQUESTS = 20  # requests per window
RATE_LIMIT_WINDOW = 60    # seconds
```

**Models**:
```python
MODELS = [
    {"id": "x-ai/grok-4.1-fast", "name": "Grok 4.1 Fast", "priority": 1},
    {"id": "x-ai/grok-2-1212", "name": "Grok 2 (Legacy)", "priority": 2},
    {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5", "priority": 3},
]
```

---

## 📁 Project Structure

```
mangeshrautarchive/
├── api/
│   └── index.py                 # FastAPI backend (Vercel serverless)
├── src/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── ai-assistant.css         # Desktop chatbot styles
│   │   │   ├── ai-assistant-mobile.css  # Mobile chatbot styles
│   │   │   ├── style.css                # Global styles
│   │   │   ├── homepage.css             # Landing page
│   │   │   ├── birthday-celebration.css # Easter egg
│   │   │   └── ...                      # Section-specific styles
│   │   ├── images/              # Optimized images
│   │   └── files/
│   │       └── Mangesh_Raut_Resume.pdf
│   ├── js/
│   │   ├── core/
│   │   │   ├── chat.js          # AI integration & API calls
│   │   │   ├── config.js        # Chatbot configuration
│   │   │   └── script.js        # Legacy chatbot UI (neutered)
│   │   ├── modules/
│   │   │   ├── chatbot.js       # Apple Intelligence chatbot UI
│   │   │   ├── scroll-animations.js
│   │   │   ├── calendar.js
│   │   │   ├── contact.js
│   │   │   ├── github-projects.js
│   │   │   ├── birthday-celebration.js
│   │   │   └── debug-runner.js  # Easter egg game
│   │   └── utils/
│   │       ├── theme.js         # Dark/light mode
│   │       ├── go-to-top.js     # Scroll to top button
│   │       └── smart-navbar.js  # Navbar behavior
│   └── index.html               # Main HTML file
├── .gitignore
├── package.json
├── requirements.txt             # Python dependencies
├── vercel.json                  # Vercel configuration
└── README.md                    # This file
```

---

## 📡 API Documentation

### **Base URL**
```
https://mangeshrautarchive.vercel.app
```

### **Endpoints**

#### **1. Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-06T10:00:00.000000Z",
  "service": "assistme-api",
  "version": "3.0.0",
  "config": {
    "api_key_configured": true,
    "models_available": 3,
    "default_model": "x-ai/grok-4.1-fast"
  }
}
```

#### **2. Test Endpoint**
```http
GET /api/test
```

**Response:**
```json
{
  "status": "ok",
  "message": "Backend is running!",
  "api_key_configured": true,
  "api_key_masked": "sk-or...9b9e",
  "default_model": "x-ai/grok-4.1-fast",
  "environment": "production"
}
```

#### **3. Chat (Streaming)**
```http
POST /api/chat
Content-Type: application/json

{
  "message": "What is Mangesh's current role?",
  "stream": true,
  "session_id": "optional-session-id"
}
```

**Response (Server-Sent Events):**
```json
{"type": "typing", "status": "start"}
{"type": "chunk", "content": "Mangesh", "chunk_id": 1}
{"type": "chunk", "content": " is currently", "chunk_id": 2}
...
{"type": "done", "full_content": "...", "metadata": {...}}
```

#### **4. Available Models**
```http
GET /api/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "x-ai/grok-4.1-fast",
      "name": "Grok 4.1 Fast",
      "priority": 1,
      "streaming": true
    }
  ],
  "default": "x-ai/grok-4.1-fast"
}
```

---

## 🐛 Troubleshooting

### **Chatbot Not Responding**

**Symptoms**: User message sent, no AI response

**Solutions**:
1. **Check Browser Console**:
   - Look for `🌐 Using Vercel backend: https://mangeshrautarchive.vercel.app`
   - Look for `🖥️ Calling API: .../api/chat`
   - Check for errors (CORS, 500, 404)

2. **Verify Backend**:
   - Visit: `https://mangeshrautarchive.vercel.app/api/test`
   - Should show `"api_key_configured": true`

3. **Check Vercel Logs**:
   - Vercel Dashboard → Deployments → Latest → Functions → `api/index.py`
   - Look for startup logs: `🚀 AssistMe API Starting...`

4. **Hard Refresh**:
   - `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)

### **"Unknown" Model Display**

**Symptoms**: Metadata shows "Unknown" instead of "grok-4.1-fast"

**Solutions**:
1. **Clear Cache**: Hard refresh the page
2. **Check Deployment**: Ensure latest code is deployed
3. **Verify Metadata**: Backend should send `{"type": "done", "metadata": {"model": "..."}}`

### **Space Key Not Working in Input**

**Symptoms**: Pressing space triggers debug game instead of typing space

**Solutions**:
1. **Check `debug-runner.js`**: Should have input element check
2. **Clear Cache**: `debug-runner.js?v=2025-fix-space` should be loaded
3. **Verify**: Console should NOT show debug game logs when typing in chat

### **Mobile Chatbot Overlaps**

**Symptoms**: "Go to Top" button or navbar overlaps chatbot

**Solutions**:
1. **Check CSS**: `ai-assistant-mobile.css` should have `inset: 12px`
2. **Verify Class**: `body.chatbot-open #go-to-top { display: none }`
3. **Hard Refresh**: Mobile browsers cache aggressively

### **Vercel 404 Errors**

**Symptoms**: All `/api/*` endpoints return 404

**Solutions**:
1. **Check `vercel.json`**: Should have `rewrites` section routing `/api/*` to `/api/index.py`
2. **NO `builds` section**: Vercel auto-detects Python, explicit builds cause conflicts
3. **Redeploy**: Trigger manual redeploy in Vercel dashboard

---

## 🔒 Security

### **API Key Protection**
- ✅ Stored in Vercel environment variables (server-side only)
- ✅ Never exposed in frontend code or responses
- ✅ Masked in test endpoint: `sk-or...9b9e`

### **CORS**
- ✅ Configured to allow only trusted domains
- ✅ Credentials enabled for session cookies
- ✅ Preflight requests handled

### **Rate Limiting**
- ✅ 20 requests per 60 seconds per IP
- ✅ Prevents abuse and excessive costs
- ✅ Returns 429 status when exceeded

---

## 📊 Performance Metrics

### **Lighthouse Scores** (Desktop)
- 🎯 Performance: 95+
- ♿ Accessibility: 100
- ✅ Best Practices: 100
- 🔍 SEO: 100

### **API Latency**
- ⚡ Health Check: < 100ms
- 🤖 Chat (First Token): 2-3 seconds (cold start), < 500ms (warm)
- 📊 Throughput: 100+ tokens/second

### **Bundle Size**
- 📦 HTML: ~50KB
- 🎨 CSS: ~120KB (uncompressed)
- ⚙️ JavaScript: ~180KB (modular, lazy-loaded)
- 🖼️ Images: Optimized WebP/PNG

---

## 🎯 Restore Point Information

**Commit Message**: `FINAL PREMIUM CHATBOT AND WEBSITE`

**What This Includes**:
- ✅ Fully functional AI chatbot with OpenRouter Grok 4.1 Fast
- ✅ Streaming responses with real-time display
- ✅ Universal backend (works on Vercel, GitHub Pages, localhost)
- ✅ Fixed all UI overlaps (navbar, toggle button, go-to-top)
- ✅ Proper metadata display (model, source, tokens, latency)
- ✅ Voice input (S2R) working
- ✅ Theme-aware design (dark/light mode)
- ✅ Mobile-optimized full-screen chatbot
- ✅ Portfolio data loaded in system prompt
- ✅ CORS configured for all deployment domains
- ✅ Cache-busted all critical files
- ✅ Security: API key never exposed

**To Restore**:
```bash
git checkout <commit-hash-of-this-message>
# Or search: git log --grep="FINAL PREMIUM CHATBOT"
```

---

## 📝 License

MIT License - Free to use for personal portfolios

---

## 👤 Author

**Mangesh Raut**  
Software Engineer | Full-Stack Developer | AI/ML Engineer

- 🌐 Website: [mangeshraut.pro](https://mangeshraut.pro)
- 💼 LinkedIn: [mangeshraut71298](https://linkedin.com/in/mangeshraut71298)
- 🐙 GitHub: [@mangeshraut712](https://github.com/mangeshraut712)
- 📧 Email: mbr63@drexel.edu
- 📱 Phone: +1 (609) 505 3500

---

## 🙏 Acknowledgments

- **OpenRouter** - AI API infrastructure
- **xAI** - Grok 4.1 Fast model
- **Vercel** - Serverless hosting
- **GitHub** - Version control and Pages hosting
- **Font Awesome** - Icon library
- **Google Fonts** - Inter typography

---

**Last Updated**: January 16, 2026  
**Version**: 6.0.0 - Antigravity Technical Partner Upgrade  
**Status**: ✅ Production Ready | 🚀 Competition Submission | 🤖 Gemini-Native

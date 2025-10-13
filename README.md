# 🎯 Mangesh Raut - AI-Powered Portfolio

**Modern Portfolio Website with Intelligent Chatbot Assistant**

[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![Backend](https://img.shields.io/badge/API-Vercel-black)](https://mangeshrautarchive.vercel.app/)
[![AI](https://img.shields.io/badge/AI-Gemini%202.0-blue)](https://openrouter.ai/)

---

## ✨ Features

- 🤖 **AI Chatbot** - Google Gemini 2.0 Flash via OpenRouter
- 🎙️ **Voice Assistant** - S2R-inspired natural conversation
- 🎨 **Apple-Inspired Design** - Clean, modern, professional
- ⚡ **Performance Optimized** - 120Hz smooth animations
- 📱 **Fully Responsive** - Works on all devices
- 🌓 **Dark Mode** - Automatic theme switching
- 📊 **Real-time Status** - Live AI availability indicator

---

## 🚀 Quick Start

### For Visitors

**Visit Live Site**: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)

**Try the Chatbot**:
1. Click the blue 💬 icon (bottom right)
2. Ask about Mangesh's experience, skills, or projects
3. Or ask general questions - AI will respond!

### For Developers

```bash
# Clone repository
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:3000
```

---

## 📁 Project Structure

```
portfolio/
├── api/                    # Backend (Vercel Serverless)
│   ├── chat.js            # Main chat endpoint
│   ├── chat-service.js    # AI service logic
│   └── status.js          # Health check
│
├── src/                   # Frontend (GitHub Pages)
│   ├── assets/
│   │   ├── css/          # Stylesheets
│   │   ├── images/       # Images & icons
│   │   └── files/        # Resume & papers
│   ├── js/
│   │   ├── core/         # Core (chat, config, script)
│   │   ├── modules/      # Features (animations, contact, etc.)
│   │   └── utils/        # Utilities (navbar, theme, voice)
│   └── index.html
│
├── docs/                  # Documentation
│   ├── setup/            # Setup guides
│   ├── deployment/       # Deploy guides
│   └── guides/           # Historical docs
│
├── scripts/              # Build tools
└── .github/workflows/    # CI/CD

Total: ~100 files, clean & organized
```

**See [STRUCTURE.md](STRUCTURE.md) for complete layout**

---

## 🤖 AI Chatbot

### Technology Stack

- **Provider**: OpenRouter
- **Model**: Google Gemini 2.0 Flash (`google/gemini-2.0-flash-001`)
- **Features**:
  - Portfolio Q&A with LinkedIn integration
  - General knowledge questions
  - Code examples and explanations
  - Math calculations
  - Auto-categorization

### Response Format

```json
{
  "answer": "AI-generated response...",
  "source": "OpenRouter",
  "model": "Gemini 2.0 Flash",
  "category": "Portfolio|Mathematics|General Knowledge",
  "confidence": 0.90,
  "runtime": "450ms"
}
```

---

## 🎙️ Voice Mode

- Natural voice interaction
- Continuous conversation flow
- Auto-silence detection  
- Visual feedback
- S2R semantic understanding

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run security-check # Check for exposed secrets
```

### Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## 📦 Deployment

### Frontend (GitHub Pages)

Automatically deploys on push to `main` branch via GitHub Actions.

```bash
git push origin main
# Deployed in ~2 minutes
```

### Backend (Vercel)

Auto-deploys when GitHub repo updates.

**Manual Redeploy**:
1. Vercel Dashboard → Project
2. Deployments → "..." → Redeploy
3. Uncheck "Use existing Build Cache"
4. Wait 2-3 minutes

---

## 🎨 Customization

### Update Profile

Edit `src/index.html`:
- Personal information
- Work experience
- Education
- Projects & skills

### Modify Styles

Edit `src/assets/css/style.css`:
- Colors & themes
- Fonts & typography
- Layout & spacing

### Configure Chatbot

Edit `api/chat-service.js`:
- AI model settings
- System prompts
- LinkedIn profile data

---

## 🧪 Testing

### Test Chatbot API

```bash
curl -X POST https://mangeshrautarchive.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is 5+5?"}'
```

**Expected Response**:
```json
{
  "answer": "10",
  "source": "OpenRouter",
  "model": "Gemini 2.0 Flash",
  "category": "Mathematics",
  "confidence": 0.90,
  "runtime": "450ms"
}
```

### Test Frontend

Visit: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)

- ✅ Homepage loads
- ✅ Navigation works
- ✅ Chatbot icon appears (bottom right)
- ✅ Click to open chatbot
- ✅ Send messages

---

## 📚 Documentation

Comprehensive documentation in `docs/`:

- **[Setup Guide](docs/setup/)** - Getting started
- **[Deployment](docs/deployment/)** - Deploy instructions
- **[Guides](docs/guides/)** - Troubleshooting & more
- **[Structure](STRUCTURE.md)** - Project organization

---

## 🤝 Contributing

Personal portfolio, but suggestions welcome!

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

---

## 📄 License

MIT License - Use this template for your own portfolio!

---

## 👤 Author

**Mangesh Raut**

- 🌐 Portfolio: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)
- 💼 LinkedIn: [linkedin.com/in/mangeshraut71298](https://linkedin.com/in/mangeshraut71298/)
- 📧 Email: mbr63@drexel.edu
- 📍 Location: Philadelphia, PA

**Software Engineer | AI/ML Specialist | Full-Stack Developer**

---

## 🙏 Acknowledgments

- OpenRouter - AI API Platform
- Google Gemini 2.0 Flash - AI Model
- Vercel - Backend Hosting
- GitHub Pages - Frontend Hosting

---

**Built with ❤️ using HTML, CSS, JavaScript, and AI**

**Last Updated**: October 2025  
**Version**: 2.0 (Refactored & Optimized)

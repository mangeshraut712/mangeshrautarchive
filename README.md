# 🎯 Mangesh Raut - Portfolio Website

**Modern, AI-Powered Portfolio with Voice Assistant**

[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![Vercel](https://img.shields.io/badge/Backend-Vercel-black)](https://mangeshrautarchive.vercel.app/)

---

## ✨ Features

- **AI Chatbot** - Powered by OpenRouter & Google Gemini 2.0 Flash
- **Voice Assistant** - Natural voice interaction with S2R technology
- **Smart Navbar** - Apple.com-inspired navigation
- **Performance Optimized** - 120Hz smooth animations
- **Responsive Design** - Mobile-first, works on all devices
- **Real-time API Status** - Live AI availability indicator

---

## 🚀 Quick Start

### For Users

Visit the live site: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)

### For Developers

```bash
# Clone the repository
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive

# Install dependencies
npm install

# Start local development server
npm start

# Open browser
# http://localhost:3000
```

---

## 📁 Project Structure

```
portfolio/
├── api/                    # Backend Serverless Functions
│   ├── chat.js            # Main chat endpoint
│   ├── chat-service.js    # AI service logic
│   └── status.js          # API status check
│
├── src/                   # Frontend Source
│   ├── assets/           
│   │   ├── css/          # Stylesheets
│   │   ├── images/       # Images & icons
│   │   └── files/        # PDFs & documents
│   │
│   ├── js/
│   │   ├── core/         # Core functionality
│   │   │   ├── chat.js   # Chatbot logic
│   │   │   ├── config.js # Configuration
│   │   │   └── script.js # Main script
│   │   │
│   │   ├── modules/      # Feature modules
│   │   │   ├── animations.js
│   │   │   ├── contact.js
│   │   │   ├── overlay.js
│   │   │   └── ...
│   │   │
│   │   └── utils/        # Utilities
│   │       ├── api-status.js
│   │       ├── smart-navbar.js
│   │       ├── theme.js
│   │       └── voice-manager.js
│   │
│   └── index.html        # Main HTML file
│
├── docs/                 # Documentation
│   ├── setup/           # Setup guides
│   ├── deployment/      # Deployment guides
│   └── guides/          # Various guides
│
├── scripts/             # Build & dev scripts
├── .github/workflows/   # GitHub Actions
├── package.json
├── vercel.json         # Vercel configuration
└── README.md
```

---

## 🤖 AI Chatbot

### Technology

- **Provider**: OpenRouter
- **Model**: Google Gemini 2.0 Flash (`google/gemini-2.0-flash-001`)
- **Features**:
  - Portfolio Q&A (LinkedIn integration)
  - General knowledge
  - Code examples
  - Math calculations
  - Auto-categorization

### Response Format

```json
{
  "answer": "AI-generated response...",
  "source": "OpenRouter",
  "model": "Gemini 2.0 Flash",
  "category": "Portfolio|Math|General Knowledge|...",
  "confidence": 0.90,
  "runtime": "450ms"
}
```

---

## 🎙️ Voice Mode

- Natural voice interaction
- Continuous conversation
- Auto-silence detection
- Visual feedback
- Works on mobile & desktop

---

## 🛠️ Development

### Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Environment Variables

For local development, set these in Vercel dashboard:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

## 📦 Deployment

### Frontend (GitHub Pages)

Automatically deployed on push to `main` branch.

```bash
git push origin main
```

### Backend (Vercel)

Connected to GitHub - auto-deploys on push.

**Manual Deploy:**
1. Go to Vercel Dashboard
2. Select project
3. Click "Redeploy"

---

## 🎨 Customization

### Update Profile

Edit `src/index.html`:
- Personal info
- Experience
- Projects
- Skills

### Update Styles

Edit `src/assets/css/style.css`:
- Colors
- Fonts
- Layout

### Update Chatbot

Edit `api/chat-service.js`:
- AI model
- System prompts
- LinkedIn data

---

## 🧪 Testing

```bash
# Test chatbot
curl -X POST https://mangeshrautarchive.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is 5+5?"}'

# Expected response
{
  "answer": "10",
  "source": "OpenRouter",
  "model": "Gemini 2.0 Flash",
  "category": "Mathematics",
  "confidence": 0.90,
  "runtime": "450ms"
}
```

---

## 📚 Documentation

Full documentation available in `docs/`:

- [Setup Guide](docs/setup/)
- [Deployment Guide](docs/deployment/)
- [API Documentation](docs/api/)
- [Troubleshooting](docs/guides/)

---

## 🤝 Contributing

This is a personal portfolio project, but suggestions are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - feel free to use this template for your own portfolio!

---

## 👤 Author

**Mangesh Raut**

- Portfolio: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)
- LinkedIn: [linkedin.com/in/mangeshraut71298](https://linkedin.com/in/mangeshraut71298/)
- Email: mbr63@drexel.edu

---

## 🙏 Acknowledgments

- OpenRouter for AI API
- Google Gemini 2.0 Flash
- Vercel for hosting
- GitHub Pages

---

**Built with ❤️ using HTML, CSS, JavaScript, and AI**

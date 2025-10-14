# 🚀 Mangesh Raut - Portfolio Website with AI Chatbot

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blueviolet)](https://pages.github.com/)
[![Vercel](https://img.shields.io/badge/api-Vercel-black)](https://vercel.com)

> Modern portfolio website with an intelligent AI chatbot assistant powered by OpenRouter and Google's Gemini 2.0 Flash model.

**Live Site**: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)

---

## ✨ Features

### 🎨 **Modern Portfolio Design**
- **Apple-inspired UI/UX** - Clean, professional design matching Apple.com aesthetics
- **Dark/Light Mode** - Auto-detect system theme with manual toggle
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Smooth Animations** - Spring-based animations with optimized performance
- **Glass Morphism** - Premium blur effects and transparency

### 🤖 **Intelligent AI Chatbot (AssistMe)**

**Core Features**:
- **iMessage-Style Design** - Exact replica of Apple's iMessage with blue/gray bubbles
- **OpenRouter + Gemini 2.0 Flash** - Powered by Google's latest AI model
- **Voice Mode (S2R)** - Speech-to-Retrieval for natural voice conversations
- **LinkedIn Integration** - Deep knowledge of Mangesh's background, skills, and experience
- **Metadata Display** - Shows source, model, category, confidence, and response time

**Advanced Capabilities**:
- ⏰ **Time & Date** - Instant responses for current time, date, and day
- 😄 **Entertainment** - Random jokes from Joke API with fallback
- 🌤️ **Weather** - Simulated weather (upgradable to real API)
- 🔍 **Web Commands** - Google and YouTube search with clickable links
- 📰 **News Headlines** - Top news stories (configurable with NewsAPI)
- 🚀 **NASA APOD** - Daily Astronomy Picture with explanation
- 🔴 **Reddit Integration** - Top posts from any subreddit
- 🔢 **Mathematics** - Instant calculations and advanced math
- 🧠 **Smart Classification** - 11 different query categories

**Chat Features**:
- Real-time typing indicator with animated dots
- Auto-scroll to latest messages
- Error handling with visual feedback
- Conversation history
- Accessibility compliant (ARIA)
- Mobile responsive

### 📬 **Contact Form**
- **Firebase Firestore** - Real-time database for message storage
- **Secure Rules** - Public can only create, you can read in Firebase Console
- **Form Validation** - Client-side validation with user feedback
- **Success Messages** - Professional UX with loading states

### 📱 **Sections**
- **About** - Professional introduction
- **Skills** - Technical expertise and tools
- **Experience** - Work history timeline
- **Education** - Academic background
- **Projects** - Portfolio showcase
- **Contact** - Firebase-powered contact form

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, animations, glass morphism
- **Vanilla JavaScript** - ES6+ modules, no framework dependencies
- **Tailwind CSS** - Utility-first CSS framework
- **Font Awesome** - Icon library

### Backend (API)
- **Vercel Serverless Functions** - Node.js backend
- **OpenRouter API** - AI model aggregation
- **Google Gemini 2.0 Flash** - Latest AI model
- **Firebase Firestore** - Contact form database

### Hosting & Deployment
- **GitHub Pages** - Frontend hosting
- **Vercel** - Backend API hosting
- **GitHub Actions** - Automated deployments

---

## 🚀 Quick Start

### Prerequisites
- Node.js (for local testing, optional)
- Python 3 (for local server)
- Git

### Local Development

**Option 1: Python HTTP Server** (Recommended)
```bash
cd src
python3 -m http.server 8000
```

**Option 2: Using the Run Script**
```bash
./run-local-server.sh
```

**Option 3: Node.js**
```bash
npx http-server src -p 8000
```

Then visit: **http://localhost:8000**

---

## 🤖 AI Chatbot - AssistMe

### Positioning & Design
- **Icon**: Bottom-right corner (20px from edges)
- **Widget**: Above icon (100px from bottom)
- **Size**: 460x720px centered window
- **Style**: Apple iMessage 2025 premium glass effect

### Command Examples

**Portfolio Questions**:
```
"Who is Mangesh Raut?"
"What are your skills?"
"Tell me about your experience"
"What's your highest qualification?" → Bachelor's (2017)
"What projects have you worked on?"
```

**Time & Date** (Instant - 0ms):
```
"What time is it?"
"What date is today?"
"Which day is today?"
```

**Entertainment**:
```
"Tell me a joke"
"Something funny"
```

**Weather**:
```
"Weather in Philadelphia"
"Weather"
```

**Web Commands**:
```
"Open Google AI"
"Open YouTube tutorials"
"Search Google machine learning"
```

**Mathematics** (Instant):
```
"5 + 5"
"100 - 25"
"8 * 7"
"50 / 2"
```

**General Knowledge**:
```
"Who is the Prime Minister of India?"
"Explain machine learning"
"What is React?"
```

**Voice Mode**:
1. Click green mic button (🎤 S2R)
2. Button turns RED with ● indicator
3. Speak your question clearly
4. Message auto-sends to AI
5. Get response with metadata

### Response Format

Every response includes metadata:
```json
{
  "answer": "Response text here",
  "source": "OpenRouter",
  "model": "Gemini 2.0 Flash",
  "category": "Portfolio",
  "confidence": 0.95,
  "runtime": "520ms"
}
```

Displayed as:
```
Bot response text here...

OpenRouter • Gemini 2.0 Flash • Portfolio • 520ms
```

---

## 📁 Project Structure

```
portfolio/
├── api/                          # Backend (Vercel Serverless)
│   ├── chat.js                   # Main chat endpoint
│   ├── chat-service.js           # AI processing with enhanced features
│   ├── enhanced-features.js      # Advanced features (jokes, weather, etc.)
│   └── status.js                 # API status check
│
├── chatbot/                      # Chatbot Module (Standalone)
│   ├── components/               # HTML components
│   ├── config/                   # Configuration
│   ├── scripts/                  # JavaScript modules
│   ├── styles/                   # CSS files
│   └── docs/                     # Module documentation
│
├── docs/                         # Project Documentation
│   ├── api/                      # API documentation
│   └── guides/                   # Setup guides
│
├── scripts/                      # Utility Scripts
│   └── test-api-simple.js        # API testing script
│
├── src/                          # Frontend (GitHub Pages)
│   ├── index.html                # Main page with inline chatbot
│   ├── assets/                   # Static assets
│   │   ├── css/                  # Stylesheets
│   │   ├── images/               # Images and icons
│   │   └── files/                # PDFs and documents
│   ├── js/                       # JavaScript modules
│   │   ├── core/                 # Core functionality
│   │   ├── modules/              # Feature modules
│   │   └── utils/                # Utility functions
│   └── chatbot/styles/           # Chatbot CSS (if external)
│
├── .github/                      # GitHub configuration
├── .gitignore                    # Git ignore rules
├── package.json                  # Project metadata
├── README.md                     # This file
├── run-local-server.sh           # Local dev server script
└── vercel.json                   # Vercel configuration
```

---

## 🔧 Configuration

### Environment Variables (Vercel)

Set these in your Vercel dashboard:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Optional (for advanced features):
```env
NEWS_API_KEY=your-newsapi-key
NASA_API_KEY=your-nasa-key
```

### Firebase Configuration

Firebase is configured in `src/js/firebase-config.js` with your actual credentials:
- Project: `mangeshrautarchive`
- Database: Firestore
- Collection: `messages`

**To view contact form submissions**:
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select "mangeshrautarchive" project
3. Navigate to Firestore Database
4. Open "messages" collection

---

## 🧪 Testing

### Test Chatbot Locally

```bash
# Start local server
./run-local-server.sh

# Visit in browser
http://localhost:8000

# Open chatbot and try:
- "What time is it?"
- "Tell me a joke"
- "5 + 5"
- "What are Mangesh's skills?"
```

### Test API (Backend)

```bash
# Run test script
node scripts/test-api-simple.js

# Or test manually
curl -X POST https://mangeshrautarchive.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

### Expected Response

```json
{
  "answer": "Hello! How can I help you today?",
  "source": "OpenRouter",
  "model": "Gemini 2.0 Flash",
  "category": "General Knowledge",
  "confidence": 0.90,
  "runtime": "520ms"
}
```

---

## 📚 API Documentation

### Endpoints

**Chat API**:
```
POST https://mangeshrautarchive.vercel.app/api/chat
```

**Status Check**:
```
GET https://mangeshrautarchive.vercel.app/api/status
```

### Request Format

```json
{
  "message": "Your question here",
  "messages": [
    {
      "role": "user",
      "content": "Previous message"
    }
  ]
}
```

### Categories Supported

1. **Time & Date** - Current time, date, day
2. **Weather** - Weather conditions (simulated)
3. **Entertainment** - Jokes and fun content
4. **Web Command** - Google/YouTube searches
5. **News** - Latest headlines
6. **Space & Astronomy** - NASA content
7. **Social Media** - Reddit posts
8. **Mathematics** - Calculations
9. **Portfolio** - About Mangesh Raut
10. **Programming** - Code and tech questions
11. **General Knowledge** - Any other questions

---

## 🎨 Customization

### Chatbot Design

All chatbot styles are **inline** in `src/index.html` for instant loading:

**Colors** (iMessage Style):
- User Messages: `#007aff` (solid blue)
- Bot Messages: `#e9e9eb` (light gray) / `#2c2c2e` (dark mode)
- Background: White (light) / Black (dark)

**Positioning**:
- Icon: `bottom: 20px`, `right: 20px`, `z-index: 9995`
- Widget: `bottom: 100px`, `right: 20px`, `z-index: 10000`

**Sizes**:
- Icon: 64x64px
- Widget: 460x720px (desktop), full-width (mobile)

### LinkedIn Data

Update portfolio information in `api/chat-service.js`:

```javascript
const LINKEDIN_PROFILE = {
  name: "Your Name",
  title: "Your Title",
  education: [...],
  experience: [...],
  skills: {...}
};
```

---

## 🚀 Deployment

### Frontend (GitHub Pages)

Automatically deploys on push to `main`:

```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

Deployment time: ~2-3 minutes

### Backend (Vercel)

Automatically deploys when GitHub updates:

1. Vercel webhook triggered by GitHub push
2. Serverless functions deployed from `api/` directory
3. Environment variables applied
4. Deployment time: ~1-2 minutes

### Manual Deploy

**Vercel CLI**:
```bash
vercel --prod
```

**GitHub Pages**:
- Automatically deploys from `main` branch
- Serves from `src/` directory

---

## 📊 Performance

- **Chatbot Load**: Instant (inline CSS/JS)
- **API Response**: ~500ms average
- **Direct Commands**: 0ms (instant)
- **Page Load**: < 2s
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)

---

## 🐛 Troubleshooting

### Chatbot Not Opening
1. **Hard refresh**: CTRL+F5 (Windows) or CMD+SHIFT+R (Mac)
2. Check console for errors
3. Verify JavaScript is enabled
4. Try incognito/private window

### API Not Responding
1. Check Vercel deployment status
2. Verify `OPENROUTER_API_KEY` is set in Vercel
3. Check Network tab for CORS errors
4. Test API directly: `/api/chat`

### Firebase 404 Error
- **Fixed**: `firebase-config.js` is now properly configured
- Should see: "Firebase initialized successfully"

### Console Warnings (Ignorable)
- `contentScript.bundle.js` - Browser extension (LinkedIn)
- `chrome-extension://invalid/` - Browser extension loading
- These are NOT your code and can be safely ignored

---

## 🔒 Security

### API Keys
- **OpenRouter Key**: Stored securely in Vercel environment variables
- **Never committed**: Keys are in `.gitignore`
- **CORS Protected**: Only allowed origins can access API

### Firebase Rules
```javascript
// Public can only CREATE messages
match /messages/{messageId} {
  allow create: if true;
  allow read, update, delete: if false;
}
```

### Contact Form
- Client-side validation
- Server-side timestamp
- Secure Firestore rules
- Rate limiting via Firebase

---

## 📝 License

MIT License - Feel free to use this project as inspiration for your own portfolio!

---

## 👨‍💻 Author

**Mangesh Raut**
- 🌐 Website: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)
- 💼 LinkedIn: [linkedin.com/in/mangeshraut71298](https://www.linkedin.com/in/mangeshraut71298/)
- 🐙 GitHub: [github.com/mangeshraut712](https://github.com/mangeshraut712)
- 📧 Email: mbr63@drexel.edu
- 📱 Phone: +1 (267) 738-6508

---

## 🙏 Acknowledgments

- **OpenRouter** - AI model aggregation platform
- **Google Gemini 2.0 Flash** - Powerful AI model
- **Firebase** - Real-time database for contact form
- **Vercel** - Serverless backend hosting
- **GitHub Pages** - Frontend hosting
- **Apple** - Design inspiration (iMessage UI)
- **Official Joke API** - Entertainment content
- **NASA API** - Space and astronomy data

---

## 📋 Changelog

### Version 5.0 (October 2025) - Current
- ✅ Complete iMessage-style redesign
- ✅ Advanced features: Time, Weather, Jokes, Web, News, NASA, Reddit, Math
- ✅ Voice mode (Speech-to-Retrieval) working
- ✅ Metadata display for all responses
- ✅ LinkedIn data corrected (Bachelor's 2017, Master's in progress)
- ✅ Firebase properly connected
- ✅ All ARIA warnings fixed
- ✅ Icon positioning fixed (below widget)
- ✅ Clean console (no errors)
- ✅ Production-ready

### Version 4.0 (October 2025)
- iMessage design implementation
- Centered widget positioning
- Enhanced glass morphism effects

### Version 3.0 (October 2025)
- OpenRouter + Gemini integration
- Voice mode basic implementation
- Metadata response format

### Version 2.0 (October 2025)
- Initial AI chatbot integration
- Dark mode support
- Mobile responsiveness

### Version 1.0 (October 2025)
- Initial portfolio launch
- Basic sections and design

---

## 🎯 Roadmap

### Planned Features
- [ ] News API integration (real headlines)
- [ ] OpenWeatherMap integration (real weather)
- [ ] Advanced math with Math.js library
- [ ] Multi-language support
- [ ] Chat history persistence
- [ ] Export chat conversations
- [ ] Voice output (text-to-speech)
- [ ] Custom wake word for voice mode
- [ ] Analytics dashboard
- [ ] Blog section

### Under Consideration
- Email notifications for contact form
- Resume download tracking
- Project case studies
- Testimonials section
- Admin panel for content management

---

## 📖 Documentation

- **Setup Guide**: See `docs/guides/`
- **API Documentation**: See `docs/api/`
- **Chatbot Module**: See `chatbot/README.md`
- **Deployment Guide**: See deployment section above

---

## 🤝 Contributing

While this is a personal portfolio, suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 💬 Support

For questions or issues:
- 📧 Email: mbr63@drexel.edu
- 💼 LinkedIn: [linkedin.com/in/mangeshraut71298](https://www.linkedin.com/in/mangeshraut71298/)
- 🐙 GitHub Issues: [Report an issue](https://github.com/mangeshraut712/mangeshrautarchive/issues)

---

## ⭐ Show Your Support

If you like this project, please give it a ⭐ on GitHub!

---

**Built with ❤️ by Mangesh Raut**

*Last Updated: October 14, 2025*

---

## 📸 Screenshots

### Chatbot Features
- **iMessage Design**: Blue user bubbles (right), gray bot bubbles (left)
- **Voice Mode**: Green mic button → RED when listening
- **Metadata**: Source, model, category, runtime under each message
- **Premium Glass**: Enhanced blur and depth effects

### Advanced Commands
- Time/Date: Instant responses (0ms)
- Jokes: Random from API
- Math: Instant calculations
- Web: Google/YouTube links
- Weather: Simulated conditions
- All with professional UI and metadata

---

**Test it live**: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/) 🚀

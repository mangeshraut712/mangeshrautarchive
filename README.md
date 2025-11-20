# 🚀 Mangesh Raut Portfolio - Modern 2025 Edition

A sleek, AI-powered portfolio website featuring dynamic GitHub integration, intelligent chatbot, and cutting-edge web technologies. Deployed on GitHub Pages with Vercel backend for seamless functionality.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![Vercel](https://img.shields.io/badge/Vercel-Backend-black)](https://vercel.com)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-blue)](https://openrouter.ai/)
[![GitHub API](https://img.shields.io/badge/GitHub-API-black)](https://docs.github.com/en/rest)

---

## ✨ Key Features

### 🤖 **AI-Powered Chatbot** ("AssistMe")
- **AI Engine**: OpenRouter API with Google Gemini 2.0 Flash
- **Capabilities**:
  - Portfolio Q&A (experience, skills, education)
  - Math calculations and technical queries
  - Time/date/timezone information
  - Entertainment (jokes, gaming)
  - Web search commands
- **Response Intelligence**: Includes source, model, category, confidence, and runtime metadata
- **Fallback Mode**: Graceful degradation when API unavailable

### 📊 **Dynamic GitHub Integration**
- **Live Projects Display**: Automatically fetches and displays GitHub repositories
- **Smart Filtering**: Search by name, filter by programming language
- **Statistics Dashboard**: Real-time repo counts, stars, forks
- **Performance**: Cached API calls (5-minute intervals) for optimal loading
- **Responsive Cards**: Beautiful project showcases with live demo links

### 📬 **Contact System**
- **Firebase Firestore**: Secure contact form with direct database integration
- **Real-time Validation**: Email format checking, required field enforcement
- **User Experience**: AJAX-style submission with instant feedback
- **Security**: Firestore rules restrict to create-only operations

### 🎨 **Modern 2025 Design**
- **Responsive First**: Mobile-optimized layout with CSS Grid/Flexbox
- **Dark Mode**: System-aware theme switching with smooth transitions
- **Performance**: Optimized animations, lazy loading, efficient caching
- **Progressive Enhancement**: Works across all modern browsers

---

## 🛠️ Technology Stack

### Frontend
- **HTML5/ES6 Modules**: Modular, semantic code structure
- **CSS3**: Custom properties, Flexbox, Grid, animations
- **JavaScript ES2024**: Async/await, destructuring, modern APIs
- **Performance**: Lightweight, zero-bundle approach

### Backend & APIs
- **Express.js**: Local development server (port 3000)
- **Vercel Serverless**: Production backend functions
- **Firebase Firestore**: Contact message storage
- **OpenRouter API**: AI model orchestration
- **GitHub REST API**: Dynamic repository data

### Deployment & Hosting
- **GitHub Pages**: Static asset hosting with automated builds
- **GitHub Actions**: CI/CD pipeline with build verification
- **Vercel**: Serverless deployment for API endpoints

### Development Tools
- **Node.js 20+**: Server runtime and build tools
- **npm**: Package management
- **Git**: Version control
- **ESLint**: Code quality (integrated)

---

## 📁 Project Structure

```
mangeshrautarchive/
├── src/
│   ├── index.html               # Main application entry point
│   ├── assets/
│   │   ├── css/
│   │   │   ├── fixes-2025.css   # Core styling and responsive design
│   │   │   ├── chatbot-complete.css  # Chatbot UI components
│   │   │   └── dark-mode-cards.css   # Theme-aware component styles
│   │   ├── images/              # Profile photos, icons
│   │   └── files/               # Resume PDF, research papers
│   └── js/
│       ├── core/
│       │   ├── script.js        # Main application initialization
│       │   └── chat.js          # Chatbot core logic (client-side)
│       ├── modules/
│       │   ├── enhanced-chatbot.js    # Advanced chatbot features
│       │   ├── github-projects.js     # GitHub API integration
│       │   ├── contact.js             # Contact form logic
│       │   ├── blog-loader.js         # Blog content management
│       │   ├── blog-data.js           # Blog post data
│       │   ├── debug-runner.js        # Development debugging tools
│       │   └── skills-visualization.js # Skills display components
│       └── utils/
│           ├── go-to-top.js           # Scroll-to-top functionality
│           ├── smart-navbar.js        # Intelligent navigation
│           └── theme.js               # Theme management system
├── api/
│   ├── chat.js                  # Chatbot API endpoint (Vercel-only)
│   └── chat-service.js          # OpenRouter integration service
├── scripts/
│   ├── build.js                 # Production build pipeline
│   ├── local-server.js          # Express development server
│   ├── fix-chatbot.sh           # Chatbot configuration utility
│   ├── test-api.sh              # API integration testing
│   ├── diagnose-firebase.js     # Firebase setup verification
│   ├── check-firebase-config.sh # Firebase configuration helper
│   └── security-check.js        # Security audit tools
├── .github/workflows/           # GitHub Actions CI/CD
├── vercel.json                  # Vercel deployment configuration
├── package.json                 # Project dependencies and scripts
└── README.md                    # This documentation
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.9.0 or higher
- **npm** 10.1.0 or higher
- **Git** for version control

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/mangeshraut712/mangeshrautarchive.git
   cd mangeshrautarchive
   npm install
   ```

2. **Local Development**
   ```bash
   npm run dev
   ```
   Access at: http://localhost:3000

3. **Build Static Assets**
   ```bash
   npm run build
   ```

---

## 🔧 Configuration

### Environment Variables (Vercel)
Required for production chatbot functionality:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Set these in your Vercel dashboard under project settings.

### Firebase Configuration
Contact form requires Firebase Firestore setup:

1. Create Firebase project
2. Enable Firestore database
3. Publish security rules (allow create on `/messages`)
4. Update API key in `src/js/modules/contact.js`

### API Keys
- **OpenRouter**: Free API key from [openrouter.ai](https://openrouter.ai)
- **Firebase**: Project-specific keys (safe to include in frontend)
- **GitHub API**: Public access (no key required)

---

## 📋 Development Scripts

```bash
npm run dev          # Start local development server
npm run build        # Build for production GitHub Pages
npm install          # Install all dependencies
```

---

## 🎨 Features Overview

### AI Chatbot System
- **Intelligent Fallbacks**: Continues working even if API is unavailable
- **Context Awareness**: Understands portfolio content and navigation context
- **Performance Optimized**: Minimal client-side bundle, server-side processing
- **Responsive Design**: Adapts to mobile and desktop interfaces

### GitHub Integration
- **No Manual Updates**: Automatically stays current with repository changes
- **Search & Discovery**: Find projects by technology stack or keywords
- **Visual Analytics**: Language distribution charts and contribution graphs
- **Zero-Maintenance**: Handles rate limiting and error conditions gracefully

### Contact Form
- **Secure by Design**: Write-only Firestore access prevents data breaches
- **Validation**: Real-time input validation with user-friendly error messages
- **Confirmation**: Immediate feedback on message submission status
- **Privacy**: No read access, data remains secure in Firebase

### Performance & Reliability
- **Progressive Loading**: Components load as needed
- **Cache Management**: Intelligent caching of API responses
- **Error Boundaries**: Graceful failure handling
- **Lighthouse Optimized**: 95+ scores across all metrics

---

## 🔍 Troubleshooting

### Build Failures
```bash
# Check Node.js version
node --version  # Should be 20.9+

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API Issues
```bash
# Test OpenRouter connection
node scripts/test-api.sh

# Diagnose Firebase setup
node scripts/diagnose-firebase.js
```

### GitHub Integration Problems
- Check repository visibility (must be public)
- Verify API rate limits (60 requests/hour unauthenticated)
- Clear browser cache for updated GitHub data

---

## 📦 Deployment

### GitHub Pages (Frontend)
- Automated via GitHub Actions
- Static assets only (no server-side rendering)
- Fast global CDN distribution

### Vercel (API Backend)
- Serverless functions for chatbot API
- Automatic scaling and edge deployment
- Environment variable management

---

## 🛡️ Security Features

- **CSP Headers**: Content Security Policy implementation
- **API Rate Limiting**: Protected against abuse
- **Input Sanitization**: XSS prevention on user inputs
- **Firestore Rules**: Restrictive database access patterns
- **Environment Variables**: Secure API key management

---

## 🎯 Performance Metrics

- **Load Time**: < 2 seconds first contentful paint
- **Interaction**: < 3 seconds time to interactive
- **Chatbot Response**: 400-800ms average latency
- **Bundle Size**: Minimal JavaScript payload
- **Lighthouse Score**: 95+ performance rating

---

## 🔮 Future Enhancements

- [ ] Blog section with markdown content
- [ ] Interactive skills visualization dashboard
- [ ] Email notifications for contact form
- [ ] Multiple AI model options (GPT-4, Claude)
- [ ] Chat history persistence
- [ ] Advanced analytics and tracking
- [ ] Resume builder integration
- [ ] Multi-language support

---

## 📄 License

Licensed under MIT License. See LICENSE file for details.

---

## 👨‍💻 Author

**Mangesh Raut**
- Portfolio: [mangeshraut712.github.io/mangeshrautarchive](https://mangeshraut712.github.io/mangeshrautarchive/)
- GitHub: [@mangeshraut712](https://github.com/mangeshraut712)
- LinkedIn: [mangeshraut71298](https://linkedin.com/in/mangeshraut71298)
- Email: mbr63@drexel.edu

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 🙏 Acknowledgments

- **Google Gemini** for AI capabilities
- **OpenRouter** for API aggregation
- **Firebase** for backend services
- **Vercel** for serverless deployment
- **GitHub** for hosting and APIs

---

**Built with ❤️ using modern web technologies**

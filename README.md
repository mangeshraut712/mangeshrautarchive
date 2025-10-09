# Mangesh Raut Portfolio Website 🌟

[![Live Demo](https://img.shields.io/badge/Live%20Demo-007AFF?style=for-the-badge&logo=safari)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/mangeshraut712/mangeshrautarchive)

An elegant, Apple-inspired portfolio website showcasing my professional journey as a Software Engineer. Features a modern design system, interactive AI chatbot, and comprehensive project showcase.

## ✨ Key Features

### 🎨 **Apple.com Design Language**
- Complete visual redesign matching Apple's aesthetic standards
- Precise color palette (#ffffff, #f5f5f7, #1d1d1f, #6e6e73, #0071e3)
- SF Pro typography system with Inter fallback
- Apple's signature spacing and grid systems
- Backdrop blur effects and modern glass aesthetics

### 🌟 **Premium User Experience**
- Fully responsive design for all devices (desktop, tablet, mobile)
- Smooth navigation with backdrop blur effects and hover animations
- Alternating section backgrounds (white/grey pattern)
- Theme toggle with seamless light/dark mode transitions
- Apple's precise interactive animations and transitions

### 🤖 **Advanced AI Chatbot (AssistMe v2.0)**
- **🌐 AI-Powered Intelligence**: Grok xAI (latest model) + Claude fallback
- **🧠 Multiple Knowledge Sources**:
  - Personal portfolio knowledge base (skills, experience, projects)
  - Wikipedia API for factual information
  - DuckDuckGo API for general queries
  - StackOverflow API for coding questions
  - Country/location data via RestCountries API
- **🧮 Advanced Math Engine**: Unit conversions, calculations, equations
- **🎤 Voice Controls**: Text-to-speech and speech-to-text integration
- **🔄 Multi-API Fallback System**: Automatic switching between AI providers
- **📱 Responsive Chat Widget**: Apple Intelligence-inspired design with glassmorphism
- **⚡ Real-time Processing**: Server-side API calls via Express backend

### 🔧 **MCP Server Integration**
- **GitHub MCP Server**: Docker container running port 3002
- **Perplexity MCP Server**: Advanced search capabilities
- **Interactive API**: Direct GitHub repository queries and operations
- **Seamless Integration**: CLI tools accessible via chatbot

### 📱 **Responsive & Accessible Design**
- Mobile-first breakpoint system (834px, 1024px, 1120px, 1440px)
- Touch-friendly buttons and proper touch targets
- Optimized performance with backdrop-filter support
- Accessibility-compliant design with proper focus states
- Voice control compatibility

### 🛠️ **Technical Features**
- **Node.js Backend**: Express server with `/api/chat` endpoint
- **Real-time API Calls**: Axios-powered external service integration
- **Firebase Visitor Counter**: Atomic increments and real-time tracking
- **Firebase-Powered Contact Form**: Real-time messaging system
- **Dynamic GitHub Integration**: Auto-updating project showcase
- **Client-Server Architecture**: CORS-safe API communication
- **Rate Limiting**: API protection and efficient resource management

## 🚀 Technologies Used

### Frontend Architecture
- **HTML5**: Semantic markup with Apple's design system structure
- **CSS3**: Custom Apple-inspired design system with CSS variables
- **JavaScript (ES6+)**: Modern async/await patterns and Intersection Observer API
- **Font Awesome 6**: Extensive icon library for UI elements

### APIs & Integrations
- **Firebase Firestore**: Contact form messaging system
- **GitHub REST API**: Auto-updating project portfolio
- **Wikipedia API**: General knowledge queries for chatbot
- **DuckDuckGo API**: Additional information retrieval
- **Web Speech API**: Voice recognition and synthesis

### Build & Development
- **CSS Grid & Flexbox**: Apple's 12-column responsive system
- **Mobile-First Responsive Design**: Touch-first approach
- **Progressive Enhancement**: Graceful degradation
- **Performance Optimized**: Minimal dependencies, optimized assets

## 📁 Project Structure

```
mangeshrautarchive/
├── index.html                 # Main HTML document with Apple Intelligence chatbot
├── server.js                  # Node.js Express backend for API integrations
├── pacakge.json              # Node.js dependencies and scripts
├── .gitignore                 # Git ignore rules for security
├── api/
│   └── chat.js                # Chatbot API endpoint handler
├── css/
│   └── style.css             # Complete Apple-inspired design system
├── js/
│   ├── services.js           # Advanced AI chatbot with multi-API integration
│   ├── config.local.js       # API keys and local configuration (gitignored)
│   ├── firebase-config.js    # Firebase client-side configuration
│   ├── math.js               # Advanced math utilities and unit conversions
│   ├── script.js             # Frontend interactive features
│   ├── theme.js              # Light/dark mode management
│   └── modules/              # Modular component architecture
│       ├── animations.js     # Page scroll and interaction animations
│       ├── contact.js        # Contact form handling
│       ├── external-config.js# External API configurations
│       ├── math.js           # Mathematical calculations
│       ├── overlay.js        # Navigation overlay system
│       ├── projects.js       # GitHub projects integration
│       └── voice.js          # Voice recognition and synthesis
├── perplexity-mcp.json       # Perplexity MCP server configuration
├── images/                   # Image assets
│   ├── profile.jpg           # Hero image
│   ├── profile icon.png     # Navigation logo
│   ├── graduation.jpg        # About section image
│   └── X_logo.jpg            # Social media logos
└── files/                    # Downloadable assets
    ├── Mangesh_Raut_Resume.pdf # Professional resume
    └── RTFERS paper.pdf      # Research publication
```

## 🎯 Features Detailed

### 🎨 Design System
- **Typography**: Complete SF Pro scaling with Inter fallback
- **Color Palette**: Around exact Apple RGB values
- **Grid System**: Apple's 12-column responsive framework
- **Spacing**: em-based scalable spacing system
- **Interactive States**: Apple's hover, focus, and press states

### 🤖 AI Chatbot Features
- **Voice Controls**: Microphone and speaker with recording states
- **Knowledge Base**: Complete responses about portfolio, skills, experience
- **General Knowledge**: Powered by Wikipedia and DuckDuckGo APIs
- **Math Calculations**: Built-in calculator using math.js
- **Project Database**: 9 complete GitHub projects with descriptions
- **Responsive Interface**: Clean chat bubbles and typing indicators

### 📄 Projects Section
- **Auto-Updating**: GitHub API integration showing 9 live projects
- **Newsroom Layout**: Apple News-style compact grid design
- **Technology Tags**: Badge-style technology indicators
- **Direct Links**: One-click access to GitHub repositories
- **Featured Projects**: Apple's FastVLM, Starlight Blogging, Lead Prediction, etc.

### 🌙 Dark Mode Excellence
- **Apple Dark**: Authentic dark theme with #000000 base
- **Smart Transitions**: Seamless color palette switching
- **Contrast Optimized**: WCAG-compliant contrast ratios
- **Glass Morphism**: Backdrop blur effects in both modes

## 🚀 Quick Start

### Clone Repository
```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
```

### Open Locally
```bash
# No server required - fully client-side
open index.html
```

### Deploy to GitHub Pages
1. Push to your GitHub repository
2. Go to Settings > Pages
3. Select main branch as source
4. Your site will be live at: `https://[username].github.io/mangeshrautarchive`

## ⚙️ Configuration

### Firebase Setup

#### Contact Form & Visitor Counter

Update Firebase configuration in `index.html`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-XXXXXXXXXX"
};
```

#### Firestore Security Rules

The visitor counter requires specific Firestore rules. Update your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Visitor counter rules
    match /visitorCounts/mainCounter {
      allow read: if true;
      allow write: if request.resource.data.count == resource.data.count + 1 ||
                      (request.resource.data.count == 1 && !exists(path));
    }

    match /messages/{messageId} {
      allow create: if true;
      allow read: if false;
      allow update: if false;
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### API Keys Configuration (Chatbot + MCP Servers)

#### 🚀 **Automated Setup with GitHub Secrets**
Add repository secrets in GitHub Settings → Secrets and variables → Actions:

1. **GROK_API_KEY** → Your xAI Grok API key
2. **ANTHROPIC_API_KEY** → Your Claude API key
3. **PERPLEXITY_API_KEY** → Your Perplexity API key
4. **GITHUB_ACCESS_TOKEN** → Your GitHub Personal Access Token (for MCP server)

#### 📦 **Local Development**
1. Copy from `API_KEYS.txt` file (keep local, don't commit)
2. Update `js/config.local.js` and `perplexity-mcp.json`
3. The GitHub Actions workflow will automatically inject these for production

#### ⚡ **Automatic Build Process**
- Development uses `js/config.local.js`
- Production uses GitHub secrets injected during build
- MCP servers configured automatically with proper keys

## 🎨 Customization Guide

### Update Personal Information
- **Profile Picture**: Replace `images/profile.jpg`
- **Hero Data**: Edit name, title, description in `index.html`
- **Skills**: Modify `.col-lg-4` sections in skills
- **Experience**: Update timeline items in experience section
- **Projects**: Auto-populated from GitHub API (manual override optional)

### Styling Changes
- **Colors**: Modify CSS variables in `:root`
- **Typography**: Adjust font scales in CSS
- **Spacing**: Update section padding values
- **Layout**: Modify grid breakpoints and sizing

### Content Updates
- **Resume**: Replace `files/Mangesh_Raut_Resume.pdf`
- **Contact Links**: Update social media URLs
- **Chatbot Responses**: Edit command handlers in `js/script.js`

## 📊 Recent Updates

### v2.0.0 - Complete Apple Redesign ✅
- ✨ Full Apple.com design language implementation
- 🎯 Alternating section backgrounds (White/Grey pattern)
- 🚀 Newsroom-style projects grid with 9 GitHub projects
- 🤖 Enhanced chatbot with proper positioning and voice controls
- 🌙 Complete dark mode system with Apple's palette
- 📱 Responsive design refinements
- ⚡ Performance optimizations

### v1.5.0 - AI Chatbot Integration ✅
- 🤖 Advanced AssistMe AI chatbot with voice controls
- 📱 Improved mobile responsiveness
- 🎨 UI enhancements and animations

### v1.0.0 - Initial Portfolio ✅
- 🎨 Clean, responsive portfolio design
- 📄 Professional project showcase
- 📱 Mobile-first responsive design
- 🛠️ Interactive features and animations

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Connect

<div align="center">

**Mangesh Raut**  
Software Engineer | Philadelphia, PA

[![Portfolio](https://img.shields.io/badge/Portfolio-007AFF?style=flat-square&logo=web&logoColor=white)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mangeshraut71298/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/mangeshraut712)
[![Email](https://img.shields.io/badge/Email-mbr63drexel@gmail.com-red?style=flat-square&logo=gmail&logoColor=white)](mailto:mbr63drexel@gmail.com)

</div>

---

<div align="center">

**Built with ❤️ using Apple's design philosophy and modern web standards**

⭐ Star this repository if you found it helpful!

</div>

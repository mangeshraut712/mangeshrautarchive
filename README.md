# 🚀 Mangesh Raut Portfolio - Premium 2025 Edition

A cutting-edge, AI-powered portfolio website featuring **iMessage-style liquid glass design**, intelligent chatbot with streaming responses, dynamic GitHub integration, and premium dark/light themes. Built with a hybrid architecture combining static hosting performance with serverless Python API power.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://mangeshraut.pro)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?style=for-the-badge&logo=github)](https://mangeshraut712.github.io/mangeshrautarchive/)
[![Vercel Backend](https://img.shields.io/badge/Backend-FastAPI-000000?style=for-the-badge&logo=fastapi)](https://mangeshrautarchive.vercel.app/api/health)
[![AI Powered](https://img.shields.io/badge/AI-Grok_4.1_Fast-blueviolet?style=for-the-badge&logo=openai)](https://openrouter.ai/)

---

## 🚀 NEW: 2025 Enhancements

![2025 Enhancements](/.gemini/antigravity/brain/8945a30b-d332-46e2-966c-7ab0bef12d18/enhancements_2025_showcase_1764507436075.png)

This portfolio now features **three cutting-edge enhancements** that transform it into an intelligent, immersive, and accessible experience:

### 🤖 **Agentic AI Integration**
The chatbot can now **perform actions**, not just answer questions!
- "Download your resume" → Triggers download automatically
- "Schedule a meeting" → Opens calendar interface
- "Go to projects" → Navigates to section with smooth scroll
- "Copy your email" → Copies contact info to clipboard
- **10+ action commands** with natural language detection

### 🎨 **3D Interactive Background**
Immersive particle system that responds to mouse movement
- 100+ animated particles with dynamic connections
- Mouse-reactive movement with repulsion field
- Theme-aware colors (adapts to dark/light mode)
- Smooth 60 FPS performance with auto-pause
- Desktop-only (auto-disables on mobile)

### ♿ **Full Accessibility (WCAG 2.2)**
Complete keyboard navigation and screen reader support
- **Keyboard Shortcuts**: `Ctrl+K` search, `Ctrl+D` theme, `Esc` close
- **Screen Reader**: ARIA live regions and labels
- **Focus Management**: Skip links, focus trap, visible indicators
- **User Preferences**: Reduced motion, high contrast support
- **WCAG 2.2 Level AA** compliant

📚 **[Read Full Documentation](ENHANCEMENTS_2025.md)** | 🎯 **[Quick Start Guide](QUICKSTART_2025.md)** | 🎬 **[View Demo](src/enhancements-demo.html)**

---

## ✨ Key Features

### 🤖 **Premium iMessage-Style AI Chatbot**

#### **Visual Design**
- **Liquid Glass Effect**: Frosted glass container with blur and saturation filters
- **iMessage Bubbles**: Perfect rounded corners with signature "tails"
  - User messages: Blue gradient (#007aff → #0051d5)
  - Bot messages: Gray gradient (light) / Dark gray (dark mode)
- **Solid Color Buttons**:
  - 🔴 **Close**: Solid red (#ff3b30) - highly visible
  - 🔵 **Send**: Solid blue (#007aff) - clear action
  - 🟢 **Voice**: Solid green (#34c759) - distinct function
- **S2R Badge**: White background with green text for voice feature visibility

#### **AI Capabilities**
- **AI Provider**: **OpenRouter** - Unified API for multiple AI models
- **Current Model**: **x-ai/grok-4.1-fast** (Free tier)
- **Real-Time Streaming**: Smooth, typewriter-style response streaming
- **Portfolio Expert**: Deep knowledge of Mangesh's skills, projects, and experience
- **Math & Logic**: Solves complex calculations and technical queries
- **Context-Aware**: Remembers conversation history for coherent responses

#### **Rich Content Support**
- **Markdown Rendering**: Full support for bold, italic, lists, tables, and links
- **Code Highlighting**: Syntax highlighting for 100+ languages with **Prism.js**
- **Message Actions**:
  - 📋 **Copy**: One-click copy for messages and code blocks
  - 🔊 **Speak/Stop**: Text-to-Speech with voice control
  - ❤️ **React**: Emoji reactions for responses
- **Smart Suggestions**: Context-aware prompt chips to guide conversation
- **Response Metadata**: Displays model used, source, confidence, and processing time

#### **Performance & UX**
- **Zero Input Lag**: Optimized with requestAnimationFrame
- **Smooth Scrolling**: Buttery 60fps scrolling experience
- **Perfect Text Rendering**: Proper spacing and line breaks
- **Theme-Aware**: Seamless light/dark mode integration
- **Mobile Optimized**: Touch-friendly, responsive design

---

### 🎨 **Premium UI/UX Design**

#### **Theme System**
- **Dark Mode**: 
  - Solid black (#000000) backgrounds throughout
  - OLED-optimized for maximum contrast and battery efficiency
  - No blue glowing effects or gradients
  - Consistent across all sections, header, and footer
- **Light Mode**: 
  - Pure white (#ffffff) backgrounds
  - Clean, bright appearance
  - Perfect contrast for readability
- **Frosted Glass Navigation**: Semi-transparent header with blur effect
- **Smooth Transitions**: Theme switching with elegant animations

#### **Modern Design Elements**
- **Glassmorphism**: Subtle transparency and blur effects
- **Micro-interactions**: Hover effects, button animations, smooth transitions
- **Responsive Layouts**: Mobile-first design using CSS Grid and Flexbox
- **Hardware-Accelerated**: GPU-optimized animations for 60fps performance
- **Apple-Inspired**: Clean, minimal aesthetic following modern design trends

---

### 📊 **Dynamic GitHub Integration**
- **Live Projects**: Automatically fetches and displays latest repositories
- **Smart Filtering**: Filter by language (Python, Java, JavaScript) or search by name
- **Real-time Stats**: Live star counts, forks, and repository descriptions
- **Performance Caching**: Client-side LRU cache to minimize API rate limits
- **Lazy Loading**: Efficient rendering for large project lists

---

### 📬 **Secure Contact System**
- **Firebase Integration**: Direct-to-database message submission
- **Real-time Validation**: Instant feedback on form fields
- **Security Rules**: Write-only access ensures user data privacy
- **Spam Protection**: Rate limiting and validation

---

## 🛠️ Technology Stack

### Frontend (Static)
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: 
  - Custom properties (CSS variables)
  - Flexbox & Grid layouts
  - Advanced animations with `@keyframes`
  - Modular architecture (18 CSS files)
- **JavaScript (ES2024)**: 
  - Modern syntax with ES Modules
  - Async/Await for API calls
  - Web Speech API for voice features
  - requestAnimationFrame for smooth animations
- **Libraries**:
  - **Prism.js**: Code syntax highlighting
  - **Marked.js**: Markdown parsing
  - **DOMPurify**: HTML sanitization
  - **Font Awesome**: Icon library
- **Hosting**: GitHub Pages with global CDN

### Backend (Serverless)
- **Python FastAPI**: High-performance async web framework
- **Vercel**: Serverless function deployment with edge routing
- **OpenRouter API**: Unified interface for multiple LLMs
- **Firebase Firestore**: NoSQL database for contact messages
- **httpx**: Async HTTP client for API requests

### DevOps & Tools
- **Git & GitHub**: Version control and source management
- **GitHub Actions**: Automated CI/CD pipelines
- **Vercel CLI**: Deployment and environment management
- **npm**: Frontend dependency management
- **pip**: Python package management
- **Stylelint**: CSS linting and code quality

---

## 📁 Project Structure

```
mangeshrautarchive/
├── src/                          # Frontend Source Code
│   ├── index.html                # Main Entry Point (2,576 lines)
│   ├── assets/                   # Static Assets
│   │   ├── css/                  # Modular Stylesheets (18 files)
│   │   │   ├── style.css         # Global Styles (5,013 lines)
│   │   │   ├── chatbot-complete.css  # iMessage Chatbot (720 lines)
│   │   │   ├── dark-mode-enhanced.css # Dark Mode (504 lines)
│   │   │   ├── theme-background-fix.css # Theme Consistency
│   │   │   ├── fixes-2025.css    # 2025 Enhancements
│   │   │   ├── homepage.css      # Hero Section
│   │   │   ├── about.css         # About Section
│   │   │   ├── experience.css    # Experience Timeline
│   │   │   ├── projects.css      # Projects Grid
│   │   │   ├── education.css     # Education Cards
│   │   │   ├── publications.css  # Publications List
│   │   │   ├── awards.css        # Awards Section
│   │   │   ├── recommendations.css # Testimonials
│   │   │   ├── certifications.css # Certifications
│   │   │   ├── blog.css          # Blog Posts
│   │   │   ├── contact-mobile-fix.css # Contact Form
│   │   │   ├── calendar.css      # Calendar Widget
│   │   │   └── dark-mode-cards.css # Card Styling
│   │   ├── images/               # Images & Icons
│   │   └── files/                # Downloads (Resume)
│   └── js/                       # JavaScript Modules
│       ├── core/                 # Core Logic
│       │   ├── script.js         # Main Chat UI (1,484 lines)
│       │   ├── chat.js           # Chat Assistant
│       │   └── config.js         # Configuration
│       ├── modules/              # Feature Modules
│       │   ├── chatbot-upgrade-2025.js # Enhanced Features
│       │   ├── github-projects.js # GitHub Integration
│       │   ├── skills-visualization.js # Skills Display
│       │   ├── contact.js        # Contact Form
│       │   ├── overlay.js        # Navigation
│       │   └── external-config.js # API Keys
│       └── utils/                # Utilities
│           ├── theme.js          # Theme Switching
│           └── scroll.js         # Smooth Scrolling
├── api/                          # Backend Source Code
│   ├── index.py                  # FastAPI Application (507 lines)
│   └── __init__.py               # Package Initialization
├── scripts/                      # Utility Scripts
│   ├── run-local-server.sh       # Local Development
│   └── ...
├── vercel.json                   # Vercel Configuration
├── requirements.txt              # Python Dependencies
├── package.json                  # Node.js Dependencies
├── .stylelintrc.json             # CSS Linting Config
└── README.md                     # Project Documentation
```

---

## 🚀 Deployment & Setup

### 1. Hybrid Deployment Architecture
This project uses a **hybrid approach** for optimal performance:
- **Frontend**: Hosted on **GitHub Pages** (static files served from global CDN)
- **Backend**: Hosted on **Vercel** (serverless Python functions)
- **API Routing**: Vercel proxies `/api/*` to FastAPI backend

### 2. Environment Variables

**Required in Vercel Dashboard:**
```bash
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_SITE_URL=https://mangeshraut.pro
OPENROUTER_SITE_TITLE=Mangesh Raut Portfolio
```

**Optional for Firebase:**
```bash
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
```

### 3. Local Development

#### **Prerequisites**
- Node.js 18+ and npm
- Python 3.9+
- Git

#### **Setup Steps**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mangeshraut712/mangeshrautarchive.git
   cd mangeshrautarchive
   ```

2. **Install Dependencies**:
   ```bash
   # Frontend tools
   npm install
   
   # Backend dependencies
   pip install -r requirements.txt
   ```

3. **Create `.env` file** (for local testing):
   ```bash
   OPENROUTER_API_KEY=your_api_key_here
   OPENROUTER_SITE_URL=http://localhost:8000
   OPENROUTER_SITE_TITLE=Local Dev
   ```

4. **Run the Development Server**:
   ```bash
   # Option 1: Using the script
   ./run-local-server.sh
   
   # Option 2: Manual start
   uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access the Application**:
   - Open `http://localhost:8000` in your browser
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/api/health`

---

## 🔗 Live Links

| Service | URL | Description |
|---------|-----|-------------|
| **🌐 Custom Domain** | [mangeshraut.pro](https://mangeshraut.pro) | Primary production URL |
| **⚡ Vercel App** | [mangeshrautarchive.vercel.app](https://mangeshrautarchive.vercel.app/) | Backend & Alternative Frontend |
| **📄 GitHub Pages** | [mangeshraut712.github.io](https://mangeshraut712.github.io/mangeshrautarchive/) | Static Frontend Mirror |
| **🔧 API Health** | [API Status](https://mangeshrautarchive.vercel.app/api/health) | Backend Health Check |
| **📚 API Docs** | [Swagger UI](https://mangeshrautarchive.vercel.app/docs) | Interactive API Documentation |

---

## 🎯 Performance & Optimization

### **Lighthouse Scores**
- ⚡ **Performance**: 95+
- ♿ **Accessibility**: 95+
- 🎨 **Best Practices**: 95+
- 🔍 **SEO**: 95+

### **Optimization Techniques**
- **Zero-Bundle**: Native ES Modules for faster load times
- **Code Splitting**: Modular CSS and JS architecture
- **Lazy Loading**: Images and components loaded on demand
- **Efficient Caching**: 
  - LRU cache for GitHub API responses
  - Browser caching for static assets
- **Minification**: Production builds are minified
- **CDN Delivery**: Global edge network via GitHub Pages/Vercel
- **requestAnimationFrame**: GPU-accelerated animations
- **Debouncing**: Optimized event handlers for better performance

### **Bundle Sizes**
- **HTML**: ~123 KB (main page)
- **CSS**: ~200 KB (all stylesheets combined)
- **JavaScript**: ~150 KB (all modules)
- **Total First Load**: < 500 KB

---

## 🎨 Design System

### **Color Palette**

#### **Dark Mode**
```css
--color-bg-primary: #000000;        /* Pure black */
--color-text-primary: #ffffff;      /* White text */
--color-accent: #0a84ff;            /* Bright blue */
--color-success: #32d74b;           /* Green */
--color-warning: #ff9f0a;           /* Orange */
--color-error: #ff453a;             /* Red */
```

#### **Light Mode**
```css
--color-bg-primary: #ffffff;        /* Pure white */
--color-text-primary: #1d1d1f;      /* Dark gray */
--color-accent: #007aff;            /* Blue */
--color-success: #34c759;           /* Green */
--color-warning: #ff9500;           /* Orange */
--color-error: #ff3b30;             /* Red */
```

### **Typography**
- **Primary Font**: -apple-system, BlinkMacSystemFont, "SF Pro Display"
- **Monospace**: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono"
- **Headings**: 600-800 weight, -0.5px letter spacing
- **Body**: 400 weight, 1.5-1.8 line height

---

## 🚀 Recent Updates (2025)

### **v3.0 - Premium iMessage Chatbot** (Nov 2025)
- ✨ Complete chatbot redesign with iMessage liquid glass aesthetic
- 🎨 Solid color buttons (red close, blue send, green voice)
- 🏷️ S2R badge with white background for visibility
- 🧹 Removed 120+ lines of duplicate/conflicting CSS
- ⚡ Zero input lag with requestAnimationFrame optimization
- 📱 Perfect mobile responsiveness

### **v2.5 - Theme Consistency** (Nov 2025)
- 🌓 Fixed dark mode to solid black (#000000) throughout
- ☀️ Fixed light mode to pure white (#ffffff) throughout
- 🎯 Removed all blue glowing effects and gradients
- 🔧 Centralized chatbot styling in single file
- 📊 Comprehensive theme verification

### **v2.0 - 2025 Chatbot Upgrade** (Nov 2025)
- 🤖 Integrated streaming responses with Grok 4.1 Fast
- 💬 Added message metadata and action buttons
- 🎤 Voice integration with S2R badge
- 📝 Markdown and code highlighting support
- 🎨 Enhanced UI with smart suggestions

---

## 📊 Project Statistics

- **Total Lines of Code**: ~15,000+
- **CSS Files**: 18 modular stylesheets
- **JavaScript Modules**: 12+ feature modules
- **Sections**: 13 portfolio sections
- **Supported Languages**: 100+ (code highlighting)
- **API Endpoints**: 3 (chat, health, contact)
- **Deployment Targets**: 3 (GitHub Pages, Vercel, Custom Domain)

---

## 🔐 Security Features

- **API Key Protection**: Environment variables on serverless backend
- **CORS Configuration**: Restricted to allowed origins
- **Rate Limiting**: Prevents API abuse
- **Input Sanitization**: DOMPurify for HTML content
- **Firebase Security Rules**: Write-only access for contact form
- **HTTPS Everywhere**: All deployments use SSL/TLS

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Licensed under the **MIT License**. Feel free to use this code for your own portfolio!

See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenRouter**: For providing unified LLM API access
- **Vercel**: For serverless hosting and edge functions
- **GitHub**: For version control and Pages hosting
- **Firebase**: For real-time database services
- **Prism.js**: For beautiful code syntax highlighting
- **Font Awesome**: For comprehensive icon library

---

## 👨‍💻 Author

**Mangesh Raut**  
*Software Developer Engineer | Full-Stack Developer | AI Enthusiast*

- 🌐 **Portfolio**: [mangeshraut.pro](https://mangeshraut.pro)
- 💼 **LinkedIn**: [Mangesh Raut](https://linkedin.com/in/mangeshraut71298)
- 🐙 **GitHub**: [@mangeshraut712](https://github.com/mangeshraut712)
- 📧 **Email**: mangeshraut71298@gmail.com

---

## 📞 Support

For issues, questions, or suggestions:
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/mangeshraut712/mangeshrautarchive/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/mangeshraut712/mangeshrautarchive/discussions)
- 📧 **Email**: mangeshraut71298@gmail.com

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ by Mangesh Raut

</div>

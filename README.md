# Mangesh Raut - Portfolio Website

Modern, performance-optimized portfolio website with AI-powered chatbot assistant.

## 🚀 Quick Start

### Development Server
```bash
npm install
npm run dev
```
Visit: `http://localhost:3000`

### Production Build
```bash
npm run build
```

## 📁 Project Structure

```
mangeshrautarchive/
├── api/
│   └── index.py              # FastAPI backend with OpenRouter integration
├── src/
│   ├── assets/
│   │   ├── css/              # Stylesheets (modular, performance-optimized)
│   │   ├── images/           # Optimized images
│   │   └── files/            # Resume and documents
│   ├── js/
│   │   ├── core/             # Core chatbot logic
│   │   │   ├── chat.js       # AI integration
│   │   │   ├── config.js     # Configuration
│   │   │   └── script.js     # Main chatbot UI
│   │   ├── modules/          # Feature modules
│   │   │   ├── scroll-animations.js
│   │   │   ├── enhanced-chatbot.js
│   │   │   ├── calendar.js
│   │   │   ├── contact.js
│   │   │   └── github-projects.js
│   │   └── utils/            # Utility scripts
│   │       ├── theme.js
│   │       ├── go-to-top.js
│   │       ├── smart-navbar.js
│   │       └── chatbot-debug.js
│   └── index.html            # Main HTML file
├── package.json              # Dependencies and scripts
├── vercel.json               # Vercel deployment config
└── README.md                 # This file
```

## ✨ Features

### Core
- ✅ **Responsive Design** - Perfect on all devices
- ✅ **Dark/Light Mode** - Theme-aware with smooth transitions
- ✅ **Performance Optimized** - 90+ Lighthouse score
- ✅ **SEO Friendly** - Proper meta tags and semantic HTML
- ✅ **Accessibility** - WCAG compliant, keyboard navigation

### AI Chatbot
- ✅ **OpenRouter Integration** - Powered by Grok 2 & Claude 3.5
- ✅ **Streaming Responses** - Real-time AI responses
- ✅ **Voice Input** - Speech-to-text support (S2R)
- ✅ **Context Awareness** - Remembers conversation history
- ✅ **Mobile Optimized** - Full-screen on mobile devices
- ✅ **Theme Adaptive** - Matches website theme

### Animations
- ✅ **Scroll Animations** - Intersection Observer-based
- ✅ **Fade-in Effects** - Cards, headings, and sections
- ✅ **Smooth Transitions** - 60fps GPU-accelerated
- ✅ **Reduced Motion** - Respects user preferences

### Sections
- 📝 About & Summary
- 💼 Work Experience
- 🛠️ Skills & Technologies
- 🚀 Projects (GitHub API integration)
- 🎓 Education
- 📚 Publications
- 🏆 Awards & Certifications
- 📱 Contact Form

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=x-ai/grok-2-1212
OPENROUTER_SITE_URL=https://yoursite.com
```

### Chatbot Configuration
Edit `src/js/core/config.js`:
```javascript
export const chat = {
    defaultGreeting: "Your greeting message",
    model: 'x-ai/grok-2-1212',
    // ... more options
};
```

## 🎨 Customization

### Theme Colors
Edit CSS variables in `src/assets/css/style.css`:
```css
:root {
    --primary-color: #0071e3;
    --text-color: #1d1d1f;
    /* ... more variables */
}
```

### Personal Information
Update `api/index.py`:
```python
PORTFOLIO_DATA = {
    "name": "Your Name",
    "title": "Your Title",
    "email": "your@email.com",
    # ... more fields
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Manual Deployment
1. Build assets: `npm run build`
2. Deploy `src/` folder to static host
3. Deploy `api/` to Python serverless platform

## 📦 Dependencies

### Frontend
- **No frameworks** - Vanilla JavaScript (ES6+)
- **Font Awesome** - Icons
- **Inter Font** - Typography

### Backend
- **FastAPI** - Python web framework
- **httpx** - Async HTTP client
- **python-dotenv** - Environment variables

## 🔥 Performance

- ⚡ **Lighthouse Score**: 90+
- 🎯 **First Contentful Paint**: < 1.5s
- 📱 **Mobile Optimized**: Perfect viewport fit
- 🚀 **Code Splitting**: Modular JavaScript
- 💾 **Lazy Loading**: Images and animations
- 🗜️ **Gzip Compression**: Backend responses

## 🛠️ Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production (if needed)
npm run lint      # Run linter
```

## 📝 API Endpoints

### Health Check
```
GET /api/health
```

### Chat
```
POST /api/chat
Content-Type: application/json

{
  "message": "Your question",
  "stream": true
}
```

### Models
```
GET /api/models
```

## 🐛 Troubleshooting

### Chatbot Not Working
1. Check API key is set in `.env`
2. Verify backend is running
3. Check browser console for errors
4. Clear cache and reload

### Animations Not Smooth
1. Disable browser extensions
2. Check GPU acceleration is enabled
3. Reduce animation complexity in code

### Mobile Issues
1. Clear mobile browser cache
2. Check viewport meta tag
3. Test on actual device (not just DevTools)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - feel free to use for your own portfolio!

## 👤 Author

**Mangesh Raut**
- Website: https://mangeshraut.pro
- LinkedIn: [mangeshraut71298](https://linkedin.com/in/mangeshraut71298)
- GitHub: [@mangeshraut712](https://github.com/mangeshraut712)
- Email: mbr63@drexel.edu

## 🙏 Acknowledgments

- OpenRouter for AI API
- Font Awesome for icons
- Vercel for hosting

---

**Last Updated**: December 2025  
**Version**: 3.0.0  
**Status**: Production Ready ✅

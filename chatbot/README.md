# 🤖 AssistMe Chatbot Module

**Version**: 2.0  
**Design**: Apple-inspired (Light & Dark Mode)  
**Status**: Production-ready

---

## 📁 Folder Structure

```
chatbot/
├── README.md                 # This file
├── styles/                   # All CSS files
│   ├── chatbot.css          # Main chatbot styles
│   ├── dark-mode.css        # Dark mode overrides
│   └── animations.css       # Smooth animations
├── scripts/                  # All JavaScript files
│   ├── chatbot-core.js      # Core chatbot logic
│   ├── chatbot-ui.js        # UI interactions
│   ├── chatbot-api.js       # API communication
│   └── voice-handler.js     # Voice functionality
├── components/               # Reusable components
│   └── chatbot-widget.html  # Chatbot HTML template
├── config/                   # Configuration files
│   └── chatbot-config.js    # Settings & API endpoints
└── docs/                     # Documentation
    ├── SETUP.md             # Setup guide
    ├── API.md               # API documentation
    └── TROUBLESHOOTING.md   # Common issues & fixes
```

---

## 🚀 Quick Start

### 1. Include in HTML

```html
<!-- In <head> -->
<link rel="stylesheet" href="chatbot/styles/chatbot.css">

<!-- Before </body> -->
<script type="module" src="chatbot/scripts/chatbot-core.js"></script>
```

### 2. Initialize

```javascript
import { initChatbot } from './chatbot/scripts/chatbot-core.js';

// Initialize chatbot
initChatbot({
  apiUrl: 'https://your-api.vercel.app',
  darkMode: 'auto', // 'auto', 'light', 'dark'
  voiceEnabled: true
});
```

---

## 🎨 Features

- ✅ Apple-inspired design
- ✅ Dark mode support (auto-detect)
- ✅ Glass morphism effect
- ✅ Voice input & output (S2R)
- ✅ Smooth animations
- ✅ Mobile responsive
- ✅ Accessibility (ARIA)
- ✅ API integration
- ✅ Error handling

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Installation & configuration
- **[API Docs](docs/API.md)** - API endpoints & responses
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues

---

## 🐛 Debugging

### Check Console Logs

```javascript
// Enable debug mode in config
window.CHATBOT_DEBUG = true;
```

### Common Issues

1. **Chatbot not opening**
   - Check if CSS is loaded
   - Verify JavaScript is initialized
   - Check browser console for errors

2. **API not responding**
   - Verify API URL in config
   - Check CORS headers
   - Test API endpoint manually

3. **Styling issues**
   - Clear browser cache
   - Check CSS load order
   - Verify z-index values

---

## 🎯 Design Principles

### Apple Design System

- **Colors**: Blue (#007aff), Green (#34c759)
- **Typography**: SF Pro Text, -apple-system
- **Spacing**: 8px grid system
- **Animations**: Cubic-bezier easing
- **Effects**: Glass morphism, subtle shadows

### Dark Mode

- Auto-detects system preference
- Smooth transitions
- Proper contrast ratios
- Accessible colors

---

## 🔧 Customization

### Change Colors

Edit `chatbot/config/chatbot-config.js`:

```javascript
export const theme = {
  primary: '#007aff',
  success: '#34c759',
  // ... more colors
};
```

### Modify Layout

Edit `chatbot/styles/chatbot.css`:

```css
#chatbot-widget {
  width: 400px;  /* Change width */
  height: 640px; /* Change height */
}
```

---

## 📦 Dependencies

- None! Pure vanilla JavaScript
- No external libraries required
- Works in all modern browsers

---

## 📄 License

MIT License - Part of Mangesh Raut Portfolio

---

**Last Updated**: October 2025  
**Maintainer**: Mangesh Raut

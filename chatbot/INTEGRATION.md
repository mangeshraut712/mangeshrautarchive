# 🔌 Integrating Chatbot into Portfolio

Complete guide to integrate the chatbot module into the main portfolio website.

---

## 📁 File Structure After Integration

```
portfolio/
├── chatbot/                    # Chatbot module (standalone)
│   ├── README.md
│   ├── chatbot-init.js        # Auto-init script
│   ├── config/
│   │   └── chatbot-config.js
│   ├── styles/
│   │   └── chatbot.css
│   ├── scripts/
│   │   ├── chatbot-core.js
│   │   ├── chatbot-ui.js
│   │   └── chatbot-api.js
│   ├── components/
│   │   └── chatbot-widget.html
│   └── docs/
│
├── src/                        # Main website
│   ├── index.html             # Updated with chatbot
│   ├── assets/
│   └── js/
│
└── api/                        # Backend (Vercel)
    ├── chat.js
    └── chat-service.js
```

---

## 🚀 Integration Steps

### 1. Update `src/index.html`

**Add before `</head>`:**

```html
<!-- Chatbot Styles -->
<link rel="stylesheet" href="../chatbot/styles/chatbot.css">
```

**Add before `</body>`:**

```html
<!-- Chatbot Widget -->
<button id="chatbot-toggle" type="button" aria-label="Open AssistMe chat">
  <i class="fas fa-comment-dots"></i>
</button>

<div id="chatbot-widget" class="hidden" role="dialog">
  <div class="chatbot-header">
    <div class="chatbot-header-content">
      <h3>AssistMe</h3>
      <p>AI Assistant</p>
    </div>
    <button class="chatbot-close-btn" aria-label="Close chat">
      <i class="fas fa-times"></i>
    </button>
  </div>

  <div id="chatbot-messages" aria-live="polite"></div>

  <form class="chatbot-input-area" id="chatbot-form">
    <input type="text" id="chatbot-input" placeholder="Ask me anything..." />
    <button type="submit" class="chatbot-btn chatbot-send-btn">
      <i class="fas fa-paper-plane"></i>
    </button>
    <button type="button" class="chatbot-btn chatbot-voice-btn" id="chatbot-voice-btn">
      <i class="fas fa-microphone"></i>
      <span class="chatbot-voice-badge">S2R</span>
    </button>
  </form>
</div>

<!-- Chatbot Scripts -->
<script type="module" src="../chatbot/chatbot-init.js"></script>
```

### 2. Remove Old Chatbot Files

```bash
# Remove old chatbot CSS
rm src/assets/css/chatbot-complete.css
rm src/assets/css/chatbot-override.css

# Remove old chatbot JS
rm src/js/core/chat.js

# Keep voice-manager.js if used separately
```

### 3. Update Paths in Config

Edit `chatbot/config/chatbot-config.js`:

```javascript
api: {
  baseUrl: 'https://mangeshrautarchive.vercel.app',
  endpoints: {
    chat: '/api/chat',
    status: '/api/status'
  }
}
```

---

## ✅ Verification

### Check Integration

1. **Open website**
   ```
   http://localhost:8000/src/index.html
   ```

2. **Check console**
   - Should see: "🚀 Starting chatbot initialization..."
   - Should see: "✅ AssistMe Chatbot initialized successfully!"

3. **Test chatbot**
   - Click toggle button
   - Widget should open
   - Send a test message
   - Should get response

4. **Test dark mode**
   - Toggle website dark mode
   - Chatbot should adapt

5. **Test mobile**
   - Resize to < 768px
   - Chatbot should be responsive

---

## 🎨 Styling Integration

### Ensure No Conflicts

The chatbot CSS uses:
- Prefixed classes (`.chatbot-*`)
- CSS variables (`--chatbot-*`)
- High z-index (`9997-9998`)

**If you have conflicts:**

1. **Load chatbot CSS last**
2. **Use `!important` sparingly**
3. **Check browser inspector**

### Dark Mode Sync

If your website has dark mode toggle:

```javascript
// In your theme.js or similar
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  
  // Save preference
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  localStorage.setItem('chatbot-theme', isDark ? 'dark' : 'light');
}
```

---

## 🐛 Common Issues

### Chatbot not showing

**Check:**
1. HTML elements present
2. CSS loaded
3. JavaScript initialized
4. Console for errors

### Paths not working

**Fix paths:**
```html
<!-- If in src/index.html -->
<link rel="stylesheet" href="../chatbot/styles/chatbot.css">
<script type="module" src="../chatbot/chatbot-init.js"></script>
```

### API not connecting

**Check config:**
```javascript
// chatbot/config/chatbot-config.js
api: {
  baseUrl: 'https://your-actual-api.vercel.app'
}
```

---

## 📦 Deployment

### GitHub Pages

```bash
# Commit changes
git add .
git commit -m "Integrate standalone chatbot module"
git push origin main

# Deploys automatically
```

### Vercel

No changes needed for backend.

---

## 📚 Next Steps

- [Customize chatbot](README.md#customization)
- [Add voice features](docs/SETUP.md#voice)
- [Debug issues](docs/TROUBLESHOOTING.md)

---

**Integration complete!** ✅

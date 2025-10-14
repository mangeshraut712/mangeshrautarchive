# 🚀 How to Run the Portfolio Project Locally

**Date**: October 13, 2025

---

## 🎯 QUICK START

### Option 1: Using Python (Recommended)

```bash
cd src
python3 -m http.server 8000
```

**Visit**: http://localhost:8000

---

### Option 2: Using the Run Script

```bash
./run-local-server.sh
```

**Visit**: http://localhost:8000

---

### Option 3: Using Node.js

```bash
npx http-server src -p 8000
```

**Visit**: http://localhost:8000

---

## 📋 WHAT YOU'LL SEE

### Homepage
- Modern portfolio design
- About, Skills, Projects, Contact sections
- Dark/Light mode toggle
- Smooth animations

### Chatbot
- **Location**: Bottom-right corner (200px from bottom, 60px from right)
- **Icon**: Blue circular button with chat icon
- **Position**: Fixed (stays on scroll like navbar)

---

## 🧪 TESTING THE CHATBOT

### Step 1: Find the Icon
- Look for blue circular button
- Bottom-right corner
- 200px from bottom, 60px from right
- Pulsing animation

### Step 2: Click to Open
- Click the blue button
- Widget should appear above it
- See "AssistMe" title
- See "AI Assistant" subtitle

### Step 3: Test Messages
- Type: "Who is Mangesh Raut?"
- Click send button (📤)
- Or press Enter
- See your message (blue, right)
- See bot response (gray, left)

### Step 4: Check Console
Open DevTools (F12) and verify:
```
✅ "🚀 FIXING chatbot with inline override..."
✅ "✅ Elements found - Resetting handlers"
✅ "✅ Chatbot FIXED and ready!"

[After clicking]
✅ "🔄 TOGGLE clicked - isHidden: true"
✅ "✅ OPENED - Widget should be visible now!"
```

---

## 🔧 BACKEND (API)

### Local Development
The backend API is hosted on Vercel and will work automatically:
- **URL**: https://mangeshrautarchive.vercel.app
- **Endpoint**: /api/chat
- **Model**: OpenRouter + Gemini 2.0 Flash

### Testing API
```bash
curl -X POST https://mangeshrautarchive.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

Expected response:
```json
{
  "answer": "Hello! I'm AssistMe...",
  "source": "OpenRouter",
  "model": "Gemini 2.0 Flash",
  "category": "General Knowledge",
  "confidence": 0.90,
  "runtime": "450ms"
}
```

---

## 📱 FEATURES TO TEST

### 1. Navigation
- Click menu items (About, Skills, Projects, Contact)
- Test smooth scrolling
- Verify navbar stays on top when scrolling

### 2. Dark Mode
- Toggle dark/light mode (top-right)
- Check all colors adapt
- Verify chatbot adapts too

### 3. Chatbot
- Open/close toggle
- Send messages
- Check responses
- Test voice button (shows "coming soon" alert)

### 4. Contact Form
- Fill out contact form
- Test Firebase integration
- Check validation

### 5. Animations
- Scroll down page
- Watch sections fade in
- Verify smooth performance

---

## 🐛 TROUBLESHOOTING

### Chatbot Not Opening?
1. **Hard refresh**: CTRL+F5 or CMD+SHIFT+R
2. **Check console**: Look for "FIXING chatbot" logs
3. **Clear cache**: Browser settings → Clear cache
4. **Try incognito**: Test in private window

### CSS Not Loading?
1. Check Network tab (F12 → Network)
2. Verify all CSS files return 200 OK
3. Hard refresh to bypass cache

### API Not Working?
1. Check Network tab for API calls
2. Verify Vercel backend is up
3. Check CORS headers in response

---

## 📊 PROJECT STRUCTURE

```
src/
├── index.html           ← Main page (start here)
├── assets/
│   ├── css/            ← Stylesheets
│   ├── images/         ← Images
│   └── files/          ← PDFs, documents
├── js/
│   ├── core/           ← Core functionality
│   ├── modules/        ← Feature modules
│   └── utils/          ← Utilities
└── chatbot/            ← Chatbot module
    ├── styles/         ← Chatbot CSS
    ├── scripts/        ← Chatbot JS
    └── components/     ← Chatbot HTML

api/
├── chat.js             ← Main chat endpoint
├── chat-service.js     ← AI processing
└── status.js           ← Status check
```

---

## 🌐 PRODUCTION URLs

**Frontend (GitHub Pages)**:
- https://mangeshraut712.github.io/mangeshrautarchive/

**Backend (Vercel)**:
- https://mangeshrautarchive.vercel.app
- API: https://mangeshrautarchive.vercel.app/api/chat

---

## ⚡ QUICK COMMANDS

```bash
# Run local server
./run-local-server.sh

# Or manually
cd src && python3 -m http.server 8000

# Test API
curl -X POST https://mangeshrautarchive.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Check files
ls -la src/
ls -la api/
```

---

## ✅ CHECKLIST

After running locally:
- [ ] Server starts on port 8000
- [ ] Homepage loads at http://localhost:8000
- [ ] All CSS and images load
- [ ] Navigation works
- [ ] Chatbot icon visible (200px from bottom)
- [ ] Chatbot opens on click
- [ ] Messages can be sent
- [ ] Responses display correctly

---

## 🎊 YOU'RE READY!

**Run the project**:
```bash
./run-local-server.sh
```

**Then visit**: http://localhost:8000

**Test everything and let me know if you see any issues!** 🚀

---

**Created**: October 13, 2025  
**Server**: Python 3 HTTP Server  
**Port**: 8000

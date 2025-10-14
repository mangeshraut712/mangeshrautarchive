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

## 🧪 TESTING THE CHATBOT

After starting server, test these features:

### Visual Check
1. Find chatbot icon (blue circle, bottom-right)
2. Position: 200px from bottom, 60px from right
3. Should be away from footer social links

### Functionality Check
1. Click toggle → Widget opens
2. See "AssistMe" title
3. Type message → Send
4. See blue bubble (your message)
5. See gray bubble (bot response)
6. Click close → Widget hides

### Console Check (F12)
Expected logs:
```
🚀 FIXING chatbot with inline override...
✅ Elements found - Resetting handlers
✅ Chatbot FIXED and ready!
[Click toggle]
🔄 TOGGLE clicked - isHidden: true
✅ OPENED - Widget should be visible now!
```

---

## 🔧 BACKEND API

Backend is on Vercel (works from localhost):
- **URL**: https://mangeshrautarchive.vercel.app
- **Endpoint**: /api/chat
- **Model**: OpenRouter + Gemini 2.0 Flash

CORS is configured for localhost!

---

**Ready to run!** 🚀

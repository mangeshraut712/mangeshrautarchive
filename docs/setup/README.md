# ⚙️ Setup Guide

How to set up the portfolio project for local development.

---

## 📋 Prerequisites

- Node.js 16+ 
- Git
- Code editor (VS Code recommended)

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/mangeshraut712/mangeshrautarchive.git
cd mangeshrautarchive
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

#### For Vercel (Backend):

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Settings → Environment Variables
4. Add:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

#### For Local Development:

Create `.env.local` (git-ignored):
```env
OPENROUTER_API_KEY=your_api_key_here
```

### 4. Start Development Server

```bash
npm start
```

Visit: `http://localhost:3000`

---

## 🔑 Getting API Keys

### OpenRouter

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Copy and save securely

---

## ✅ Verify Setup

Test the chatbot:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

Should return JSON with AI response.

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
npm start
```

**Module not found:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**API not working:**
- Check environment variables
- Verify API key is valid
- Check Vercel deployment logs

---

## 📚 Next Steps

- [Deployment Guide](../deployment/)
- [API Documentation](../api/)
- [Customization Guide](../guides/)

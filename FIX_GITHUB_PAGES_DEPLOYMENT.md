# 🚨 **Fix GitHub Pages Deployment Issues**

## Current Problems Identified

### ❌ **Issues from Your Live Test:**

1. **Wrong Model**: Still showing `deepseek/deepseek-chat-v3.1:free` (old model)
2. **API Not Working**: Most questions fall back to offline responses
3. **Environment Variables**: Not properly configured for GitHub Pages

---

## 🔧 **Step-by-Step Fix**

### **Step 1: Update Repository Environment Variables**

**Method A: Using GitHub Actions (Recommended)**
1. Go to: **Repository → Settings → Secrets and Variables → Actions**
2. Add **Repository Secrets** (not Environment Variables):
   - Name: `OPENROUTER_API_KEY`
   - Value: `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`
3. Create/update `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          OPENROUTER_SITE_URL: https://mangeshraut712.github.io/mangeshrautarchive
          OPENROUTER_APP_TITLE: AssistMe Portfolio Assistant

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### **Step 2: Force Redeploy**

```bash
# Commit and push the workflow
git add .
git commit -m "Add GitHub Pages deployment with environment variables"
git push origin main
```

### **Step 3: Verify Environment Variables Are Set**

**Check Build Logs:**
1. Go to **Repository → Actions**
2. Click latest workflow run
3. Check if environment variables appear in build logs

---

## 🔍 **Debugging Commands**

### **Test Your Live Site:**

```bash
# Test model detection
curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"what model are you using"}' | jq .

# Should return your pinned model: openai/gpt-oss-20b:free
```

### **Test API Functionality:**

```bash
# Test if API is working at all
curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}' | jq .
```

### **Check Response Types:**

```bash
# This should NOT fall back to offline when API is working
curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"what is 2+2"}' | jq '.source'
# Should return: "openrouter", not "offline-knowledge"
```

---

## ⚙️ **Alternative: Manual Environment Variable Method**

If Actions don't work, use build-time replacement:

### **1. Update vercel.json for GitHub Pages:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "OPENROUTER_API_KEY": "@openrouter_api_key",
    "OPENROUTER_SITE_URL": "https://mangeshraut712.github.io/mangeshrautarchive",
    "OPENROUTER_APP_TITLE": "AssistMe Portfolio Assistant"
  }
}
```

### **2. Build Script Update:**
Update your build process to replace `@openrouter_api_key` with actual key.

---

## 🐛 **Common Issues & Fixes**

### **Issue: "Rate limit exceeded"**
```json
{"error":{"message":"Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day"}}
```
**Fix:** Either:
- Add credits to OpenRouter account
- Use different model: `OPENROUTER_MODEL=anthropic/claude-3-haiku:beta`
- Or wait for quota reset

### **Issue: Model still showing as deepseek/deepseek-chat-v3.1:free**
**Cause:** Environment variable not set during build
**Fix:** Ensure workflow includes env variables

### **Issue: All responses are "I'm here to help!"**
**Cause:** OpenRouter API calls failing
**Fix:** Check API key is correctly set and has credits

---

## 📊 **Expected Results After Fix**

### **Model Query Response:**
```json
{
  "answer": "I am currently running on OpenRouter using the model: openai/gpt-oss-20b:free (configured via environment variable).",
  "source": "curated-fact (system status)",
  "type": "general",
  "confidence": 0.98
}
```

### **Regular Questions:**
```json
{
  "answer": "2 + 2 = 4. That's basic arithmetic!",
  "source": "openrouter",
  "type": "math",
  "confidence": 0.92
}
```

---

## 🎯 **Quick Test Checklist**

- [ ] **Redeploy** with GitHub Actions workflow
- [ ] **Check** Actions tab for successful build
- [ ] **Verify** model query shows correct model
- [ ] **Test** simple math question returns live response
- [ ] **Confirm** API key never appears in browser

---

## 🚀 **Working Configuration**

Once fixed, your setup will be:
- **Model**: `openai/gpt-oss-20b:free` (pinned via environment)
- **Site URL**: `https://mangeshraut712.github.io/mangeshrautarchive`
- **API**: Working without rate limits
- **Security**: API key never exposed

Run the tests above and report back with the results! 🔧✨

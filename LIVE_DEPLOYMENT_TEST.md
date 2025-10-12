# 🚀 **Live Deployment Model Testing Guide**

## Testing OpenRouter Models on Production Sites

### ✅ **Security First - Never Expose API Keys**
- API keys are stored securely in platform environment variables
- No keys in code, repositories, or browser requests
- All testing done through deployed APIs

---

## 🧪 **Testing Environment Override vs Random Selection**

### **Current Setup (.env has OPENROUTER_MODEL set to gpt-ossip)**
Your `.env` has `OPENROUTER_MODEL=openai/gpt-oss-20b:free` - this means your site uses **deterministic selection**.

### **To Test Random Selection**
1. **Remove or comment out** `OPENROUTER_MODEL` in your `.env` file locally
2. **Redeploy** to see random selection in action

---

## 🐙 **GitHub Pages Testing**

### **1. Deploy to GitHub Pages**
```bash
# Build and deploy
npm run build
# Deploy via GitHub Actions or manually
```

### **2. Add Environment Variables**
- Go to: **Repository Settings → Secrets and Variables → Actions**
- Add secret: `OPENROUTER_API_KEY=sk-or-v1-...your-key...`
- For manual builds, ensure your build script handles env variables

### **3. Test Live Site**

**Test 1: Check model selection mode**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What model are you using?"}'
```

**Test 2: Test different prompts multiple times (to see random models)**
```bash
# Run 5 times to see model rotation
for i in {1..5}; do
  echo "Test $i:"
  curl -s https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"What is 2+2? Show your work."}' | jq -r '.answer'
  echo -e "\n"
done
```

---

## ☁️ **Vercel Testing**

### **1. Deploy to Vercel**
```bash
vercel --prod
# or push to main branch with Git integration
```

### **2. Configure Environment Variables**
- Go to: **Vercel Dashboard → Project → Settings → Environment Variables**
- Add:
  ```
  OPENROUTER_API_KEY = sk-or-v1-...your-full-key...
  OPENROUTER_SITE_URL = https://your-app.vercel.app
  OPENROUTER_APP_TITLE = AssistMe Portfolio Assistant
  OPENROUTER_MODEL = [leave empty for random, or set for deterministic]
  ```

### **3. Test Live Vercel Deployment**

**Test 1: Model Selection Query**
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"what model are you currently running on?"}'
```

**Test 2: Functional Test (Mathematics)**
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Calculate 15 * 7 and explain the steps"}'
```

**Test 3: Technical Question**
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the difference between REST and GraphQL APIs?"}'
```

---

## 🔄 **Testing Random Model Distribution**

### **Automated Testing Script**
```bash
#!/bin/bash
# test-models.sh
echo "🧪 Testing Model Distribution Over 10 Requests"
echo "=============================================="

for i in {1..10}; do
  echo -n "Test $i: "
  result=$(curl -s https://your-domain.com/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"quick calculation: 10+5"}')
  echo $result | jq -r '.source'
done | sort | uniq -c
```

### **Expected Output (Random Mode)**
```
      3 openrouter
      4 openrouter
      3 openrouter
```
*Note: All responses should be "openrouter" (not "fallback"), indicating API calls worked*

---

## 📊 **Response Analysis**

### **Check for Model-Specific Behavior**
```bash
# Test math problems (should work well with all models)
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Solve: ∫x²dx"}'

# Test reasoning (DeepSeek should excel here)
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain quantum computing to a beginner"}'

# Test efficiency (Gemma should be fast)
curl -s -w "\nTime: %{time_total}s\n" https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is machine learning?"}'
```

---

## 🔍 **Troubleshooting**

### **If Getting Fallback Responses**
```bash
# Check API key setup
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"status check"}'

# Should return "openrouter" source, not "offline-knowledge"
```

### **Rate Limiting**
- Free models by default have usage limits
- If hitting 429 errors, responses fall back to offline mode
- Consider upgrading or using different models for production

---

## 🎯 **Final Testing Checklist**

- [ ] Site loads successfully
- [ ] Chat interface works
- [ ] Model query shows correct selection mode
- [ ] Multiple requests demonstrate different model responses
- [ ] API key never appears in browser/network console
- [ ] No 500 errors or fallback responses
- [ ] Reasonable response times (<3 seconds)

---

## 🚦 **Switching Between Modes**

### **For Deterministic Selection (Production)**
Set `OPENROUTER_MODEL=openai/gpt-oss-20b:free` in environment variables.

### **For Random Selection (Development/Testing)**
Remove `OPENROUTER_MODEL` or set it to empty value.

Both modes work securely without exposing your API key! 🔒
